"""
When something happens (invoice sent, payment received ...) call one of the
notify_* functions. They build the email + SMS, send them through the chosen
provider and write a NotificationLog row. They never raise: a failed email
must not break saving an invoice.
"""
import logging
from datetime import date, timedelta
from html import escape

from django.conf import settings
from django.template.loader import render_to_string

from office.models import CompanySettings, Document
from office.money import effective_status, fmt, totals

from .models import NotificationLog
from .providers import normalize_phone, send_email, send_sms

log = logging.getLogger("notify")
COMPANY = "Xeon Net"


def doc_link(doc):
    return f"{settings.SITE_URL}/d/{doc.token}"


def _deliver(kind, client, subject, text, sms, document=None, cta=None):
    cfg = CompanySettings.get()
    results = []
    if client and client.user_id:   # the client's phone, if they use the Xeon Net app
        from . import push
        data = {"type": "document", "id": document.id} if document else {"type": "portal"}
        push.safe(push.send, [client.user], subject, (sms or subject).replace(f"{COMPANY}: ", ""), data)
    if client and client.email and client.notify_email and cfg.email_enabled:
        html = render_to_string("notify/email.html", {
            "subject": subject, "paragraphs": [escape(p) for p in text.split("\n\n")],
            "cta": cta, "site": settings.SITE_URL})
        results.append(_try("email", kind, client.email, subject, text, document, client,
                            lambda: send_email(client.email, subject, text, html)))
    if client and client.phone and client.notify_sms and cfg.sms_enabled and sms:
        to = normalize_phone(client.phone, client.country)
        results.append(_try("sms", kind, to, "", sms, document, client, lambda: send_sms(to, sms)))
    return results


def _try(channel, kind, to, subject, body, document, client, fn):
    entry = NotificationLog(kind=kind, channel=channel, to=to, subject=subject, body=body,
                            document=document, client=client)
    try:
        fn()
        entry.status = "sent"
    except Exception as e:  # noqa: BLE001
        log.warning("notify %s %s failed: %s", channel, kind, e)
        entry.status, entry.error = "failed", str(e)[:1000]
    entry.save()
    return entry


def _greeting(client):
    return f"Dear {client.name},"


def notify_document_sent(doc):
    t = totals(doc)
    label = doc.get_doc_type_display().lower()
    link = doc_link(doc)
    if doc.doc_type == "invoice":
        due = f" and is due on {doc.due_date:%d %b %Y}" if doc.due_date else ""
        subject = f"Invoice {doc.number} from {COMPANY}"
        body = (f"{_greeting(doc.client)}\n\nPlease find your invoice {doc.number}"
                f"{' for ' + doc.title if doc.title else ''}. The amount is {fmt(t['total'], doc.currency)}{due}.\n\n"
                f"You can view, download and print it here:\n{link}\n\nThank you for your business.\n{COMPANY}")
        sms = f"{COMPANY}: Invoice {doc.number} of {fmt(t['total'], doc.currency)}{due}. View: {link}"
    else:
        subject = f"Proposal {doc.number} from {COMPANY}"
        body = (f"{_greeting(doc.client)}\n\nThank you for considering {COMPANY}. Your {label} "
                f"{doc.number}{' for ' + doc.title if doc.title else ''} is ready.\n\n"
                f"You can review and accept it online here:\n{link}\n\nWe look forward to working with you.\n{COMPANY}")
        sms = f"{COMPANY}: Your proposal {doc.number} is ready. Review & accept: {link}"
    return _deliver(f"{doc.doc_type}_sent", doc.client, subject, body, sms, doc,
                    cta={"label": f"View {label}", "url": link})


def notify_payment(payment):
    doc = payment.document
    t = totals(doc)
    subject = f"Payment received for {doc.number} — thank you"
    left = (f"Remaining balance: {fmt(t['balance'], doc.currency)}." if t["balance"] > 0
            else "This invoice is now fully paid.")
    body = (f"{_greeting(doc.client)}\n\nWe have received your payment of {fmt(payment.amount, doc.currency)} "
            f"on {payment.paid_on:%d %b %Y} for invoice {doc.number}. {left}\n\n"
            f"Receipt and invoice: {doc_link(doc)}\n\nThank you!\n{COMPANY}")
    sms = f"{COMPANY}: Payment of {fmt(payment.amount, doc.currency)} received for {doc.number}. {left} Thank you!"
    return _deliver("payment_received", doc.client, subject, body, sms, doc,
                    cta={"label": "View receipt", "url": doc_link(doc)})


def notify_welcome(client, set_password_url):
    subject = f"Your {COMPANY} client portal"
    body = (f"{_greeting(client)}\n\nWe have created your {COMPANY} client portal account. There you can see your "
            f"proposals, invoices, payments and project progress at any time.\n\n"
            f"Set your password here (the link works for 3 days):\n{set_password_url}\n\n"
            f"Your login email: {client.email}\n\n{COMPANY}")
    sms = f"{COMPANY}: Your client portal is ready. Check your email ({client.email}) to set your password."
    return _deliver("portal_invite", client, subject, body, sms, None,
                    cta={"label": "Set my password", "url": set_password_url})


def _already(kind, doc, since):
    return NotificationLog.objects.filter(kind=kind, document=doc, status="sent", created_at__date__gte=since).exists()


def run_reminders(today=None):
    """Called once a day (Vercel cron). Sends 'due soon' and 'overdue' reminders."""
    today = today or date.today()
    cfg = CompanySettings.get()
    sent = {"due_soon": 0, "overdue": 0}
    invoices = (Document.objects.filter(doc_type="invoice", status="sent", due_date__isnull=False)
                .select_related("client").prefetch_related("items", "payments"))
    for doc in invoices:
        t = totals(doc)
        status = effective_status(doc, t, today)
        if status in ("paid",) or t["balance"] <= 0:
            continue
        link = doc_link(doc)
        amount = fmt(t["balance"], doc.currency)
        days_left = (doc.due_date - today).days
        if 0 <= days_left <= cfg.remind_days_before and not _already("due_soon", doc, today - timedelta(days=cfg.remind_days_before + 1)):
            when = "today" if days_left == 0 else f"in {days_left} day{'s' if days_left > 1 else ''}"
            subject = f"Reminder: invoice {doc.number} is due {when}"
            body = (f"{_greeting(doc.client)}\n\nThis is a friendly reminder that invoice {doc.number} "
                    f"({amount} outstanding) is due {when}, on {doc.due_date:%d %b %Y}.\n\n"
                    f"View and pay: {link}\n\nIf you have already paid, thank you and please ignore this message.\n{COMPANY}")
            sms = f"{COMPANY}: Reminder, invoice {doc.number} ({amount}) is due {when}. {link}"
            _deliver("due_soon", doc.client, subject, body, sms, doc, cta={"label": "View invoice", "url": link})
            sent["due_soon"] += 1
        elif days_left < 0 and not _already("overdue", doc, today - timedelta(days=max(cfg.overdue_repeat_days, 1) - 1)):
            late = -days_left
            subject = f"Overdue: invoice {doc.number}"
            body = (f"{_greeting(doc.client)}\n\nOur records show that invoice {doc.number} is {late} day"
                    f"{'s' if late > 1 else ''} overdue, with {amount} outstanding (due {doc.due_date:%d %b %Y}).\n\n"
                    f"Please arrange payment at your earliest convenience: {link}\n\n"
                    f"If you have already paid, please reply with the details so we can update our records.\n{COMPANY}")
            sms = f"{COMPANY}: Invoice {doc.number} is overdue ({amount}). Please pay: {link}"
            _deliver("overdue", doc.client, subject, body, sms, doc, cta={"label": "Pay invoice", "url": link})
            sent["overdue"] += 1
    return sent
