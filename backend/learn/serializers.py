from django.db.models import Sum
from rest_framework import serializers

from .models import Attempt, Course, Enrollment, FeePayment, LearnSettings, Lesson, Question


def lesson_kind(lesson):
    return "video" if lesson.video_url else "file" if lesson.file_url and not lesson.body else "text"


class CourseCardSerializer(serializers.ModelSerializer):
    lessons = serializers.SerializerMethodField()
    minutes = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "category", "level", "summary", "image_url", "price", "duration", "lessons", "minutes"]

    def get_lessons(self, c):
        return c.lessons.count()

    def get_minutes(self, c):
        return c.lessons.aggregate(s=Sum("minutes"))["s"] or 0


class SyllabusLessonSerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ["id", "section", "title", "minutes", "is_preview", "kind"]

    def get_kind(self, lesson):
        return lesson_kind(lesson)


class LessonContentSerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ["id", "section", "title", "minutes", "is_preview", "kind", "video_url", "body", "file_url", "file_label"]

    def get_kind(self, lesson):
        return lesson_kind(lesson)


class CourseDetailSerializer(CourseCardSerializer):
    syllabus = SyllabusLessonSerializer(source="lessons", many=True, read_only=True)
    questions = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta(CourseCardSerializer.Meta):
        fields = CourseCardSerializer.Meta.fields + ["description", "outcomes", "pass_mark", "max_attempts", "time_limit",
                                                     "questions", "questions_per_test", "syllabus"]


# ----------------------------------------------------------------- staff
class CourseAdminSerializer(serializers.ModelSerializer):
    lessons_count = serializers.IntegerField(source="lessons.count", read_only=True)
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)
    students = serializers.IntegerField(source="enrollments.count", read_only=True)

    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["slug", "created_at"]

    def validate_pass_mark(self, v):
        if not 1 <= v <= 100:
            raise serializers.ValidationError("Between 1 and 100.")
        return v

    def validate_max_attempts(self, v):
        if v < 1:
            raise serializers.ValidationError("At least 1.")
        return v


class LessonAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = "__all__"


class QuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = "__all__"

    def validate(self, data):
        raw = data.get("options", getattr(self.instance, "options", []))
        correct = data.get("correct", getattr(self.instance, "correct", None))
        opts, new_correct = [], None
        for i, o in enumerate(raw):                      # drop empty answers, keep the right one pointing at the same text
            if str(o).strip():
                if i == correct:
                    new_correct = len(opts)
                opts.append(str(o).strip())
        if len(opts) < 2:
            raise serializers.ValidationError({"options": "Give at least 2 answers."})
        if new_correct is None:
            raise serializers.ValidationError({"correct": "Choose which answer is right (it cannot be empty)."})
        data["options"], data["correct"] = opts, new_correct
        return data


class PaymentSerializer(serializers.ModelSerializer):
    method_label = serializers.CharField(source="get_method_display", read_only=True)
    student_name = serializers.CharField(source="enrollment.student.display_name", read_only=True)
    student_email = serializers.CharField(source="enrollment.student.email", read_only=True)
    student_phone = serializers.CharField(source="enrollment.student.phone", read_only=True)
    course_title = serializers.CharField(source="enrollment.course.title", read_only=True)
    has_proof = serializers.SerializerMethodField()

    class Meta:
        model = FeePayment
        fields = ["id", "enrollment", "method", "method_label", "amount", "reference", "payer_name", "has_proof", "status",
                  "staff_note", "reviewed_at", "created_at", "student_name", "student_email", "student_phone", "course_title"]

    def get_has_proof(self, p):
        return bool(p.proof)


class PaymentDetailSerializer(PaymentSerializer):
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ["proof"]


class AttemptSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    class Meta:
        model = Attempt
        fields = ["id", "score", "correct_count", "total", "passed", "started_at", "submitted_at"]

    def get_total(self, a):
        return len(a.question_ids)


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.display_name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    student_phone = serializers.CharField(source="student.phone", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    progress = serializers.SerializerMethodField()
    attempts_used = serializers.SerializerMethodField()
    attempts_allowed = serializers.SerializerMethodField()
    best_score = serializers.SerializerMethodField()
    certificate = serializers.CharField(source="credential.code", default="", read_only=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "student_name", "student_email", "student_phone", "course", "course_title", "status",
                  "status_label", "fee", "extra_attempts", "staff_note", "created_at", "activated_at", "completed_at",
                  "progress", "attempts_used", "attempts_allowed", "best_score", "certificate"]
        read_only_fields = ["student", "course", "fee", "created_at", "activated_at", "completed_at", "status"]

    def get_progress(self, e):
        total = e.course.lessons.count()
        return round(e.progress.count() * 100 / total) if total else 0

    def get_attempts_used(self, e):
        return e.attempts_used()

    def get_attempts_allowed(self, e):
        return e.attempts_allowed()

    def get_best_score(self, e):
        s = [a.score for a in e.attempts.all() if a.score is not None]
        return max(s) if s else None


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearnSettings
        exclude = ["id"]
