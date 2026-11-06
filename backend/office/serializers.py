from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import (Client, CompanySettings, Credential, Document, DocumentItem, Message, Payment, Project,
                     ProjectUpdate, Review, Subscriber, Task)
from .money import CURRENCIES, amount_in_words, effective_status, totals

User = get_user_model()


class UserMini(serializers.ModelSerializer):
    name = serializers.CharField(source="display_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "role", "job_title"]


class ClientSerializer(serializers.ModelSerializer):
    has_portal = serializers.SerializerMethodField()
    doc_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Client
        fields = ["id", "name", "company", "email", "phone", "country", "address", "notes", "notify_email",
                  "notify_sms", "has_portal", "doc_count", "created_at"]

    def get_has_portal(self, obj):
        return bool(obj.user_id)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentItem
        fields = ["description", "qty", "unit_price"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "amount", "paid_on", "method", "note", "created_at"]


def money_dict(t):
    return {k: str(v) for k, v in t.items()}


class DocumentSerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True)
    client_detail = ClientSerializer(source="client", read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    totals = serializers.SerializerMethodField()
    display_status = serializers.SerializerMethodField()
    words = serializers.SerializerMethodField()
    bank = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "doc_type", "number", "client", "client_detail", "title", "issue_date", "due_date", "currency",
                  "discount_type", "discount_value", "tax_percent", "status", "display_status", "intro", "scope",
                  "timeline", "terms", "notes", "token", "source", "project", "sent_at", "accepted_at", "items",
                  "payments", "totals", "words", "bank", "created_at", "updated_at"]
        read_only_fields = ["number", "token", "source", "sent_at", "accepted_at", "status"]

    def _t(self, obj):
        if not hasattr(obj, "_totals_cache"):
            obj._totals_cache = totals(obj)
        return obj._totals_cache

    def get_totals(self, obj):
        return money_dict(self._t(obj))

    def get_display_status(self, obj):
        return effective_status(obj, self._t(obj))

    def get_words(self, obj):
        return amount_in_words(self._t(obj)["total"], obj.currency)

    def get_bank(self, obj):
        return CompanySettings.get().bank_lines() if obj.doc_type == "invoice" else []

    def validate_currency(self, v):
        if v not in CURRENCIES:
            raise serializers.ValidationError("Unsupported currency")
        return v

    def validate_items(self, items):
        items = [i for i in items if i.get("description", "").strip()]
        if not items:
            raise serializers.ValidationError("Add at least one item.")
        return items

    @transaction.atomic
    def create(self, data):
        items = data.pop("items")
        doc = Document.objects.create(**data)
        self._save_items(doc, items)
        return doc

    @transaction.atomic
    def update(self, doc, data):
        items = data.pop("items", None)
        for k, v in data.items():
            setattr(doc, k, v)
        doc.save()
        if items is not None:
            doc.items.all().delete()
            self._save_items(doc, items)
        if hasattr(doc, "_totals_cache"):
            del doc._totals_cache
        return doc

    def _save_items(self, doc, items):
        DocumentItem.objects.bulk_create([DocumentItem(document=doc, position=i, **it) for i, it in enumerate(items)])


class DocumentListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_company = serializers.CharField(source="client.company", read_only=True)
    totals = serializers.SerializerMethodField()
    display_status = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "doc_type", "number", "client", "client_name", "client_company", "title", "issue_date",
                  "due_date", "currency", "status", "display_status", "totals"]

    def get_totals(self, obj):
        obj._t = totals(obj)
        return money_dict(obj._t)

    def get_display_status(self, obj):
        return effective_status(obj, getattr(obj, "_t", None) or totals(obj))


class PublicDocumentSerializer(DocumentSerializer):
    class Meta(DocumentSerializer.Meta):
        fields = [f for f in DocumentSerializer.Meta.fields if f not in ("client", "source", "project", "token")]


class CredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credential
        fields = ["id", "code", "holder_name", "doc_type", "title", "period", "issued_on", "status", "note",
                  "created_at"]
        read_only_fields = ["code"]


class PublicCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credential
        fields = ["code", "holder_name", "doc_type", "title", "period", "issued_on", "status", "note"]


class TaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserMini(source="assignee", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = Task
        fields = ["id", "project", "project_title", "title", "description", "assignee", "assignee_detail", "status",
                  "priority", "due_date", "visible_to_client", "created_at", "updated_at"]


class UpdateSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.display_name", read_only=True, default="")

    class Meta:
        model = ProjectUpdate
        fields = ["id", "project", "author_name", "text", "visible_to_client", "created_at"]


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    manager_detail = UserMini(source="manager", read_only=True)
    members_detail = UserMini(source="members", many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    task_counts = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "client", "client_name", "title", "description", "status", "start_date", "due_date", "manager",
                  "manager_detail", "members", "members_detail", "visible_to_client", "progress", "task_counts",
                  "created_at"]

    def get_progress(self, obj):
        return obj.progress()

    def get_task_counts(self, obj):
        c = {"todo": 0, "doing": 0, "done": 0}
        for s in obj.tasks.values_list("status", flat=True):
            c[s] = c.get(s, 0) + 1
        return c


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "name", "email", "phone", "service", "budget", "message", "is_read", "created_at"]
        read_only_fields = ["name", "email", "phone", "service", "budget", "message", "created_at"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "role", "rating", "text", "approved", "created_at"]


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ["id", "email", "created_at"]


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanySettings
        exclude = ["id"]


class TeamSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    name = serializers.CharField(source="display_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "name", "role", "phone", "job_title", "is_active",
                  "password", "last_login", "date_joined"]
        read_only_fields = ["last_login", "date_joined"]

    def validate_role(self, v):
        if v == "client":
            raise serializers.ValidationError("Client logins are created from the Clients page.")
        return v

    def create(self, data):
        pw = data.pop("password", "") or None
        user = User.objects.create_user(**data, password=pw)
        if not pw:
            user.set_unusable_password()
            user.save()
        return user

    def update(self, user, data):
        pw = data.pop("password", "")
        for k, v in data.items():
            setattr(user, k, v)
        if pw:
            user.set_password(pw)
        user.save()
        return user
