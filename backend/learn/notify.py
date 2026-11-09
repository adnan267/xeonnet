"""Emails / phone notifications for students and staff. Never raise."""
import logging

from django.conf import settings

log = logging.getLogger("learn")


def to_student(user, kind, subject, text, data=None):
    try:
        from notify import push
        from remote.notify import _email
        push.safe(push.send, [user], subject, text[:200], data or {"type": "learn"})
        _email(user, kind, f"Xeon Net: {subject}",
               f"Hi {user.first_name or 'there'},\n\n{text}\n\nYour courses: {settings.SITE_URL}/learn\n\nXeon Net")
    except Exception as e:  # noqa: BLE001
        log.warning("learn notify failed: %s", e)


def to_staff(module, subject, text, data=None):
    try:
        from notify import push
        push.safe(push.send, push.staff_with(module), subject, text[:200], data or {"type": "learn"})
    except Exception as e:  # noqa: BLE001
        log.warning("learn staff notify failed: %s", e)
