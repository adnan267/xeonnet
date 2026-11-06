"""
Email and SMS providers. Choose them with environment variables:

  EMAIL_PROVIDER = resend | smtp | console
  SMS_PROVIDER   = twilio | http | console

"console" only prints to the server log (safe default while testing).
"""
import json
import logging
import re
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

log = logging.getLogger("notify")


class SendError(Exception):
    pass


def send_email(to, subject, text, html=None):
    provider = settings.EMAIL_PROVIDER
    if provider == "resend":
        if not settings.RESEND_API_KEY:
            raise SendError("RESEND_API_KEY is not set")
        r = requests.post("https://api.resend.com/emails", timeout=15, headers={
            "Authorization": f"Bearer {settings.RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": settings.EMAIL_FROM, "to": [to], "subject": subject, "text": text,
                  "html": html or None, "reply_to": settings.EMAIL_REPLY_TO})
        if r.status_code >= 300:
            raise SendError(f"Resend {r.status_code}: {r.text[:300]}")
        return
    msg = EmailMultiAlternatives(subject, text, settings.EMAIL_FROM, [to], reply_to=[settings.EMAIL_REPLY_TO])
    if html:
        msg.attach_alternative(html, "text/html")
    if provider == "console":
        log.info("EMAIL to=%s subject=%s\n%s", to, subject, text)
        return
    msg.send(fail_silently=False)


COUNTRY_CODES = {"PK": "92", "GB": "44", "AE": "971", "SA": "966", "US": "1"}


def normalize_phone(phone, country=None):
    """Return +<country><number> or '' when it cannot be understood."""
    country = (country or settings.SMS_DEFAULT_COUNTRY or "PK").upper()
    raw = (phone or "").strip()
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    if raw.startswith("+"):
        return "+" + digits
    if digits.startswith("00"):
        return "+" + digits[2:]
    cc = COUNTRY_CODES.get(country, "92")
    if digits.startswith("0"):
        return f"+{cc}{digits[1:]}"
    if digits.startswith(cc) and len(digits) > 10:
        return "+" + digits
    return f"+{cc}{digits}"


def send_sms(to, message):
    provider = settings.SMS_PROVIDER
    if not to:
        raise SendError("no phone number")
    if provider == "console":
        log.info("SMS to=%s\n%s", to, message)
        return
    if provider == "twilio":
        sid, tok = settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN
        if not (sid and tok and settings.TWILIO_FROM):
            raise SendError("Twilio settings are missing")
        r = requests.post(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", timeout=15,
                          auth=(sid, tok), data={"To": to, "From": settings.TWILIO_FROM, "Body": message})
        if r.status_code >= 300:
            raise SendError(f"Twilio {r.status_code}: {r.text[:300]}")
        return
    if provider == "http":
        if not settings.SMS_HTTP_URL:
            raise SendError("SMS_HTTP_URL is not set")
        local = to.lstrip("+")
        url = settings.SMS_HTTP_URL.replace("{to}", quote(local)).replace("{message}", quote(message))
        if settings.SMS_HTTP_METHOD.upper() == "POST":
            body = (settings.SMS_HTTP_BODY or "").replace("{to}", local).replace("{message}", json.dumps(message)[1:-1])
            r = requests.post(url, data=body.encode(), timeout=15,
                              headers={"Content-Type": "application/json" if body.strip().startswith("{") else
                                       "application/x-www-form-urlencoded"})
        else:
            r = requests.get(url, timeout=15)
        if r.status_code >= 300:
            raise SendError(f"SMS gateway {r.status_code}: {r.text[:300]}")
        return
    raise SendError(f"Unknown SMS_PROVIDER {provider}")
