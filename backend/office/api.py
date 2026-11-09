import io
import re
from datetime import date, timedelta
from decimal import Decimal

import segno
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from accounts.api import password_link
from accounts.permissions import IsClient, IsStaffMember, Module, can
from notify.models import NotificationLog
from notify.service import notify_document_sent, notify_payment, notify_welcome

from . import serializers as s
from .models import (Client, CompanySettings, Credential, Document, Message, Payment, Project, ProjectUpdate, Review,
                     Subscriber, Task)
from .money import effective_status, totals
from accounts.models import NON_STAFF_ROLES

User = get_user_model()
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PublicThrottle(AnonRateThrottle):
    scope = "public"


def doc_qs():
    return Document.objects.select_related("client").prefetch_related("items", "payments")


# =================================================================== STAFF
class DashboardView(APIView):
    permission_classes = [IsStaffMember, Module.of("dashboard")]

    def get(self, request):
        u = request.user
        data = {"modules": {}}
        if can(u, "documents"):
            invoices = [d for d in doc_qs().filter(doc_type="invoice").exclude(status__in=["draft", "cancelled"])]
            inv, paid, out, overdue = Decimal(0), Decimal(0), Decimal(0), 0
            for d in invoices:
                t = totals(d)
                inv += t["total"]; paid += t["paid"]; out += t["balance"]
                overdue += effective_status(d, t) == "overdue"
            data["billing"] = {
                "invoiced": str(inv), "received": str(paid), "outstanding": str(out), "overdue": overdue,
                "proposals_open": Document.objects.filter(doc_type="proposal", status="sent").count(),
                "proposals_won": Document.objects.filter(doc_type="proposal", status="accepted").count(),
            }
            data["recent_documents"] = s.DocumentListSerializer(doc_qs()[:6], many=True).data
        if can(u, "inbox"):
            data["inbox"] = {"unread": Message.objects.filter(is_read=False).count(),
                             "pending_reviews": Review.objects.filter(approved=False).count(),
                             "subscribers": Subscriber.objects.count()}
        if can(u, "projects"):
            data["projects"] = {"active": visible_projects(u).exclude(status__in=["done"]).count()}
        my = Task.objects.filter(assignee=u).exclude(status="done").select_related("project", "assignee")[:10]
        data["my_tasks"] = s.TaskSerializer(my, many=True).data
        if can(u, "certificates"):
            data["certificates"] = Credential.objects.filter(status="valid").count()
        if can(u, "remote") or can(u, "payouts"):
            from remote.models import Submission, Withdrawal, Worker
            data["remote"] = {"to_review": Submission.objects.filter(status="pending").count(),
                              "withdrawals": Withdrawal.objects.filter(status="pending").count(),
                              "workers": Worker.objects.filter(status="active").count()}
        if can(u, "fees") or can(u, "learning"):
            from learn.models import Enrollment, FeePayment
            data["learning"] = {"fees_to_check": FeePayment.objects.filter(status="pending").count(),
                                "studying": Enrollment.objects.filter(status="active").count()}
        return Response(data)


class PeopleView(APIView):
    """Staff list for 'assign to' dropdowns."""
    permission_classes = [IsStaffMember]

    def get(self, request):
        qs = User.objects.filter(is_active=True).exclude(role__in=NON_STAFF_ROLES).order_by("first_name", "email")
        return Response(s.UserMini(qs, many=True).data)


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = s.ClientSerializer
    permission_classes = [IsStaffMember, Module.of("clients")]

    def get_queryset(self):
        qs = Client.objects.annotate(doc_count=Count("documents"))
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(company__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q))
        return qs

    def destroy(self, request, *args, **kwargs):
        c = self.get_object()
        if c.documents.exists() or c.projects.exists():
            raise ValidationError({"detail": "This client has proposals, invoices or projects, so it cannot be deleted."})
        if c.user:
            c.user.delete()
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        """Create (or reset) the client's portal login and send the set-password link."""
        c = self.get_object()
        if not c.email or not EMAIL_RE.match(c.email):
            raise ValidationError({"detail": "Add a valid email address for this client first."})
        with transaction.atomic():
            user = c.user
            if not user:
                existing = User.objects.filter(email=c.email.lower()).first()
                if existing and existing.role != "client":
                    raise ValidationError({"detail": "This email belongs to a staff account."})
                user = existing or User.objects.create_user(email=c.email, role="client", first_name=c.name[:150])
                if not existing:
                    user.set_unusable_password()
                    user.save()
                c.user = user
                c.save(update_fields=["user"])
        link = password_link(user)
        logs = notify_welcome(c, link)
        return Response({"link": link, "sent": [{"channel": l.channel, "status": l.status, "error": l.error} for l in logs]})

    @action(detail=True, methods=["post"])
    def revoke_portal(self, request, pk=None):
        c = self.get_object()
        if c.user:
            c.user.is_active = False
            c.user.save(update_fields=["is_active"])
        return Response({"ok": True})


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("documents")]

    def get_serializer_class(self):
        return s.DocumentListSerializer if self.action == "list" else s.DocumentSerializer

    def get_queryset(self):
        qs = doc_qs()
        p = self.request.query_params
        if p.get("type") in ("proposal", "invoice"):
            qs = qs.filter(doc_type=p["type"])
        if p.get("client", "").isdigit():
            qs = qs.filter(client_id=int(p["client"]))
        if p.get("q"):
            q = p["q"].strip()
            qs = qs.filter(Q(number__icontains=q) | Q(title__icontains=q) | Q(client__name__icontains=q) |
                           Q(client__company__icontains=q))
        return qs

    def list(self, request, *args, **kwargs):
        data = s.DocumentListSerializer(self.get_queryset(), many=True).data
        st = request.query_params.get("status")
        if st and st != "all":
            data = [d for d in data if d["display_status"] == st]
        return Response(data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Mark as sent and email / SMS the client (unless notify=false)."""
        doc = self.get_object()
        if doc.status == "draft":
            doc.status = "sent"
        doc.sent_at = timezone.now()
        doc.save(update_fields=["status", "sent_at", "updated_at"])
        logs = notify_document_sent(doc) if request.data.get("notify", True) else []
        return Response({"document": s.DocumentSerializer(doc).data,
                         "sent": [{"channel": l.channel, "status": l.status, "to": l.to, "error": l.error} for l in logs]})

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        doc = self.get_object()
        new = request.data.get("status")
        if new not in Document.STATUSES[doc.doc_type]:
            raise ValidationError({"detail": "Invalid status"})
        doc.status = new
        doc.accepted_at = timezone.now() if new == "accepted" else None
        doc.save()
        return Response(s.DocumentSerializer(doc).data)

    def _clone(self, doc, new_type, source=None):
        cfg = CompanySettings.get()
        new = Document.objects.create(
            doc_type=new_type, client=doc.client, title=doc.title, currency=doc.currency,
            discount_type=doc.discount_type, discount_value=doc.discount_value, tax_percent=doc.tax_percent,
            intro=doc.intro if new_type == doc.doc_type else "", scope=doc.scope, timeline=doc.timeline,
            terms=doc.terms if new_type == doc.doc_type else (cfg.invoice_terms if new_type == "invoice" else cfg.proposal_terms),
            notes=doc.notes, source=source, project=doc.project, created_by=self.request.user,
            due_date=date.today() + timedelta(days=14 if new_type == "invoice" else 30))
        for i, it in enumerate(doc.items.all()):
            new.items.create(position=i, description=it.description, qty=it.qty, unit_price=it.unit_price)
        return new

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        return Response(s.DocumentSerializer(self._clone(self.get_object(), self.get_object().doc_type)).data, status=201)

    @action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        doc = self.get_object()
        if doc.doc_type != "proposal":
            raise ValidationError({"detail": "Only proposals can be converted."})
        return Response(s.DocumentSerializer(self._clone(doc, "invoice", source=doc)).data, status=201)

    @action(detail=True, methods=["post"], url_path="payments",
            permission_classes=[IsStaffMember, Module.of("payments")])
    def add_payment(self, request, pk=None):
        doc = self.get_object()
        if doc.doc_type != "invoice":
            raise ValidationError({"detail": "Payments can only be added to invoices."})
        ser = s.PaymentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if ser.validated_data["amount"] <= 0:
            raise ValidationError({"amount": "Must be greater than zero."})
        pay = ser.save(document=doc, recorded_by=request.user)
        if doc.status == "draft":
            doc.status = "sent"
            doc.save(update_fields=["status"])
        logs = notify_payment(pay) if request.data.get("notify", True) else []
        doc = doc_qs().get(pk=doc.pk)
        return Response({"document": s.DocumentSerializer(doc).data,
                         "sent": [{"channel": l.channel, "status": l.status, "error": l.error} for l in logs]}, status=201)

    @action(detail=True, methods=["get"])
    def notifications(self, request, pk=None):
        logs = NotificationLog.objects.filter(document_id=pk)[:50]
        return Response([{"id": l.id, "kind": l.kind, "channel": l.channel, "to": l.to, "status": l.status,
                          "error": l.error, "created_at": l.created_at} for l in logs])

    @action(detail=False, methods=["get"])
    def defaults(self, request):
        cfg = CompanySettings.get()
        return Response({"proposal_terms": cfg.proposal_terms, "invoice_terms": cfg.invoice_terms,
                         "next_invoice": Document.next_number("invoice"), "next_proposal": Document.next_number("proposal"),
                         "payment_methods": Payment.METHODS})


class PaymentViewSet(mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Payment.objects.all()
    permission_classes = [IsStaffMember, Module.of("payments")]


class CredentialViewSet(viewsets.ModelViewSet):
    serializer_class = s.CredentialSerializer
    permission_classes = [IsStaffMember, Module.of("certificates")]

    def get_queryset(self):
        qs = Credential.objects.all()
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(holder_name__icontains=q) | Q(code__icontains=q) | Q(title__icontains=q))
        return qs

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        c = self.get_object()
        c.status = "valid" if c.status == "revoked" else "revoked"
        c.save(update_fields=["status"])
        return Response(s.CredentialSerializer(c).data)

    @action(detail=False, methods=["get"])
    def types(self, request):
        return Response(Credential.TYPES)

    @action(detail=False, methods=["get"])
    def blank(self, request):
        """For the 'new certificate' page: the number the next one will get, today's date and the signatures."""
        cfg, today = CompanySettings.get(), timezone.localdate()
        doc_type = request.query_params.get("doc_type") or Credential.TYPES[0]
        return Response({"next_code": Credential.next_code(doc_type, today.year), "issued_on": today.isoformat(),
                         "ceo_signature": cfg.ceo_signature, "hr_signature": cfg.hr_signature})

    @action(detail=True, methods=["get"])
    def printable(self, request, pk=None):
        """Everything the print page needs, including the signature images."""
        cfg = CompanySettings.get()
        return Response({**s.CredentialSerializer(self.get_object()).data,
                         "ceo_signature": cfg.ceo_signature, "hr_signature": cfg.hr_signature})


def visible_projects(user):
    qs = Project.objects.select_related("client", "manager").prefetch_related("members")
    if user.role == "staff" and not user.is_superuser:
        qs = qs.filter(Q(members=user) | Q(manager=user) | Q(tasks__assignee=user)).distinct()
    return qs


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = s.ProjectSerializer
    permission_classes = [IsStaffMember, Module.of("projects")]

    def get_queryset(self):
        qs = visible_projects(self.request.user)
        p = self.request.query_params
        if p.get("status") and p["status"] != "all":
            qs = qs.filter(status=p["status"])
        if p.get("client", "").isdigit():
            qs = qs.filter(client_id=int(p["client"]))
        return qs

    @action(detail=True, methods=["get", "post"], permission_classes=[IsStaffMember, Module.of("tasks")])
    def updates(self, request, pk=None):
        project = get_object_or_404(visible_projects(request.user), pk=pk)
        if request.method == "POST":
            text = str(request.data.get("text", "")).strip()
            if not text:
                raise ValidationError({"text": "Write an update."})
            upd = ProjectUpdate.objects.create(project=project, author=request.user, text=text[:4000],
                                               visible_to_client=bool(request.data.get("visible_to_client", True)))
            if upd.visible_to_client and project.visible_to_client and project.client.user_id:
                from notify import push
                push.safe(push.send, [project.client.user], f"Update on {project.title}", text[:200],
                          {"type": "project", "id": project.id})
        return Response(s.UpdateSerializer(project.updates.select_related("author")[:50], many=True).data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = s.TaskSerializer
    permission_classes = [IsStaffMember, Module.of("tasks")]

    def get_queryset(self):
        u = self.request.user
        qs = Task.objects.select_related("project", "assignee")
        if u.role == "staff" and not u.is_superuser:
            qs = qs.filter(Q(assignee=u) | Q(project__in=visible_projects(u))).distinct()
        p = self.request.query_params
        if p.get("project", "").isdigit():
            qs = qs.filter(project_id=int(p["project"]))
        if p.get("mine") == "1":
            qs = qs.filter(assignee=u)
        if p.get("status") in ("todo", "doing", "done"):
            qs = qs.filter(status=p["status"])
        return qs

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        if not visible_projects(self.request.user).filter(pk=project.pk).exists():
            raise PermissionDenied("You are not on this project.")
        self._tell_assignee(serializer.save(), None)

    def perform_update(self, serializer):
        before = serializer.instance.assignee_id
        self._tell_assignee(serializer.save(), before)

    def _tell_assignee(self, task, before):
        if task.assignee_id and task.assignee_id != before and task.assignee_id != self.request.user.id:
            from notify import push
            due = f" · due {task.due_date:%d %b}" if task.due_date else ""
            push.safe(push.send, [task.assignee], "New task for you", f"{task.title} ({task.project.title}){due}",
                      {"type": "task", "id": task.id})


class MessageViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = s.MessageSerializer
    permission_classes = [IsStaffMember, Module.of("inbox")]

    def get_queryset(self):
        qs = Message.objects.all()
        if self.request.query_params.get("show") == "unread":
            qs = qs.filter(is_read=False)
        return qs


class ReviewViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = s.ReviewSerializer
    permission_classes = [IsStaffMember, Module.of("inbox")]
    queryset = Review.objects.order_by("approved", "-id")


class SubscriberViewSet(mixins.ListModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = s.SubscriberSerializer
    permission_classes = [IsStaffMember, Module.of("inbox")]
    queryset = Subscriber.objects.order_by("-id")


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = s.TeamSerializer
    permission_classes = [IsStaffMember, Module.of("team")]

    def get_queryset(self):
        return User.objects.exclude(role__in=NON_STAFF_ROLES).order_by("-is_active", "first_name", "email")

    def destroy(self, request, *args, **kwargs):
        u = self.get_object()
        if u == request.user:
            raise ValidationError({"detail": "You cannot remove yourself."})
        u.is_active = False   # keep history (tasks, payments) intact
        u.save(update_fields=["is_active"])
        return Response(status=204)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        from notify.providers import send_email
        u = self.get_object()
        link = password_link(u)
        try:
            send_email(u.email, "Your Xeon Net staff account",
                       f"Hello {u.display_name},\n\nAn account has been created for you on the Xeon Net staff panel "
                       f"({u.get_role_display()}). Set your password here (valid for 3 days):\n{link}\n\nXeon Net")
            sent = True
        except Exception:  # noqa: BLE001
            sent = False
        return Response({"link": link, "emailed": sent})


class SettingsView(APIView):
    permission_classes = [IsStaffMember, Module.of("settings")]

    def get(self, request):
        data = s.SettingsSerializer(CompanySettings.get()).data
        data["providers"] = {"email": settings.EMAIL_PROVIDER, "sms": settings.SMS_PROVIDER}
        return Response(data)

    def put(self, request):
        ser = s.SettingsSerializer(CompanySettings.get(), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return self.get(request)


class NotificationLogView(APIView):
    permission_classes = [IsStaffMember, Module.of("notifications")]

    def get(self, request):
        logs = NotificationLog.objects.select_related("document", "client")[:200]
        return Response([{"id": l.id, "kind": l.kind, "channel": l.channel, "to": l.to, "subject": l.subject,
                          "status": l.status, "error": l.error, "created_at": l.created_at,
                          "document": l.document.number if l.document else "",
                          "client": l.client.name if l.client else ""} for l in logs])


# ================================================================== PUBLIC
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicThrottle])
def contact(request):
    d = request.data
    if d.get("website"):  # honeypot
        return Response({"ok": True})
    name, email, msg = str(d.get("name", "")).strip(), str(d.get("email", "")).strip(), str(d.get("message", "")).strip()
    errors = {}
    if len(name) < 2:
        errors["name"] = "Please enter your name."
    if not EMAIL_RE.match(email):
        errors["email"] = "Please enter a valid email."
    if len(msg) < 10:
        errors["message"] = "Please write a little more (at least 10 characters)."
    if errors:
        return Response(errors, status=400)
    Message.objects.create(name=name[:120], email=email[:160], phone=str(d.get("phone", ""))[:40],
                           service=str(d.get("service", ""))[:120], budget=str(d.get("budget", ""))[:60],
                           message=msg[:5000], ip=request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or
                           request.META.get("REMOTE_ADDR"))
    from notify import push
    push.safe(push.send, push.staff_with("inbox"), f"New message from {name[:60]}",
              (str(d.get("service", "")) + ": " if d.get("service") else "") + msg[:180], {"type": "message"})
    return Response({"ok": True, "message": "Thank you! We will get back to you within one working day."})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def reviews(request):
    if request.method == "GET":
        qs = Review.objects.filter(approved=True)
        return Response({"reviews": s.ReviewSerializer(qs[:60], many=True).data,
                         "count": qs.count(),
                         "average": round(sum(r.rating for r in qs) / qs.count(), 1) if qs.exists() else None})
    throttle = PublicThrottle()
    if not throttle.allow_request(request, None):
        return Response({"detail": "Too many requests"}, status=429)
    d = request.data
    if d.get("website"):
        return Response({"ok": True})
    try:
        rating = int(d.get("rating", 0))
    except (TypeError, ValueError):
        rating = 0
    name, text = str(d.get("name", "")).strip(), str(d.get("text", "")).strip()
    if len(name) < 2 or not 1 <= rating <= 5 or len(text) < 10:
        return Response({"detail": "Please add your name, a rating and at least 10 characters."}, status=400)
    Review.objects.create(name=name[:120], role=str(d.get("role", ""))[:120], rating=rating, text=text[:2000])
    return Response({"ok": True, "message": "Thank you! Your review will appear after approval."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicThrottle])
def subscribe(request):
    email = str(request.data.get("email", "")).strip().lower()
    if not EMAIL_RE.match(email):
        return Response({"detail": "Please enter a valid email."}, status=400)
    Subscriber.objects.get_or_create(email=email[:160])
    return Response({"ok": True, "message": "You're subscribed. Thank you!"})


def clean_code(raw):
    return re.sub(r"[^A-Z0-9-]", "", (raw or "").upper())[:40]


@api_view(["GET"])
@permission_classes([AllowAny])
def verify(request, code):
    c = Credential.objects.filter(code=clean_code(code)).first()
    if not c:
        return Response({"found": False, "code": clean_code(code)}, status=404)
    return Response({"found": True, **s.PublicCredentialSerializer(c).data})


def qr(request, code):
    link = f"{settings.SITE_URL}/verify/{clean_code(code)}"
    buf = io.BytesIO()
    segno.make(link, error="m").save(buf, kind="svg", scale=8, border=2, dark="#111111")
    return HttpResponse(buf.getvalue(), content_type="image/svg+xml",
                        headers={"Cache-Control": "public, max-age=86400"})


@api_view(["GET"])
@permission_classes([AllowAny])
def public_document(request, token):
    doc = get_object_or_404(doc_qs(), token=token)
    if doc.status == "draft" and not (request.user.is_authenticated and request.user.role not in NON_STAFF_ROLES):
        return Response({"detail": "Not found"}, status=404)
    return Response(s.PublicDocumentSerializer(doc).data)


def _accepted(doc):
    from notify import push
    push.safe(push.send, push.staff_with("documents"), f"Proposal {doc.number} accepted",
              f"{doc.client.name} accepted {doc.title or 'the proposal'}.", {"type": "document", "id": doc.id})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicThrottle])
def public_accept(request, token):
    doc = get_object_or_404(Document, token=token, doc_type="proposal")
    if doc.status == "sent":
        doc.status, doc.accepted_at = "accepted", timezone.now()
        doc.save(update_fields=["status", "accepted_at", "updated_at"])
        _accepted(doc)
    return Response(s.PublicDocumentSerializer(doc_qs().get(pk=doc.pk)).data)


# ================================================================== PORTAL
def my_client(request):
    c = getattr(request.user, "client_profile", None)
    if not c:
        raise PermissionDenied("No client profile is linked to this login.")
    return c


class PortalSummary(APIView):
    permission_classes = [IsClient]

    def get(self, request):
        c = my_client(request)
        docs = list(doc_qs().filter(client=c).exclude(status="draft"))
        out = {}
        for d in docs:
            if d.doc_type == "invoice" and d.status != "cancelled":
                t = totals(d)
                out.setdefault(d.currency, Decimal(0))
                out[d.currency] += t["balance"]
        projects = Project.objects.filter(client=c, visible_to_client=True)
        return Response({
            "client": s.ClientSerializer(c).data,
            "outstanding": {k: str(v) for k, v in out.items() if v > 0},
            "documents": s.DocumentListSerializer(docs[:8], many=True).data,
            "projects": s.ProjectSerializer(projects[:6], many=True).data,
        })


class PortalDocuments(APIView):
    permission_classes = [IsClient]

    def get(self, request, pk=None):
        c = my_client(request)
        qs = doc_qs().filter(client=c).exclude(status="draft")
        if pk:
            return Response(s.PublicDocumentSerializer(get_object_or_404(qs, pk=pk)).data | {"token": None})
        t = request.query_params.get("type")
        if t in ("invoice", "proposal"):
            qs = qs.filter(doc_type=t)
        return Response(s.DocumentListSerializer(qs, many=True).data)


class PortalAccept(APIView):
    permission_classes = [IsClient]

    def post(self, request, pk):
        c = my_client(request)
        doc = get_object_or_404(Document, pk=pk, client=c, doc_type="proposal")
        if doc.status == "sent":
            doc.status, doc.accepted_at = "accepted", timezone.now()
            doc.save(update_fields=["status", "accepted_at", "updated_at"])
            _accepted(doc)
        return Response(s.PublicDocumentSerializer(doc_qs().get(pk=doc.pk)).data)


class PortalProjects(APIView):
    permission_classes = [IsClient]

    def get(self, request, pk=None):
        c = my_client(request)
        qs = Project.objects.filter(client=c, visible_to_client=True).select_related("manager")
        if not pk:
            return Response(s.ProjectSerializer(qs, many=True).data)
        p = get_object_or_404(qs, pk=pk)
        data = s.ProjectSerializer(p).data
        data["tasks"] = [{"id": t.id, "title": t.title, "status": t.status, "due_date": t.due_date}
                         for t in p.tasks.filter(visible_to_client=True)]
        data["updates"] = s.UpdateSerializer(p.updates.filter(visible_to_client=True)[:30], many=True).data
        data["documents"] = s.DocumentListSerializer(p.documents.exclude(status="draft"), many=True).data
        return Response(data)
