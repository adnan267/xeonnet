from rest_framework import serializers

from .models import CoinEntry, Position, RemoteSettings, Submission, Task, Withdrawal, Worker


class PositionSerializer(serializers.ModelSerializer):
    workers = serializers.IntegerField(source="workers.count", read_only=True)

    class Meta:
        model = Position
        fields = ["id", "title", "slug", "category", "summary", "description", "requirements", "is_open", "sort", "workers"]
        read_only_fields = ["slug"]


class PublicPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ["id", "title", "slug", "category", "summary", "description", "requirements"]


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemoteSettings
        exclude = ["id"]

    def validate_coin_value(self, v):
        if v <= 0:
            raise serializers.ValidationError("Must be more than 0.")
        return v


class TaskSerializer(serializers.ModelSerializer):
    position_title = serializers.CharField(source="position.title", default="", read_only=True)
    taken = serializers.SerializerMethodField()
    pending = serializers.SerializerMethodField()
    approved = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ["id", "title", "kind", "position", "position_title", "instructions", "resource_url", "proof", "coins",
                  "slots", "deadline", "is_active", "created_at", "taken", "pending", "approved"]

    def get_taken(self, t):
        return t.taken()

    def get_pending(self, t):
        return t.submissions.filter(status="pending").count()

    def get_approved(self, t):
        return t.submissions.filter(status="approved").count()

    def validate_coins(self, v):
        if v < 1:
            raise serializers.ValidationError("Give at least 1 coin.")
        return v


class WorkerTaskSerializer(serializers.ModelSerializer):
    """What a worker sees about a task."""
    position_title = serializers.CharField(source="position.title", default="", read_only=True)
    places_left = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ["id", "title", "kind", "position_title", "instructions", "resource_url", "proof", "coins", "deadline",
                  "places_left", "my_status"]

    def get_places_left(self, t):
        return None if t.slots is None else max(0, t.slots - t.taken())

    def get_my_status(self, t):
        mine = self.context.get("mine", {})
        return mine.get(t.id, "")


class SubmissionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)
    task_coins = serializers.IntegerField(source="task.coins", read_only=True)
    worker_name = serializers.CharField(source="worker.display_name", read_only=True)
    worker_email = serializers.CharField(source="worker.email", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.display_name", default="", read_only=True)

    class Meta:
        model = Submission
        fields = ["id", "task", "task_title", "task_coins", "worker", "worker_name", "worker_email", "text", "link", "status",
                  "coins", "review_note", "reviewed_by_name", "reviewed_at", "created_at"]
        read_only_fields = fields


class WithdrawalSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.display_name", read_only=True)
    worker_email = serializers.CharField(source="worker.email", read_only=True)
    worker_phone = serializers.CharField(source="worker.phone", read_only=True)
    method_label = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = Withdrawal
        fields = ["id", "worker", "worker_name", "worker_email", "worker_phone", "coins", "amount", "method", "method_label",
                  "account_name", "account_number", "bank", "status", "reference", "staff_note", "processed_at", "created_at"]
        read_only_fields = fields


class CoinEntrySerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = CoinEntry
        fields = ["id", "coins", "kind", "kind_label", "note", "created_at"]


class WorkerProfileSerializer(serializers.ModelSerializer):
    """The worker editing their own profile."""
    first_name = serializers.CharField(source="user.first_name", max_length=150)
    last_name = serializers.CharField(source="user.last_name", max_length=150, allow_blank=True, required=False)
    phone = serializers.CharField(source="user.phone", max_length=40, allow_blank=True, required=False)
    email = serializers.EmailField(source="user.email", read_only=True)
    position_title = serializers.CharField(source="position.title", default="", read_only=True)

    class Meta:
        model = Worker
        fields = ["first_name", "last_name", "phone", "email", "position", "position_title", "city", "skills", "about",
                  "portfolio_url", "status", "payout_method", "payout_name", "payout_number", "payout_bank", "joined_at"]
        read_only_fields = ["status", "joined_at", "position"]

    def update(self, w, data):
        u = data.pop("user", {})
        for k, v in u.items():
            setattr(w.user, k, v)
        w.user.save()
        return super().update(w, data)


class StaffWorkerSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.display_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    position_title = serializers.CharField(source="position.title", default="", read_only=True)
    balance = serializers.SerializerMethodField()
    approved = serializers.SerializerMethodField()
    pending = serializers.SerializerMethodField()
    method_label = serializers.CharField(source="get_payout_method_display", read_only=True)

    class Meta:
        model = Worker
        fields = ["id", "name", "email", "phone", "position", "position_title", "city", "skills", "about", "portfolio_url",
                  "status", "staff_note", "payout_method", "method_label", "payout_name", "payout_number", "payout_bank",
                  "joined_at", "balance", "approved", "pending"]
        read_only_fields = ["id", "name", "email", "phone", "city", "skills", "about", "portfolio_url", "payout_method",
                            "payout_name", "payout_number", "payout_bank", "joined_at"]

    def get_balance(self, w):
        return w.balance()

    def get_approved(self, w):
        return w.user.submissions.filter(status="approved").count()

    def get_pending(self, w):
        return w.user.submissions.filter(status="pending").count()
