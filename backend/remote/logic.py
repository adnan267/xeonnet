"""
Everything that changes coins goes through here, inside a database transaction that locks the
worker's row first, so two requests at the same moment can never spend the same coins twice.
"""
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import CoinEntry, RemoteSettings, Submission, Task, Withdrawal, Worker


def _lock(user):
    return Worker.objects.select_for_update().get(user=user)


def submit(task: Task, user, text: str, link: str) -> Submission:
    text, link = (text or "").strip(), (link or "").strip()
    if not text and not link:
        raise ValidationError({"text": "Write what you did or add a link to your work."})
    with transaction.atomic():
        w = _lock(user)
        if w.status != "active":
            raise ValidationError({"detail": "Your account is paused. Please contact Xeon Net."})
        task = Task.objects.select_for_update().get(pk=task.pk)
        if not task.is_available():
            raise ValidationError({"detail": "This task is closed or all places are taken."})
        if task.position_id and w.position_id != task.position_id:
            raise ValidationError({"detail": "This task is for another position."})
        if Submission.objects.filter(task=task, worker=user).exclude(status="rejected").exists():
            raise ValidationError({"detail": "You have already sent this task."})
        try:
            return Submission.objects.create(task=task, worker=user, text=text[:8000], link=link[:500])
        except IntegrityError:
            raise ValidationError({"detail": "You have already sent this task."}) from None


def approve(sub: Submission, staff, coins=None, note="") -> Submission:
    with transaction.atomic():
        sub = Submission.objects.select_for_update().get(pk=sub.pk)
        if sub.status != "pending":
            raise ValidationError({"detail": "This work was already reviewed."})
        _lock(sub.worker)
        amount = sub.task.coins if coins in (None, "") else int(coins)
        if amount < 0:
            raise ValidationError({"coins": "Coins cannot be negative."})
        sub.status, sub.coins, sub.review_note = "approved", amount, (note or "")[:2000]
        sub.reviewed_by, sub.reviewed_at = staff, timezone.now()
        sub.save()
        if amount:
            CoinEntry.objects.create(worker=sub.worker, coins=amount, kind="task", submission=sub, created_by=staff,
                                     note=f"Task: {sub.task.title}"[:240])
    return sub


def reject(sub: Submission, staff, note: str) -> Submission:
    if not (note or "").strip():
        raise ValidationError({"note": "Tell the worker what to change."})
    with transaction.atomic():
        sub = Submission.objects.select_for_update().get(pk=sub.pk)
        if sub.status != "pending":
            raise ValidationError({"detail": "This work was already reviewed."})
        sub.status, sub.review_note, sub.reviewed_by, sub.reviewed_at = "rejected", note.strip()[:2000], staff, timezone.now()
        sub.save()
    return sub


def request_withdrawal(user, coins) -> Withdrawal:
    cfg = RemoteSettings.get()
    try:
        coins = int(coins)
    except (TypeError, ValueError):
        raise ValidationError({"coins": "Enter the number of coins."}) from None
    with transaction.atomic():
        w = _lock(user)
        if w.status != "active":
            raise ValidationError({"detail": "Your account is paused. Please contact Xeon Net."})
        if not (w.payout_method and w.payout_name and w.payout_number):
            raise ValidationError({"detail": "Add your JazzCash / Easypaisa / bank details in your profile first."})
        if coins < cfg.min_withdraw_coins:
            raise ValidationError({"coins": f"The minimum is {cfg.min_withdraw_coins} coins."})
        if Withdrawal.objects.filter(worker=user, status="pending").exists():
            raise ValidationError({"detail": "You already have a withdrawal waiting. Please wait until it is paid."})
        if coins > w.balance():
            raise ValidationError({"coins": "You do not have that many coins."})
        wd = Withdrawal.objects.create(worker=user, coins=coins, amount=cfg.rupees(coins), method=w.payout_method,
                                       account_name=w.payout_name, account_number=w.payout_number, bank=w.payout_bank)
        CoinEntry.objects.create(worker=user, coins=-coins, kind="withdraw", withdrawal=wd, note=f"Withdrawal #{wd.id} requested")
    return wd


def mark_paid(wd: Withdrawal, staff, reference="", note="") -> Withdrawal:
    with transaction.atomic():
        wd = Withdrawal.objects.select_for_update().get(pk=wd.pk)
        if wd.status != "pending":
            raise ValidationError({"detail": "This withdrawal is already closed."})
        wd.status, wd.reference, wd.staff_note = "paid", (reference or "")[:120], (note or "")[:2000]
        wd.processed_by, wd.processed_at = staff, timezone.now()
        wd.save()
    return wd


def reject_withdrawal(wd: Withdrawal, staff, note: str) -> Withdrawal:
    if not (note or "").strip():
        raise ValidationError({"note": "Give a reason (the coins go back to the worker)."})
    with transaction.atomic():
        wd = Withdrawal.objects.select_for_update().get(pk=wd.pk)
        if wd.status != "pending":
            raise ValidationError({"detail": "This withdrawal is already closed."})
        _lock(wd.worker)
        wd.status, wd.staff_note, wd.processed_by, wd.processed_at = "rejected", note.strip()[:2000], staff, timezone.now()
        wd.save()
        CoinEntry.objects.create(worker=wd.worker, coins=wd.coins, kind="refund", withdrawal=wd, created_by=staff,
                                 note=f"Withdrawal #{wd.id} not paid: coins returned")
    return wd


def adjust(user, coins, kind, note, staff) -> CoinEntry:
    try:
        coins = int(coins)
    except (TypeError, ValueError):
        raise ValidationError({"coins": "Enter a whole number of coins."}) from None
    if coins == 0:
        raise ValidationError({"coins": "Enter a number other than 0."})
    if kind not in ("bonus", "adjust"):
        raise ValidationError({"kind": "Choose bonus or correction."})
    if not (note or "").strip():
        raise ValidationError({"note": "Write a reason; the worker sees it."})
    with transaction.atomic():
        w = _lock(user)
        if coins < 0 and w.balance() + coins < 0:
            raise ValidationError({"coins": "That would make the balance negative."})
        return CoinEntry.objects.create(worker=user, coins=coins, kind=kind, note=note.strip()[:240], created_by=staff)
