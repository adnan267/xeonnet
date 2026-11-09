"""
Remote work: people join from the website (free, approved automatically), pick up tasks,
send their work, and earn coins when a staff member approves it. Coins are turned into
money through a withdrawal request that staff pay by JazzCash / Easypaisa / bank.

Coins are an append-only ledger (CoinEntry). A worker's balance is the sum of their entries,
so every coin can be traced back to a task, a withdrawal or a manual adjustment.
"""
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.text import slugify


class RemoteSettings(models.Model):
    """One row, edited by an admin."""
    signup_open = models.BooleanField(default=True, help_text="Show the join form on the website")
    coin_value = models.DecimalField(max_digits=8, decimal_places=4, default=Decimal("1.00"),
                                     help_text="Rupees (PKR) paid for one coin")
    min_withdraw_coins = models.PositiveIntegerField(default=1000)
    payout_days = models.CharField(max_length=120, default="within 3 working days")

    class Meta:
        verbose_name_plural = "Remote work settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def rupees(self, coins):
        return (Decimal(coins) * self.coin_value).quantize(Decimal("0.01"))


class Position(models.Model):
    """A remote job opening shown on the website (e.g. Content Writer)."""
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    category = models.CharField(max_length=60, blank=True)
    summary = models.CharField(max_length=240, blank=True)
    description = models.TextField(blank=True)
    requirements = models.TextField(blank=True, help_text="One per line")
    is_open = models.BooleanField(default=True)
    sort = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort", "title"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:120] or "position"
            slug, n = base, 2
            while Position.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, n = f"{base}-{n}", n + 1
            self.slug = slug
        super().save(*args, **kwargs)


class Worker(models.Model):
    """Profile of a remote worker (their login is a User with role 'remote')."""
    STATUSES = [("active", "Active"), ("suspended", "Suspended")]
    METHODS = [("jazzcash", "JazzCash"), ("easypaisa", "Easypaisa"), ("bank", "Bank account")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="worker")
    position = models.ForeignKey(Position, null=True, blank=True, on_delete=models.SET_NULL, related_name="workers")
    city = models.CharField(max_length=80, blank=True)
    skills = models.CharField(max_length=300, blank=True)
    about = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)
    status = models.CharField(max_length=12, choices=STATUSES, default="active")
    staff_note = models.TextField(blank=True)
    payout_method = models.CharField(max_length=12, choices=METHODS, blank=True)
    payout_name = models.CharField(max_length=120, blank=True, help_text="Account holder name")
    payout_number = models.CharField(max_length=60, blank=True, help_text="Mobile number or IBAN")
    payout_bank = models.CharField(max_length=80, blank=True)
    joined_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-joined_at"]

    def __str__(self):
        return self.user.display_name

    def balance(self):
        return self.user.coin_entries.aggregate(s=Sum("coins"))["s"] or 0


class Task(models.Model):
    """Work offered to remote workers. Leave `position` empty to offer it to everyone."""
    KINDS = [("work", "Client work"), ("social", "Social media"), ("training", "Training"), ("other", "Other")]

    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=12, choices=KINDS, default="work")
    position = models.ForeignKey(Position, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    instructions = models.TextField()
    resource_url = models.URLField(blank=True, help_text="Brief, files or reference link")
    proof = models.CharField(max_length=240, blank=True, help_text="What the worker must send back")
    coins = models.PositiveIntegerField()
    slots = models.PositiveIntegerField(null=True, blank=True, help_text="How many approved submissions are needed (empty = no limit)")
    deadline = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def taken(self):
        """Submissions that hold a slot (waiting for review or approved)."""
        return self.submissions.exclude(status="rejected").count()

    def is_available(self):
        if not self.is_active:
            return False
        if self.deadline and self.deadline < timezone.now():
            return False
        return self.slots is None or self.taken() < self.slots


class Submission(models.Model):
    STATUSES = [("pending", "Waiting for review"), ("approved", "Approved"), ("rejected", "Needs changes")]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="submissions")
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    text = models.TextField(blank=True)
    link = models.URLField(blank=True)
    status = models.CharField(max_length=10, choices=STATUSES, default="pending")
    coins = models.PositiveIntegerField(default=0, help_text="Coins given when approved")
    review_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # one live (pending/approved) submission per worker per task; after "needs changes" they may send again
            models.UniqueConstraint(fields=["task", "worker"], condition=~Q(status="rejected"), name="one_live_submission"),
        ]


class Withdrawal(models.Model):
    STATUSES = [("pending", "Requested"), ("paid", "Paid"), ("rejected", "Rejected")]

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="withdrawals")
    coins = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="PKR at the coin value when requested")
    method = models.CharField(max_length=12, choices=Worker.METHODS)
    account_name = models.CharField(max_length=120)
    account_number = models.CharField(max_length=60)
    bank = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=10, choices=STATUSES, default="pending")
    reference = models.CharField(max_length=120, blank=True, help_text="Transaction ID of the payment")
    staff_note = models.TextField(blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class CoinEntry(models.Model):
    """One line in a worker's coin history. Positive = earned, negative = spent / held."""
    KINDS = [("task", "Task approved"), ("withdraw", "Withdrawal"), ("refund", "Withdrawal returned"),
             ("bonus", "Bonus"), ("adjust", "Correction")]

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coin_entries")
    coins = models.IntegerField()
    kind = models.CharField(max_length=10, choices=KINDS)
    note = models.CharField(max_length=240, blank=True)
    submission = models.OneToOneField(Submission, null=True, blank=True, on_delete=models.PROTECT, related_name="coin_entry")
    withdrawal = models.ForeignKey(Withdrawal, null=True, blank=True, on_delete=models.PROTECT, related_name="coin_entries")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
