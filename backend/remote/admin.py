from django.contrib import admin

from .models import CoinEntry, Position, RemoteSettings, Submission, Task, Withdrawal, Worker

admin.site.register(RemoteSettings)
admin.site.register(Position)


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ["user", "position", "status", "joined_at"]
    list_filter = ["status", "position"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "coins", "position", "is_active", "created_at"]


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["task", "worker", "status", "coins", "created_at"]
    list_filter = ["status"]


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ["worker", "coins", "amount", "method", "status", "created_at"]
    list_filter = ["status"]


@admin.register(CoinEntry)
class CoinEntryAdmin(admin.ModelAdmin):
    list_display = ["worker", "coins", "kind", "note", "created_at"]

    def has_change_permission(self, request, obj=None):   # the coin history is never edited
        return False

    def has_delete_permission(self, request, obj=None):
        return False
