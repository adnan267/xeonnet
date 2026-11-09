from django.contrib.auth import get_user_model, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from accounts.api import me_payload
from accounts.permissions import IsStaffMember, IsStudent, Module, can

from . import logic, notify
from . import serializers as s
from .models import Attempt, Course, Enrollment, FeePayment, LearnSettings, Lesson, Question

User = get_user_model()


class SignupThrottle(AnonRateThrottle):
    scope = "public"


def _pay_info():
    from office.models import CompanySettings
    cfg, co = LearnSettings.get(), CompanySettings.get()
    return {"instructions": cfg.payment_instructions, "bank": co.bank_lines(), "enroll_open": cfg.enroll_open,
            "gateway": cfg.gateway_enabled}


# ======================================================================= public
@api_view(["GET"])
@permission_classes([AllowAny])
def courses(request):
    qs = Course.objects.filter(is_published=True)
    return Response(s.CourseCardSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def course_detail(request, slug):
    c = get_object_or_404(Course, slug=slug, is_published=True)
    data = s.CourseDetailSerializer(c).data
    data["previews"] = s.LessonContentSerializer(c.lessons.filter(is_preview=True), many=True).data
    data["payment"] = _pay_info()
    u = request.user
    if u.is_authenticated and u.role == "student":
        e = Enrollment.objects.filter(student=u, course=c).first()
        data["my_enrollment"] = {"id": e.id, "status": e.status} if e else None
    return Response(data)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupThrottle])
def enroll(request, slug):
    """Enroll in a course. New students also create their account here (free and instant)."""
    c = get_object_or_404(Course, slug=slug, is_published=True)
    u = request.user
    if u.is_authenticated:
        if u.role != "student":
            return Response({"detail": "Please log out and enroll with a student account (use another email)."}, status=400)
    else:
        d, errors = request.data, {}
        name = str(d.get("name", "")).strip()
        email = str(d.get("email", "")).strip().lower()
        phone = str(d.get("phone", "")).strip()
        password = str(d.get("password", ""))
        if len(name) < 3:
            errors["name"] = "Enter your full name (it is printed on your certificate)."
        try:
            validate_email(email)
        except DjangoValidationError:
            errors["email"] = "Enter a valid email."
        if not errors.get("email") and User.objects.filter(email=email).exists():
            errors["email"] = "This email already has an account. Please log in first."
        if len("".join(ch for ch in phone if ch.isdigit())) < 10:
            errors["phone"] = "Enter your mobile / WhatsApp number."
        try:
            validate_password(password)
        except DjangoValidationError as e:
            errors["password"] = " ".join(e.messages)
        if errors:
            return Response(errors, status=400)
        first, _, last = name.partition(" ")
        with transaction.atomic():
            u = User.objects.create_user(email=email, password=password, role="student", first_name=first[:150],
                                         last_name=last[:150], phone=phone[:40])
        login(request, u, backend="accounts.backends.EmailBackend")
    e = logic.enroll(u, c)
    if e.status == "unpaid":
        notify.to_staff("fees", "New enrolment", f"{u.display_name} · {c.title} (waiting for payment)")
    return Response({"enrollment": e.id, "status": e.status, "me": me_payload(u)}, status=201)


# ======================================================================= student
def _mine(request, pk):
    return get_object_or_404(Enrollment.objects.select_related("course", "credential"), pk=pk, student=request.user)


class StudentHome(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        qs = Enrollment.objects.filter(student=request.user).select_related("course", "credential")
        items = []
        for e in qs:
            d = s.EnrollmentSerializer(e).data
            d["course_detail"] = s.CourseCardSerializer(e.course).data
            items.append(d)
        return Response({"enrollments": items})


class StudentCourse(APIView):
    permission_classes = [IsStudent]

    def get(self, request, pk):
        e = _mine(request, pk)
        logic.close_expired(e)
        e.refresh_from_db()
        c = e.course
        open_ = e.status in ("active", "completed")
        lessons = c.lessons.all() if open_ else c.lessons.filter(is_preview=True)
        return Response({
            "enrollment": s.EnrollmentSerializer(e).data,
            "course": s.CourseDetailSerializer(c).data,
            "lessons": s.LessonContentSerializer(lessons, many=True).data,
            "done": sorted(logic.lessons_done(e)),
            "test": logic.test_status(e),
            "attempts": s.AttemptSerializer(e.attempts.exclude(submitted_at__isnull=True), many=True).data,
            "payments": s.PaymentSerializer(e.payments.all(), many=True).data,
            "payment": _pay_info(),
            "certificate": {"code": e.credential.code} if e.credential else None,
        })


class StudentPay(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        e = _mine(request, pk)
        d = request.data
        p = logic.submit_payment(e, d.get("method"), d.get("reference", ""), d.get("payer_name", ""), d.get("proof", ""))
        notify.to_staff("fees", "Course fee to check", f"{request.user.display_name} · {e.course.title} · Rs {p.amount}",
                        {"type": "learn_payment"})
        return Response(s.PaymentSerializer(p).data, status=201)


class StudentLesson(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk, lesson_id):
        e = _mine(request, pk)
        logic.mark_lesson(e, get_object_or_404(Lesson, pk=lesson_id), bool(request.data.get("done", True)))
        return Response({"done": sorted(logic.lessons_done(e)), "test": logic.test_status(e)})


class StudentTest(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        return Response(logic.start_attempt(_mine(request, pk)))


class StudentAttempt(APIView):
    permission_classes = [IsStudent]

    def _get(self, request, attempt_id):
        return get_object_or_404(Attempt.objects.select_related("enrollment__course"), pk=attempt_id, enrollment__student=request.user)

    def put(self, request, attempt_id):
        logic.save_answers(self._get(request, attempt_id), request.data.get("answers", {}))
        return Response({"ok": True})

    def post(self, request, attempt_id):
        a = logic.grade(self._get(request, attempt_id), request.data.get("answers", {}))
        e = a.enrollment
        e.refresh_from_db()
        if a.passed and e.credential:
            notify.to_student(request.user, "learn_passed", f"You passed {e.course.title}!",
                              f"Congratulations! You scored {a.score}%. Your certificate number is {e.credential.code}. "
                              f"Download it from your dashboard.", {"type": "learn_certificate"})
        return Response({**s.AttemptSerializer(a).data, "pass_mark": e.course.pass_mark,
                         "certificate": e.credential.code if e.credential else None, "test": logic.test_status(e)})


class StudentCertificates(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        from office.models import CompanySettings
        from office.serializers import CredentialSerializer
        cfg = CompanySettings.get()
        out = []
        for e in Enrollment.objects.filter(student=request.user, credential__isnull=False).select_related("credential", "course"):
            out.append({**CredentialSerializer(e.credential).data, "course": e.course.title,
                        "ceo_signature": cfg.ceo_signature, "hr_signature": cfg.hr_signature})
        return Response(out)


# ======================================================================= staff
class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("learning")]
    serializer_class = s.CourseAdminSerializer
    queryset = Course.objects.all()

    def destroy(self, request, *args, **kwargs):
        c = self.get_object()
        if c.enrollments.exists():
            c.is_published = False
            c.save(update_fields=["is_published"])
            return Response({"detail": "Students are enrolled, so the course was hidden instead of deleted."})
        return super().destroy(request, *args, **kwargs)


class LessonViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("learning")]
    serializer_class = s.LessonAdminSerializer

    def get_queryset(self):
        qs = Lesson.objects.all()
        return qs.filter(course=self.request.query_params["course"]) if self.request.query_params.get("course") else qs


class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffMember, Module.of("learning")]
    serializer_class = s.QuestionAdminSerializer

    def get_queryset(self):
        qs = Question.objects.all()
        return qs.filter(course=self.request.query_params["course"]) if self.request.query_params.get("course") else qs


class EnrollmentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsStaffMember, Module.of("learning")]
    serializer_class = s.EnrollmentSerializer

    def get_queryset(self):
        qs = Enrollment.objects.select_related("student", "course", "credential")
        if self.action != "list":
            return qs
        p = self.request.query_params
        if p.get("course"):
            qs = qs.filter(course=p["course"])
        if p.get("status") and p["status"] != "all":
            qs = qs.filter(status=p["status"])
        if p.get("q"):
            from django.db.models import Q
            q = p["q"]
            qs = qs.filter(Q(student__first_name__icontains=q) | Q(student__last_name__icontains=q) | Q(student__email__icontains=q)
                           | Q(student__phone__icontains=q))
        return qs

    def update(self, request, *args, **kwargs):
        e = self.get_object()
        before = e.extra_attempts
        resp = super().update(request, *args, partial=True)
        e.refresh_from_db()
        if e.extra_attempts > before:
            notify.to_student(e.student, "learn_retake", "Another chance at your test",
                              f"You can take the {e.course.title} test again ({e.attempts_allowed() - e.attempts_used()} tries left).")
        return resp

    @action(detail=True, methods=["get"])
    def attempts(self, request, pk=None):
        return Response(s.AttemptSerializer(self.get_object().attempts.all(), many=True).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Open the course without an online proof (e.g. paid in cash at the office)."""
        if not can(request.user, "fees", True):
            return Response({"detail": "Only Accounts can mark fees as paid."}, status=403)
        e = self.get_object()
        if e.status not in ("unpaid", "review"):
            return Response({"detail": "The course is already open."}, status=400)
        with transaction.atomic():
            FeePayment.objects.create(enrollment=e, method="cash", amount=e.fee, status="approved", reviewed_by=request.user,
                                      staff_note=str(request.data.get("note", ""))[:1000] or "Paid at the office",
                                      reference=str(request.data.get("reference", ""))[:120])
            e.activate()
        notify.to_student(e.student, "learn_open", f"{e.course.title} is open", "Your fee is received. You can start the lessons now.")
        return Response(s.EnrollmentSerializer(e).data)


class FeePaymentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsStaffMember, Module.of("fees")]

    def get_serializer_class(self):
        return s.PaymentDetailSerializer if self.action == "retrieve" else s.PaymentSerializer

    def get_queryset(self):
        qs = FeePayment.objects.select_related("enrollment__student", "enrollment__course")
        if self.action != "list":
            return qs
        status = self.request.query_params.get("status", "pending")
        return qs if status == "all" else qs.filter(status=status)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        p = logic.approve_payment(self.get_object(), request.user, request.data.get("note", ""))
        notify.to_student(p.enrollment.student, "learn_open", f"{p.enrollment.course.title} is open",
                          f"We received your fee of Rs {p.amount}. You can start the lessons now.", {"type": "learn_course"})
        return Response(s.PaymentSerializer(p).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        p = logic.reject_payment(self.get_object(), request.user, request.data.get("note", ""))
        notify.to_student(p.enrollment.student, "learn_payment_rejected", "Payment not confirmed",
                          f"We could not confirm your payment for {p.enrollment.course.title}: {p.staff_note}\n"
                          "Please check and send the details again.", {"type": "learn_course"})
        return Response(s.PaymentSerializer(p).data)


class LearnSettingsView(APIView):
    permission_classes = [IsStaffMember, Module.of("learning")]

    def get(self, request):
        return Response(s.SettingsSerializer(LearnSettings.get()).data)

    def put(self, request):
        if not can(request.user, "learning", True):
            return Response({"detail": "You cannot change these settings."}, status=403)
        ser = s.SettingsSerializer(LearnSettings.get(), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class LearnOverview(APIView):
    permission_classes = [IsStaffMember]

    def get(self, request):
        if not (can(request.user, "learning") or can(request.user, "fees")):
            return Response({"detail": "Not allowed."}, status=403)
        approved = FeePayment.objects.filter(status="approved").aggregate(s=Sum("amount"))["s"] or 0
        return Response({
            "courses": Course.objects.filter(is_published=True).count(),
            "students": Enrollment.objects.values("student").distinct().count(),
            "studying": Enrollment.objects.filter(status="active").count(),
            "completed": Enrollment.objects.filter(status="completed").count(),
            "payments_to_check": FeePayment.objects.filter(status="pending").count(),
            "fees_received": str(approved),
        })
