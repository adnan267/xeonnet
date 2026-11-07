import secrets
from datetime import date

from django.conf import settings
from django.db import IntegrityError, models, transaction
from django.utils import timezone


def token():
    return secrets.token_urlsafe(18)


class CompanySettings(models.Model):
    """One row. Editable by an admin in the staff panel."""
    bank_name = models.CharField(max_length=120, blank=True)
    account_title = models.CharField(max_length=120, blank=True)
    account_number = models.CharField(max_length=60, blank=True)
    iban = models.CharField(max_length=60, blank=True)
    other_payment = models.CharField(max_length=200, blank=True, help_text="e.g. JazzCash / Easypaisa")
    invoice_start = models.PositiveIntegerField(default=335)
    proposal_start = models.PositiveIntegerField(default=335)
    certificate_start = models.PositiveIntegerField(default=101, help_text="First internship certificate serial in the start year")
    certificate_start_year = models.PositiveIntegerField(default=2026)
    # Signature images printed on certificates (PNG with transparent background, stored as data URLs)
    ceo_signature = models.TextField(blank=True)
    hr_signature = models.TextField(blank=True)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    remind_days_before = models.PositiveSmallIntegerField(default=3)
    overdue_repeat_days = models.PositiveSmallIntegerField(default=7)
    proposal_terms = models.TextField(default=(
        "50% advance to start the work, balance on delivery.\n"
        "Prices are valid for the period shown on this proposal.\n"
        "Changes outside the agreed scope are quoted separately."))
    invoice_terms = models.TextField(default=(
        "Payment is due by the due date shown above.\n"
        "Please mention the invoice number with your payment."))

    class Meta:
        verbose_name_plural = "Company settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def bank_lines(self):
        pairs = [("Bank", self.bank_name), ("Account title", self.account_title),
                 ("Account no.", self.account_number), ("IBAN", self.iban), ("Other", self.other_payment)]
        return [{"label": k, "value": v} for k, v in pairs if v]


class Client(models.Model):
    name = models.CharField(max_length=150)
    company = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=2, default="PK", help_text="ISO code, e.g. PK, GB")
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                related_name="client_profile")
    notify_email = models.BooleanField(default=True)
    notify_sms = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.company})" if self.company else self.name


class Document(models.Model):
    class Type(models.TextChoices):
        PROPOSAL = "proposal", "Proposal"
        INVOICE = "invoice", "Invoice"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    PREFIX = {"proposal": "PRO", "invoice": "INV"}
    STATUSES = {"proposal": ["draft", "sent", "accepted", "rejected"], "invoice": ["draft", "sent", "cancelled"]}

    doc_type = models.CharField(max_length=10, choices=Type.choices)
    number = models.CharField(max_length=40, unique=True, editable=False)
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="documents")
    title = models.CharField(max_length=200, blank=True)
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=3, default="PKR")
    discount_type = models.CharField(max_length=10, default="amount", choices=[("amount", "Amount"), ("percent", "Percent")])
    discount_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_percent = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    intro = models.TextField(blank=True)
    scope = models.TextField(blank=True)
    timeline = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    token = models.CharField(max_length=40, unique=True, default=token, editable=False)
    source = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="converted")
    project = models.ForeignKey("Project", null=True, blank=True, on_delete=models.SET_NULL, related_name="documents")
    sent_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                   related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.number

    def save(self, *args, **kwargs):
        if not self.number:
            with transaction.atomic():
                self.number = self.next_number(self.doc_type)
                super().save(*args, **kwargs)
            return
        super().save(*args, **kwargs)

    @classmethod
    def next_number(cls, doc_type):
        cfg = CompanySettings.get()
        start = cfg.invoice_start if doc_type == "invoice" else cfg.proposal_start
        prefix = f"XN-{cls.PREFIX[doc_type]}-{date.today().year}-"
        highest = start - 1
        for n in cls.objects.filter(number__startswith=prefix).values_list("number", flat=True):
            try:
                highest = max(highest, int(n.rsplit("-", 1)[1]))
            except (ValueError, IndexError):
                pass
        return f"{prefix}{highest + 1:04d}"


class DocumentItem(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="items")
    position = models.PositiveIntegerField(default=0)
    description = models.CharField(max_length=500)
    qty = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        ordering = ["position", "id"]


class Payment(models.Model):
    METHODS = ["Bank transfer", "Cash", "Cheque", "JazzCash", "Easypaisa", "Card / Online", "Other"]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    paid_on = models.DateField(default=date.today)
    method = models.CharField(max_length=40, blank=True)
    note = models.CharField(max_length=200, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                    related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["paid_on", "id"]


class Credential(models.Model):
    TYPES = ["Internship Completion Certificate", "Experience Letter", "Appointment Letter",
             "Course Certificate", "Recommendation Letter", "Other Document"]
    code = models.CharField(max_length=40, unique=True, editable=False)
    holder_name = models.CharField(max_length=150)
    doc_type = models.CharField(max_length=80, default=TYPES[0])
    title = models.CharField(max_length=200, blank=True)
    period = models.CharField(max_length=120, blank=True)
    duration = models.CharField(max_length=60, blank=True, help_text="e.g. 3 Months (worked out from the dates if left empty)")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    issued_on = models.DateField(default=timezone.localdate)   # Pakistan date, not UTC
    status = models.CharField(max_length=10, default="valid", choices=[("valid", "Valid"), ("revoked", "Revoked")])
    note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]

    TYPE_CODES = {"Internship Completion Certificate": "INT", "Experience Letter": "EXP", "Appointment Letter": "APT",
                  "Course Certificate": "CRS", "Recommendation Letter": "REC", "Other Document": "DOC"}

    @classmethod
    def next_code(cls, doc_type, year):
        """XN-INT-2026-0101: type code + year + serial. Serial continues after the highest existing one."""
        t = cls.TYPE_CODES.get(doc_type, "DOC")
        prefix = f"XN-{t}-{year}-"
        highest = 0
        if t == "INT":
            cfg = CompanySettings.get()
            if year == cfg.certificate_start_year:
                highest = cfg.certificate_start - 1      # e.g. 100 already issued -> next is 0101
        for c in cls.objects.filter(code__startswith=prefix).values_list("code", flat=True):
            try:
                highest = max(highest, int(c.rsplit("-", 1)[1]))
            except (ValueError, IndexError):
                pass
        return f"{prefix}{highest + 1:04d}"

    @staticmethod
    def work_out_duration(start, end):
        days = (end - start).days + 1
        if days <= 0:
            return ""
        if days >= 28:
            n = max(1, round(days / 30.44))
            return f"{n} Month{'s' if n > 1 else ''}"
        n = max(1, round(days / 7))
        return f"{n} Week{'s' if n > 1 else ''}"

    def save(self, *args, **kwargs):
        if self.start_date and self.end_date:
            if not self.duration:
                self.duration = self.work_out_duration(self.start_date, self.end_date)
            if not self.period:
                f = lambda d: f"{d.day} {d:%B %Y}"
                self.period = f"{f(self.start_date)} – {f(self.end_date)}"
        if self.code:
            return super().save(*args, **kwargs)
        # The unique constraint on `code` is the final guard: if two people issue at the same moment,
        # the loser gets an IntegrityError and simply takes the next number.
        for attempt in range(8):
            self.code = self.next_code(self.doc_type, (self.issued_on or timezone.localdate()).year)
            try:
                with transaction.atomic():
                    return super().save(*args, **kwargs)
            except IntegrityError:
                if attempt == 7:
                    raise
                self.code = ""


class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "In progress"
        REVIEW = "review", "In review"
        DONE = "done", "Completed"
        HOLD = "hold", "On hold"

    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="projects")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PLANNING)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                related_name="managed_projects")
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="projects")
    visible_to_client = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.title

    def progress(self):
        tasks = list(self.tasks.values_list("status", flat=True))
        if not tasks:
            return 100 if self.status == "done" else 0
        return round(100 * sum(1 for s in tasks if s == "done") / len(tasks))


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "todo", "To do"
        DOING = "doing", "In progress"
        DONE = "done", "Done"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                 related_name="tasks")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=10, default="normal",
                                choices=[("low", "Low"), ("normal", "Normal"), ("high", "High")])
    due_date = models.DateField(null=True, blank=True)
    visible_to_client = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["status", "due_date", "id"]


class ProjectUpdate(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="updates")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    text = models.TextField()
    visible_to_client = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]


class Message(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    service = models.CharField(max_length=120, blank=True)
    budget = models.CharField(max_length=60, blank=True)
    message = models.TextField()
    ip = models.GenericIPAddressField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]


class Review(models.Model):
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    text = models.TextField()
    approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]


class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
