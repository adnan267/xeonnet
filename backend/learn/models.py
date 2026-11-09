"""
Online learning: courses made of lessons (video / text / files), a multiple-choice test that is
marked automatically, and a Xeon Net certificate (XN-CRS-YYYY-NNNN) when the student passes.

Fees: the student pays by JazzCash / Easypaisa / bank and uploads the proof; staff approve it and the
course opens. `FeePayment.method = "gateway"` is reserved for an online payment gateway later.
"""
import secrets
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def new_key():
    return secrets.token_hex(16)


class LearnSettings(models.Model):
    """One row."""
    enroll_open = models.BooleanField(default=True)
    payment_instructions = models.TextField(blank=True, help_text="How to pay (JazzCash / Easypaisa / bank details). Shown to students.")
    gateway_enabled = models.BooleanField(default=False, help_text="Online payment gateway (needs a merchant account)")

    class Meta:
        verbose_name_plural = "Learning settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Course(models.Model):
    LEVELS = [("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced")]

    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.CharField(max_length=60, blank=True)
    level = models.CharField(max_length=14, choices=LEVELS, default="beginner")
    summary = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    outcomes = models.TextField(blank=True, help_text="What students will learn, one per line")
    image_url = models.URLField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"), help_text="PKR; 0 = free")
    duration = models.CharField(max_length=60, blank=True, help_text="e.g. 6 Weeks (printed on the certificate)")
    certificate_title = models.CharField(max_length=160, blank=True, help_text="Course name on the certificate (default: title)")
    pass_mark = models.PositiveSmallIntegerField(default=60, help_text="Percent needed to pass")
    max_attempts = models.PositiveSmallIntegerField(default=3)
    questions_per_test = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Random questions per test (empty = all)")
    time_limit = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Minutes (empty = no limit)")
    require_all_lessons = models.BooleanField(default=True, help_text="Lessons must be finished before the test")
    is_published = models.BooleanField(default=False)
    sort = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:160] or "course"
            slug, n = base, 2
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_free(self):
        return self.price <= 0


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    section = models.CharField(max_length=120, blank=True, help_text="Group heading, e.g. Week 1")
    title = models.CharField(max_length=160)
    video_url = models.URLField(blank=True, help_text="YouTube (unlisted) or Vimeo link")
    body = models.TextField(blank=True, help_text="Guidelines / notes")
    file_url = models.URLField(blank=True, help_text="PDF / Google Drive link")
    file_label = models.CharField(max_length=80, blank=True)
    minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    is_preview = models.BooleanField(default=False, help_text="Free to watch before enrolling")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]


class Question(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    options = models.JSONField(default=list, help_text="List of answer texts")
    correct = models.PositiveSmallIntegerField(help_text="Index of the right answer in options (0 = first)")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]


class Enrollment(models.Model):
    STATUSES = [("unpaid", "Waiting for payment"), ("review", "Payment being checked"), ("active", "Studying"),
                ("completed", "Completed"), ("cancelled", "Cancelled")]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="enrollments")
    status = models.CharField(max_length=10, choices=STATUSES, default="unpaid")
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"), help_text="PKR at the time of enrolling")
    extra_attempts = models.PositiveSmallIntegerField(default=0, help_text="Extra test tries given by staff")
    credential = models.OneToOneField("office.Credential", null=True, blank=True, on_delete=models.SET_NULL, related_name="enrollment")
    staff_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["student", "course"], name="one_enrollment_per_course")]

    def attempts_allowed(self):
        return self.course.max_attempts + self.extra_attempts

    def attempts_used(self):
        return self.attempts.exclude(submitted_at__isnull=True).count()

    def activate(self):
        if self.status in ("unpaid", "review"):
            self.status, self.activated_at = "active", timezone.now()
            self.save(update_fields=["status", "activated_at"])


class FeePayment(models.Model):
    METHODS = [("jazzcash", "JazzCash"), ("easypaisa", "Easypaisa"), ("bank", "Bank transfer"), ("cash", "Cash"),
               ("gateway", "Online payment")]
    STATUSES = [("pending", "Being checked"), ("approved", "Approved"), ("rejected", "Rejected")]

    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=10, choices=METHODS)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=120, blank=True, help_text="Transaction ID")
    payer_name = models.CharField(max_length=120, blank=True)
    proof = models.TextField(blank=True, help_text="Screenshot (data URL)")
    status = models.CharField(max_length=10, choices=STATUSES, default="pending")
    staff_note = models.TextField(blank=True)
    gateway_ref = models.CharField(max_length=120, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class LessonProgress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="+")
    done_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["enrollment", "lesson"], name="one_progress_per_lesson")]


class Attempt(models.Model):
    """One sitting of the test. Questions are chosen when it starts; answers are marked on the server."""
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="attempts")
    key = models.CharField(max_length=32, default=new_key, editable=False)
    question_ids = models.JSONField(default=list)
    order = models.JSONField(default=dict, help_text="Shuffled option order per question")
    answers = models.JSONField(default=dict)
    score = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Percent")
    correct_count = models.PositiveSmallIntegerField(default=0)
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-started_at"]
