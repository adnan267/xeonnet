from django.contrib.auth import get_user_model, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from accounts.api import me_payload
from accounts.permissions import IsRemoteWorker, IsStaffMember, Module

from . import logic, notify
from . import serializers as s
from .models import CoinEntry, Position, RemoteSettings, Submission, Task, Withdrawal, Worker

User = get_user_model()


class SignupThrottle(AnonRateThrottle):
    scope = "public"


# ======================================================================= public
@api_view(["GET"])
@permission_classes([AllowAny])
def public_info(request):
    cfg = RemoteSettings.get()
    return Response({
        "signup_open": cfg.signup_open, "coin_value": str(cfg.coin_value), "min_withdraw_coins": cfg.min_withdraw_coins,
        "min_withdraw_rupees": str(cfg.rupees(cfg.min_withdraw_coins)), "payout_days": cfg.payout_days,
        "positions": s.PublicPositionSerializer(Position.objects.filter(is_open=True), many=True).data,
        "open_tasks": Task.objects.filter(is_active=True).filter(Q(deadline__isnull=True) | Q(deadline__gt=timezone.now())).count(),
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupThrottle])
def signup(request):
    """Join as a remote worker. Free, and the account is active straight away."""
    cfg = RemoteSettings.get()
    if not cfg.signup_open:
        return Response({"detail": "We are not taking new remote workers right now."}, status=400)
    d = request.data
    errors = {}
    name = str(d.get("name", "")).strip()
    email = str(d.get("email", "")).strip().lower()
    phone = str(d.get("phone", "")).strip()
    password = str(d.get("password", ""))
    if len(name) < 3:
        errors["name"] = "Enter your full name."
    try:
        validate_email(email)
    except DjangoValidationError:
        errors["email"] = "Enter a valid email."
    if not errors.get("email") and User.objects.filter(email=email).exists():
        errors["email"] = "This email already has an account. Please log in."
    if len("".join(ch for ch in phone if ch.isdigit())) < 10:
        errors["phone"] = "Enter your mobile / WhatsApp number."
    position = None
    if d.get("position"):
        position = Position.objects.filter(pk=d.get("position"), is_open=True).first()
        if not position:
            errors["position"] = "Choose one of the open positions."
    if not d.get("agree"):
        errors["agree"] = "Please accept the terms to join."
    try:
        validate_password(password)
    except DjangoValidationError as e:
        errors["password"] = " ".join(e.messages)
    if errors:
        return Response(errors, status=400)
    first, _, last = name.partition(" ")
    with transaction.atomic():
        user = User.objects.create_user(email=email, password=password, role="remote", first_name=first[:150],
                                        last_name=last[:150], phone=phone[:40])
        Worker.objects.create(user=user, position=position, city=str(d.get("city", ""))[:80],
                              skills=str(d.get("skills", ""))[:300], about=str(d.get("about", ""))[:4000],
                              portfolio_url=str(d.get("portfolio_url", ""))[:200] if str(d.get("portfolio_url", "")).startswith("http") else "")
    login(request, user, backend="accounts.backends.EmailBackend")
    notify.to_staff("remote", "New remote worker joined", f"{user.display_name}{f' · {position.title}' if position else ''}")
    return Response(me_payload(user), status=201)


# ======================================================================= worker
def _worker(request):
    return request.user.worker


def _available_tasks(w):
    now = timezone.now()
    qs = Task.objects.filter(is_active=True).filter(Q(deadline__isnull=True) | Q(deadline__gt=now))
    return qs.filter(Q(position__isnull=True) | Q(position=w.position_id)).select_related("position")


class WorkerHome(APIView):
    permission_classes = [IsRemoteWorker]

    def get(self, request):
        w, u, cfg = _worker(request), request.user, RemoteSettings.get()
        bal = w.balance()
        earned = u.coin_entries.filter(kind__in=["task", "bonus"]).aggregate(s=Sum("coins"))["s"] or 0
        paid = Withdrawal.objects.filter(worker=u, status="paid").aggregate(s=Sum("amount"))["s"] or 0
        mine = dict(Submission.objects.filter(worker=u).exclude(status="rejected").values_list("task_id", "status"))
        tasks = [t for t in _available_tasks(w) if t.id not in mine and t.is_available()][:5]
        return Response({
            "balance": bal, "balance_rupees": str(cfg.rupees(bal)), "earned": earned, "paid_rupees": str(paid),
            "coin_value": str(cfg.coin_value), "min_withdraw_coins": cfg.min_withdraw_coins,
            "pending_reviews": Submission.objects.filter(worker=u, status="pending").count(),
            "approved": Submission.objects.filter(worker=u, status="approved").count(),
            "pending_withdrawal": s.WithdrawalSerializer(Withdrawal.objects.filter(worker=u, status="pending").first()).data
            if Withdrawal.objects.filter(worker=u, status="pending").exists() else None,
            "status": w.status, "position": w.position.title if w.position else "",
            "new_tasks": s.WorkerTaskSerializer(tasks, many=True, context={"mine": mine}).data,
            "recent": s.SubmissionSerializer(Submission.objects.filter(worker=u).select_related("task")[:5], many=True).data,
            "payout_ready": bool(w.payout_method and w.payout_name and w.payout_number),
        })


class WorkerTasks(APIView):
    permission_classes = [IsRemoteWorker]

    def get(self, request, pk=None):
        w, u = _worker(request), request.user
        mine = dict(Submission.objects.filter(worker=u).exclude(status="rejected").values_list("task_id", "status"))
        if pk:
            t = get_object_or_404(_available_tasks(w) | Task.objects.filter(pk__in=mine.keys()), pk=pk)
            data = s.WorkerTaskSerializer(t, context={"mine": mine}).data
            data["my_submissions"] = s.SubmissionSerializer(Submission.objects.filter(worker=u, task=t), many=True).data
            data["open"] = t.is_available() and t.id not in mine and w.status == "active"
            return Response(data)
        show = request.query_params.get("show", "open")
        if show == "done":
            qs = Task.objects.filter(pk__in=mine.keys())
        else:
            qs = [t for t in _available_tasks(w) if t.id not in mine and t.is_available()]
        return Response(s.WorkerTaskSerializer(qs, many=True, context={"mine": mine}).data)

    def post(self, request, pk=None):
        t = get_object_or_404(Task, pk=pk)
        sub = logic.submit(t, request.user, request.data.get("text", ""), request.data.get("link", ""))
        notify.to_staff("remote", "New work to review", f"{request.user.display_name}: {t.title}", {"type": "remote_review"})
        return Response(s.SubmissionSerializer(sub).data, status=201)


class WorkerSubmissions(APIView):
    permission_classes = [IsRemoteWorker]

    def get(self, request):
        qs = Submission.objects.filter(worker=request.user).select_related("task")
        return Response(s.SubmissionSerializer(qs, many=True).data)


class WorkerWallet(APIView):
    permission_classes = [IsRemoteWorker]

    def get(self, request):
        w, cfg = _worker(request), RemoteSettings.get()
        bal = w.balance()
        return Response({
            "balance": bal, "balance_rupees": str(cfg.rupees(bal)), "coin_value": str(cfg.coin_value),
            "min_withdraw_coins": cfg.min_withdraw_coins, "payout_days": cfg.payout_days,
            "payout": {"method": w.payout_method, "method_label": w.get_payout_method_display() if w.payout_method else "",
                       "name": w.payout_name, "number": w.payout_number, "bank": w.payout_bank},
            "entries": s.CoinEntrySerializer(request.user.coin_entries.all()[:200], many=True).data,
            "withdrawals": s.WithdrawalSerializer(Withdrawal.objects.filter(worker=request.user), many=True).data,
        })

    def post(self, request):
        wd = logic.request_withdrawal(request.user, request.data.get("coins"))
        notify.to_staff("payouts", "Withdrawal request", f"{request.user.display_name}: {wd.coins} coins (Rs {wd.amount})",
                        {"type": "remote_withdrawal"})
        return Response(s.WithdrawalSerializer(wd).data, status=201)


class WorkerProfile(APIView):
    permission_classes = [IsRemoteWorker]

    def get(self, request):
        return Response(s.WorkerProfileSerializer(_worker(request)).data)

    def patch(self, request):
        ser = s.WorkerProfileSerializer(_worker(request), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        if ser.validated_data.get("payout_method") and not (ser.validated_data.get("payout_number") or _worker(request).payout_number):
            raise ValidationError({"payout_number": "Enter the account / mobile number."})
        ser.save()
        return Response(ser.data)


# ======================================================================= staff
class PositionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("remote")]
    serializer_class = s.PositionSerializer
    queryset = Position.objects.all()


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("remote")]
    serializer_class = s.TaskSerializer

    def get_queryset(self):
        qs = Task.objects.select_related("position")
        show = self.request.query_params.get("show", "active")
        if show == "active":
            qs = qs.filter(is_active=True)
        elif show == "closed":
            qs = qs.filter(is_active=False)
        return qs

    def perform_create(self, ser):
        t = ser.save(created_by=self.request.user)
        if t.is_active:   # tell the workers who can do it
            users = User.objects.filter(role="remote", is_active=True, worker__status="active")
            if t.position_id:
                users = users.filter(worker__position=t.position_id)
            notify_push_many(list(users[:500]), "New task", f"{t.title} · {t.coins} coins", {"type": "remote_task", "id": t.id})

    def destroy(self, request, *args, **kwargs):
        t = self.get_object()
        if t.submissions.exists():
            t.is_active = False
            t.save(update_fields=["is_active"])
            return Response({"detail": "Task has work sent for it, so it was closed instead of deleted."})
        return super().destroy(request, *args, **kwargs)


def notify_push_many(users, title, body, data):
    from notify import push
    push.safe(push.send, users, title, body, data)


class SubmissionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsStaffMember, Module.of("remote")]
    serializer_class = s.SubmissionSerializer

    def get_queryset(self):
        qs = Submission.objects.select_related("task", "worker", "reviewed_by")
        if self.action != "list":
            return qs
        p = self.request.query_params
        status = p.get("status", "pending")
        if status != "all":
            qs = qs.filter(status=status)
        if p.get("task"):
            qs = qs.filter(task=p["task"])
        if p.get("worker"):
            qs = qs.filter(worker=p["worker"])
        return qs.order_by("created_at" if status == "pending" else "-created_at")

    @action(detail=True, methods=["post"], permission_classes=[IsStaffMember, Module.of("remote")])
    def approve(self, request, pk=None):
        sub = logic.approve(self.get_object(), request.user, request.data.get("coins"), request.data.get("note", ""))
        notify.to_worker(sub.worker, "remote_approved", f"Approved: +{sub.coins} coins",
                         f"Your work on “{sub.task.title}” was approved. {sub.coins} coins were added to your wallet."
                         + (f"\n\nNote: {sub.review_note}" if sub.review_note else ""), {"type": "remote_wallet"})
        return Response(s.SubmissionSerializer(sub).data)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffMember, Module.of("remote")])
    def reject(self, request, pk=None):
        sub = logic.reject(self.get_object(), request.user, request.data.get("note", ""))
        notify.to_worker(sub.worker, "remote_rejected", "Changes needed",
                         f"Your work on “{sub.task.title}” needs changes:\n{sub.review_note}\n\nYou can send it again.",
                         {"type": "remote_task", "id": sub.task_id})
        return Response(s.SubmissionSerializer(sub).data)


class WorkerViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsStaffMember, Module.of("remote")]
    serializer_class = s.StaffWorkerSerializer
    lookup_field = "user_id"

    def get_queryset(self):
        qs = Worker.objects.select_related("user", "position")
        p = self.request.query_params
        if p.get("q"):
            q = p["q"]
            qs = qs.filter(Q(user__first_name__icontains=q) | Q(user__last_name__icontains=q) | Q(user__email__icontains=q)
                           | Q(user__phone__icontains=q) | Q(skills__icontains=q))
        if p.get("status") in ("active", "suspended"):
            qs = qs.filter(status=p["status"])
        return qs

    @action(detail=True, methods=["get", "post"])
    def coins(self, request, user_id=None):
        w = self.get_object()
        if request.method == "POST":
            from accounts.permissions import can
            if not can(request.user, "payouts", True) and not can(request.user, "remote", True):
                return Response({"detail": "You cannot change coins."}, status=403)
            e = logic.adjust(w.user, request.data.get("coins"), request.data.get("kind", "bonus"), request.data.get("note", ""), request.user)
            notify.to_worker(w.user, "remote_adjust", f"{'+' if e.coins > 0 else ''}{e.coins} coins", e.note, {"type": "remote_wallet"})
        return Response({"balance": w.balance(), "entries": s.CoinEntrySerializer(w.user.coin_entries.all()[:300], many=True).data})


class WithdrawalViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsStaffMember, Module.of("payouts")]
    serializer_class = s.WithdrawalSerializer

    def get_queryset(self):
        qs = Withdrawal.objects.select_related("worker")
        if self.action != "list":
            return qs
        status = self.request.query_params.get("status", "pending")
        return qs if status == "all" else qs.filter(status=status)

    @action(detail=True, methods=["post"])
    def paid(self, request, pk=None):
        wd = logic.mark_paid(self.get_object(), request.user, request.data.get("reference", ""), request.data.get("note", ""))
        notify.to_worker(wd.worker, "remote_paid", f"Rs {wd.amount} sent",
                         f"We sent Rs {wd.amount} for {wd.coins} coins to your {wd.get_method_display()} ({wd.account_number})."
                         + (f" Transaction ID: {wd.reference}." if wd.reference else ""), {"type": "remote_wallet"})
        return Response(s.WithdrawalSerializer(wd).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        wd = logic.reject_withdrawal(self.get_object(), request.user, request.data.get("note", ""))
        notify.to_worker(wd.worker, "remote_withdraw_rejected", "Withdrawal not paid",
                         f"Your withdrawal of {wd.coins} coins was not paid: {wd.staff_note}\nThe coins are back in your wallet.",
                         {"type": "remote_wallet"})
        return Response(s.WithdrawalSerializer(wd).data)


class RemoteSettingsView(APIView):
    permission_classes = [IsStaffMember, Module.of("remote")]

    def get(self, request):
        return Response(s.SettingsSerializer(RemoteSettings.get()).data)

    def put(self, request):
        from accounts.permissions import can
        if not can(request.user, "settings", True):
            return Response({"detail": "Only an admin can change these settings."}, status=403)
        ser = s.SettingsSerializer(RemoteSettings.get(), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class RemoteOverview(APIView):
    permission_classes = [IsStaffMember, Module.of("remote")]

    def get(self, request):
        cfg = RemoteSettings.get()
        owed = CoinEntry.objects.aggregate(s=Sum("coins"))["s"] or 0
        return Response({
            "workers": Worker.objects.filter(status="active").count(),
            "to_review": Submission.objects.filter(status="pending").count(),
            "withdrawals": Withdrawal.objects.filter(status="pending").count(),
            "withdrawals_rupees": str(Withdrawal.objects.filter(status="pending").aggregate(s=Sum("amount"))["s"] or 0),
            "active_tasks": Task.objects.filter(is_active=True).count(),
            "coins_in_wallets": owed, "coins_in_wallets_rupees": str(cfg.rupees(owed)),
            "paid_rupees": str(Withdrawal.objects.filter(status="paid").aggregate(s=Sum("amount"))["s"] or 0),
            "coin_value": str(cfg.coin_value),
        })
