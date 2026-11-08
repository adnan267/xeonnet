"""
Phone notifications for the Xeon Net app, sent through Expo's push service.
Like email/SMS, these never raise: a failed push must not break saving anything.
"""
import json
import logging
import urllib.request

from django.conf import settings

log = logging.getLogger("notify.push")
EXPO_URL = "https://exp.host/--/api/v2/push/send"


def _tokens(users):
    from accounts.models import AppToken
    ids = [u.pk for u in users if u is not None and getattr(u, "is_active", False)]
    if not ids:
        return []
    return list(AppToken.objects.filter(user_id__in=ids).exclude(push_token="").values_list("id", "push_token"))


def send(users, title, body, data=None):
    """Send one notification to every phone of these users. Returns how many were accepted."""
    if not getattr(settings, "PUSH_ENABLED", True):
        return 0
    rows = _tokens(users)
    if not rows:
        return 0
    from accounts.models import AppToken
    messages = [{"to": t, "title": title[:120], "body": body[:240], "data": data or {}, "sound": "default",
                 "channelId": "default", "priority": "high"} for _, t in rows]
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if settings.EXPO_PUSH_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EXPO_PUSH_ACCESS_TOKEN}"
    ok = 0
    for i in range(0, len(messages), 100):
        chunk, ids = messages[i:i + 100], [r[0] for r in rows[i:i + 100]]
        try:
            req = urllib.request.Request(EXPO_URL, data=json.dumps(chunk).encode(), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=6) as r:
                tickets = json.loads(r.read().decode()).get("data", [])
        except Exception as e:  # noqa: BLE001
            log.warning("push failed: %s", e)
            continue
        for tid, ticket in zip(ids, tickets):
            if ticket.get("status") == "ok":
                ok += 1
            elif (ticket.get("details") or {}).get("error") == "DeviceNotRegistered":
                AppToken.objects.filter(pk=tid).update(push_token="")   # app removed / notifications off
    return ok


def staff_with(module, exclude=None):
    """Active staff who can see a panel module (e.g. 'inbox')."""
    from django.contrib.auth import get_user_model
    from accounts.permissions import can
    return [u for u in get_user_model().objects.filter(is_active=True).exclude(role="client")
            if can(u, module) and u != exclude]


def safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as e:  # noqa: BLE001
        log.warning("push error: %s", e)
        return 0
