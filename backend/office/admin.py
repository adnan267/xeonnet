from django.contrib import admin

from .models import (Client, CompanySettings, Credential, Document, DocumentItem, Message, Payment, Project,
                     ProjectUpdate, Review, Subscriber, Task)


class ItemInline(admin.TabularInline):
    model = DocumentItem
    extra = 0


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["number", "doc_type", "client", "title", "issue_date", "status"]
    list_filter = ["doc_type", "status"]
    search_fields = ["number", "title", "client__name"]
    inlines = [ItemInline, PaymentInline]


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ["name", "company", "email", "phone", "country"]
    search_fields = ["name", "company", "email", "phone"]


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "client", "status", "due_date"]
    inlines = [TaskInline]


admin.site.register([CompanySettings, Credential, Message, Review, Subscriber, ProjectUpdate, Task, Payment])
