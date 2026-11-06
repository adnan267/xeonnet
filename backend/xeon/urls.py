from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts import api as auth
from notify.views import cron_daily
from office import api

router = DefaultRouter(trailing_slash=False)
router.register("clients", api.ClientViewSet, basename="clients")
router.register("documents", api.DocumentViewSet, basename="documents")
router.register("payments", api.PaymentViewSet, basename="payments")
router.register("certificates", api.CredentialViewSet, basename="certificates")
router.register("projects", api.ProjectViewSet, basename="projects")
router.register("tasks", api.TaskViewSet, basename="tasks")
router.register("messages", api.MessageViewSet, basename="messages")
router.register("reviews", api.ReviewViewSet, basename="reviews")
router.register("subscribers", api.SubscriberViewSet, basename="subscribers")
router.register("team", api.TeamViewSet, basename="team")

admin.site.site_header = "Xeon Net — database admin"


def health(request):
    """Quick status page: is the server up, can it reach the database, any setup problems?"""
    import sys

    from django.conf import settings
    from django.db import connection

    from xeon import bootstrap
    data = {"ok": True, "python": sys.version.split()[0], "problems": list(settings.CONFIG_PROBLEMS) + bootstrap.ERRORS}
    try:
        with connection.cursor() as c:
            c.execute("SELECT 1")
        from django.contrib.auth import get_user_model
        data["database"] = f"ok ({connection.vendor})"
        data["admins"] = get_user_model().objects.filter(is_superuser=True).count()
    except Exception as e:  # noqa: BLE001
        data["ok"] = False
        data["database"] = bootstrap._remember("database", e) or bootstrap.ERRORS[-1]
    return JsonResponse(data)


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health", health),
    # auth
    path("api/auth/csrf", auth.csrf),
    path("api/auth/login", auth.login_view),
    path("api/auth/logout", auth.logout_view),
    path("api/auth/me", auth.me),
    path("api/auth/password/change", auth.change_password),
    path("api/auth/password/forgot", auth.forgot_password),
    path("api/auth/password/set", auth.set_password),
    # public website
    path("api/public/contact", api.contact),
    path("api/public/reviews", api.reviews),
    path("api/public/subscribe", api.subscribe),
    path("api/public/verify/<str:code>", api.verify),
    path("api/public/qr/<str:code>.svg", api.qr),
    path("api/public/documents/<str:token>", api.public_document),
    path("api/public/documents/<str:token>/accept", api.public_accept),
    # client portal
    path("api/portal/summary", api.PortalSummary.as_view()),
    path("api/portal/documents", api.PortalDocuments.as_view()),
    path("api/portal/documents/<int:pk>", api.PortalDocuments.as_view()),
    path("api/portal/documents/<int:pk>/accept", api.PortalAccept.as_view()),
    path("api/portal/projects", api.PortalProjects.as_view()),
    path("api/portal/projects/<int:pk>", api.PortalProjects.as_view()),
    # staff panel
    path("api/staff/dashboard", api.DashboardView.as_view()),
    path("api/staff/people", api.PeopleView.as_view()),
    path("api/staff/settings", api.SettingsView.as_view()),
    path("api/staff/notifications", api.NotificationLogView.as_view()),
    path("api/staff/", include(router.urls)),
    # cron
    path("api/cron/daily", cron_daily),
]
