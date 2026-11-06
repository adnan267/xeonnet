import secrets

from django.conf import settings
from django.http import JsonResponse

from .service import run_reminders


def cron_daily(request):
    """Vercel Cron calls this once a day with 'Authorization: Bearer <CRON_SECRET>'."""
    expected = settings.CRON_SECRET
    got = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    if not expected or not secrets.compare_digest(got, expected):
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    return JsonResponse({"ok": True, "sent": run_reminders()})
