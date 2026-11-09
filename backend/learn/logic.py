"""Rules for enrolling, paying, studying and the test. API views call these; they raise ValidationError."""
import random
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Attempt, Enrollment, FeePayment, LearnSettings, Lesson, LessonProgress, Question

GRACE = timedelta(minutes=2)       # network delay allowance after the time limit
MAX_PROOF = 2_000_000              # ~1.5 MB image as a data URL


def enroll(user, course):
    if not course.is_published:
        raise ValidationError({"detail": "This course is not open yet."})
    existing = Enrollment.objects.filter(student=user, course=course).first()
    if existing:
        return existing
    if not LearnSettings.get().enroll_open:
        raise ValidationError({"detail": "Enrolment is closed right now."})
    e = Enrollment.objects.create(student=user, course=course, fee=course.price)
    if course.is_free:
        e.activate()
    return e


def submit_payment(enrollment, method, reference="", payer_name="", proof=""):
    if enrollment.status not in ("unpaid", "review"):
        raise ValidationError({"detail": "This course is already open for you."})
    if method not in ("jazzcash", "easypaisa", "bank"):
        raise ValidationError({"method": "Choose JazzCash, Easypaisa or bank transfer."})
    reference, proof = (reference or "").strip(), (proof or "").strip()
    if not reference and not proof:
        raise ValidationError({"reference": "Enter the transaction ID or upload a screenshot."})
    if proof and (not proof.startswith("data:image/") or len(proof) > MAX_PROOF):
        raise ValidationError({"proof": "Upload a JPG or PNG screenshot under 1.5 MB."})
    if enrollment.payments.filter(status="pending").exists():
        raise ValidationError({"detail": "Your payment is already being checked."})
    with transaction.atomic():
        p = FeePayment.objects.create(enrollment=enrollment, method=method, amount=enrollment.fee, reference=reference[:120],
                                      payer_name=(payer_name or "")[:120], proof=proof)
        enrollment.status = "review"
        enrollment.save(update_fields=["status"])
    return p


def approve_payment(p, staff, note=""):
    with transaction.atomic():
        p = FeePayment.objects.select_for_update().get(pk=p.pk)
        if p.status != "pending":
            raise ValidationError({"detail": "This payment was already checked."})
        p.status, p.staff_note, p.reviewed_by, p.reviewed_at = "approved", (note or "")[:1000], staff, timezone.now()
        p.save()
        p.enrollment.activate()
    return p


def reject_payment(p, staff, note):
    if not (note or "").strip():
        raise ValidationError({"note": "Tell the student what is wrong (they will see it)."})
    with transaction.atomic():
        p = FeePayment.objects.select_for_update().get(pk=p.pk)
        if p.status != "pending":
            raise ValidationError({"detail": "This payment was already checked."})
        p.status, p.staff_note, p.reviewed_by, p.reviewed_at = "rejected", note.strip()[:1000], staff, timezone.now()
        p.save()
        e = p.enrollment
        if e.status == "review":
            e.status = "unpaid"
            e.save(update_fields=["status"])
    return p


def require_open(enrollment):
    if enrollment.status not in ("active", "completed"):
        raise ValidationError({"detail": "Pay the course fee to open the lessons."})


def lessons_done(enrollment):
    return set(enrollment.progress.values_list("lesson_id", flat=True))


def mark_lesson(enrollment, lesson, done=True):
    require_open(enrollment)
    if lesson.course_id != enrollment.course_id:
        raise ValidationError({"detail": "Lesson is not in this course."})
    if done:
        LessonProgress.objects.get_or_create(enrollment=enrollment, lesson=lesson)
    else:
        LessonProgress.objects.filter(enrollment=enrollment, lesson=lesson).delete()


def test_status(enrollment):
    """Can the student take the test now, and if not, why."""
    c = enrollment.course
    total = c.lessons.count()
    done = len(lessons_done(enrollment))
    used, allowed = enrollment.attempts_used(), enrollment.attempts_allowed()
    reason = ""
    if not c.questions.exists():
        reason = "The test for this course is not ready yet."
    elif enrollment.status == "completed":
        reason = "You have passed this course."
    elif enrollment.status != "active":
        reason = "Pay the course fee to open the course."
    elif c.require_all_lessons and done < total:
        reason = f"Finish all lessons first ({done} of {total} done)."
    elif used >= allowed:
        reason = "You have used all your tries. Please contact Xeon Net to get another chance."
    return {"can_start": not reason, "reason": reason, "attempts_used": used, "attempts_allowed": allowed,
            "lessons_done": done, "lessons_total": total, "pass_mark": c.pass_mark, "time_limit": c.time_limit,
            "questions": min(c.questions_per_test or 10**6, c.questions.count())}


def _deadline(attempt):
    t = attempt.enrollment.course.time_limit
    return attempt.started_at + timedelta(minutes=t) if t else None


def _paper(attempt):
    """Questions for the student: options in the shuffled order, never the right answer."""
    qs = {q.id: q for q in Question.objects.filter(pk__in=attempt.question_ids)}
    out = []
    for qid in attempt.question_ids:
        q = qs.get(qid)
        if not q:
            continue
        perm = attempt.order.get(str(qid), list(range(len(q.options))))
        out.append({"id": q.id, "text": q.text, "options": [q.options[i] for i in perm]})
    d = _deadline(attempt)
    return {"attempt": attempt.id, "key": attempt.key, "questions": out, "answers": attempt.answers,
            "ends_at": d.isoformat() if d else None}


def close_expired(enrollment):
    """A test left open past its time limit is marked with the answers saved so far."""
    for a in enrollment.attempts.filter(submitted_at__isnull=True):
        d = _deadline(a)
        if d and timezone.now() > d + GRACE:
            grade(a, a.answers)


def start_attempt(enrollment):
    close_expired(enrollment)
    with transaction.atomic():
        enrollment = Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        open_attempt = enrollment.attempts.filter(submitted_at__isnull=True).first()
        if open_attempt:
            return _paper(open_attempt)
        st = test_status(enrollment)
        if not st["can_start"]:
            raise ValidationError({"detail": st["reason"]})
        ids = list(enrollment.course.questions.values_list("id", flat=True))
        random.shuffle(ids)
        n = enrollment.course.questions_per_test
        ids = ids[:n] if n else ids
        order = {}
        for q in Question.objects.filter(pk__in=ids):
            perm = list(range(len(q.options)))
            random.shuffle(perm)
            order[str(q.id)] = perm
        a = Attempt.objects.create(enrollment=enrollment, question_ids=ids, order=order)
    return _paper(a)


def save_answers(attempt, answers):
    """Autosave while answering."""
    if attempt.submitted_at:
        raise ValidationError({"detail": "This test was already submitted."})
    attempt.answers = {str(k): v for k, v in (answers or {}).items() if str(k) in {str(i) for i in attempt.question_ids}}
    attempt.save(update_fields=["answers"])


def grade(attempt, answers):
    with transaction.atomic():
        attempt = Attempt.objects.select_for_update().get(pk=attempt.pk)
        if attempt.submitted_at:
            raise ValidationError({"detail": "This test was already submitted."})
        qs = {q.id: q for q in Question.objects.filter(pk__in=attempt.question_ids)}
        answers = {str(k): v for k, v in (answers or {}).items()}
        correct = 0
        for qid in attempt.question_ids:
            q, picked = qs.get(qid), answers.get(str(qid))
            if q is None or picked is None:
                continue
            perm = attempt.order.get(str(qid), list(range(len(q.options))))
            try:
                if perm[int(picked)] == q.correct:
                    correct += 1
            except (ValueError, IndexError, TypeError):
                pass
        total = len(attempt.question_ids) or 1
        e = attempt.enrollment
        attempt.answers, attempt.correct_count = answers, correct
        attempt.score = round(correct * 100 / total)
        attempt.passed = attempt.score >= e.course.pass_mark
        attempt.submitted_at = timezone.now()
        attempt.save()
        if attempt.passed and e.status != "completed":
            issue_certificate(e, attempt.score)
    return attempt


def issue_certificate(enrollment, score):
    from office.models import Credential
    c, today = enrollment.course, timezone.localdate()
    cred = Credential.objects.create(
        holder_name=enrollment.student.display_name, doc_type="Course Certificate",
        title=c.certificate_title or c.title, duration=c.duration,
        start_date=(enrollment.activated_at or enrollment.created_at).date(), end_date=today, issued_on=today,
        note=f"Online course passed with {score}%")
    enrollment.credential, enrollment.status, enrollment.completed_at = cred, "completed", timezone.now()
    enrollment.save(update_fields=["credential", "status", "completed_at"])
    return cred


def lesson_count(course):
    return Lesson.objects.filter(course=course).count()
