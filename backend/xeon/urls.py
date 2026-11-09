from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts import api as auth
from notify.views import cron_daily
from office import api
from learn import api as learn
from remote import api as remote

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
router.register("remote/positions", remote.PositionViewSet, basename="remote-positions")
router.register("remote/tasks", remote.TaskViewSet, basename="remote-tasks")
router.register("remote/submissions", remote.SubmissionViewSet, basename="remote-submissions")
router.register("remote/workers", remote.WorkerViewSet, basename="remote-workers")
router.register("remote/withdrawals", remote.WithdrawalViewSet, basename="remote-withdrawals")
router.register("learn/courses", learn.CourseViewSet, basename="learn-courses")
router.register("learn/lessons", learn.LessonViewSet, basename="learn-lessons")
router.register("learn/questions", learn.QuestionViewSet, basename="learn-questions")
router.register("learn/enrollments", learn.EnrollmentViewSet, basename="learn-enrollments")
router.register("learn/payments", learn.FeePaymentViewSet, basename="learn-payments")

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
    path("api/auth/app/login", auth.app_login),
    path("api/auth/app/logout", auth.app_logout),
    path("api/auth/app/push", auth.app_push),
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
    # remote work: website + worker panel
    path("api/public/remote", remote.public_info),
    path("api/public/remote/join", remote.signup),
    path("api/remote/home", remote.WorkerHome.as_view()),
    path("api/remote/tasks", remote.WorkerTasks.as_view()),
    path("api/remote/tasks/<int:pk>", remote.WorkerTasks.as_view()),
    path("api/remote/submissions", remote.WorkerSubmissions.as_view()),
    path("api/remote/wallet", remote.WorkerWallet.as_view()),
    path("api/remote/profile", remote.WorkerProfile.as_view()),
    path("api/staff/remote/overview", remote.RemoteOverview.as_view()),
    path("api/staff/remote/settings", remote.RemoteSettingsView.as_view()),
    # online learning: website + student panel
    path("api/public/courses", learn.courses),
    path("api/public/courses/<slug:slug>", learn.course_detail),
    path("api/public/courses/<slug:slug>/enroll", learn.enroll),
    path("api/learn/home", learn.StudentHome.as_view()),
    path("api/learn/courses/<int:pk>", learn.StudentCourse.as_view()),
    path("api/learn/courses/<int:pk>/pay", learn.StudentPay.as_view()),
    path("api/learn/courses/<int:pk>/lessons/<int:lesson_id>", learn.StudentLesson.as_view()),
    path("api/learn/courses/<int:pk>/test", learn.StudentTest.as_view()),
    path("api/learn/attempts/<int:attempt_id>", learn.StudentAttempt.as_view()),
    path("api/learn/certificates", learn.StudentCertificates.as_view()),
    path("api/staff/learn/overview", learn.LearnOverview.as_view()),
    path("api/staff/learn/settings", learn.LearnSettingsView.as_view()),
    # staff panel
    path("api/staff/dashboard", api.DashboardView.as_view()),
    path("api/staff/people", api.PeopleView.as_view()),
    path("api/staff/settings", api.SettingsView.as_view()),
    path("api/staff/notifications", api.NotificationLogView.as_view()),
    path("api/staff/", include(router.urls)),
    # cron
    path("api/cron/daily", cron_daily),
]
