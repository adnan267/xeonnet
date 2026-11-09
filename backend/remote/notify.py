"""Emails / phone notifications for remote work. Never raise."""
import logging

from django.conf import settings

log = logging.getLogger("remote")


def _email(user, kind, subject, text):
    from notify.models import NotificationLog
    from notify.providers import send_email
    from office.models import CompanySettings
    if not user.email or not CompanySettings.get().email_enabled:
        return
    entry = NotificationLog(kind=kind, channel="email", to=user.email, subject=subject, body=text)
    try:
        send_email(user.email, subject, text)
        entry.status = "sent"
    except Exception as e:  # noqa: BLE001
        entry.status, entry.error = "failed", str(e)[:1000]
    entry.save()


def to_worker(user, kind, subject, text, data=None):
    try:
        from notify import push
        push.safe(push.send, [user], subject, text[:200], data or {"type": "remote"})
        name = user.first_name or "there"
        _email(user, kind, f"Xeon Net: {subject}",
               f"Hi {name},\n\n{text}\n\nOpen your dashboard: {settings.SITE_URL}/remote\n\nXeon Net")
    except Exception as e:  # noqa: BLE001
        log.warning("remote notify failed: %s", e)


def to_staff(module, subject, text, data=None):
    try:
        from notify import push
        push.safe(push.send, push.staff_with(module), subject, text[:200], data or {"type": "remote"})
    except Exception as e:  # noqa: BLE001
        log.warning("remote staff notify failed: %s", e)
