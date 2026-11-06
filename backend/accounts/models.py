from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        extra.setdefault("username", email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True, role=User.Role.ADMIN)
        return self._create(email, password, **extra)


class User(AbstractUser):
    """Everyone who can log in: Xeon Net staff and client portal users."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SALES = "sales", "Sales"
        ACCOUNTS = "accounts", "Accounts"
        HR = "hr", "HR"
        STAFF = "staff", "Team member"
        CLIENT = "client", "Client"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    phone = models.CharField(max_length=40, blank=True)
    job_title = models.CharField(max_length=120, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def save(self, *args, **kwargs):
        self.email = (self.email or "").lower()
        self.username = self.email
        super().save(*args, **kwargs)

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT

    @property
    def display_name(self):
        return self.get_full_name() or self.email

    def __str__(self):
        return self.display_name
