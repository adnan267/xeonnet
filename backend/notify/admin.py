from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class LogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "kind", "channel", "to", "status"]
    list_filter = ["kind", "channel", "status"]
