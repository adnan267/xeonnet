from django.contrib import admin

from .models import Attempt, Course, Enrollment, FeePayment, LearnSettings, Lesson, Question

admin.site.register(LearnSettings)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ["order", "section", "title", "video_url", "is_preview"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["title", "price", "is_published"]
    inlines = [LessonInline]


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["student", "course", "status", "created_at"]
    list_filter = ["status", "course"]


admin.site.register(Question)
admin.site.register(FeePayment)
admin.site.register(Attempt)
