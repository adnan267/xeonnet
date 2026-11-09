"""Adds the starter course catalogue (learn/catalog.py) and replaces the small draft sample course."""
from decimal import Decimal

from django.db import migrations


def add(apps, schema_editor):
    from learn.catalog import COURSES, PHOTO
    Course = apps.get_model("learn", "Course")
    Lesson = apps.get_model("learn", "Lesson")
    Question = apps.get_model("learn", "Question")
    Enrollment = apps.get_model("learn", "Enrollment")

    # the 4-lesson draft from migration 0002 is replaced by the full Social Media Marketing course
    old = Course.objects.filter(slug="social-media-marketing-basics", is_published=False).first()
    if old and not Enrollment.objects.filter(course=old).exists():
        old.delete()

    for sort, c in enumerate(COURSES):
        if Course.objects.filter(slug=c["slug"]).exists():
            continue        # never overwrite a course staff may have edited
        course = Course.objects.create(
            slug=c["slug"], title=c["title"], category=c["category"], level=c["level"], summary=c["summary"],
            description=c["description"], outcomes=c["outcomes"], image_url=PHOTO.format(c["photo"]),
            price=Decimal(str(c["price"])), duration=c["duration"], pass_mark=60, max_attempts=3,
            questions_per_test=min(10, len(c["questions"])), time_limit=20, require_all_lessons=True,
            is_published=True, sort=sort)
        for i, (section, title, minutes, body) in enumerate(c["lessons"]):
            Lesson.objects.create(course=course, section=section, title=title, minutes=minutes, body=body,
                                  order=i, is_preview=(i == 0))
        for i, (text, options) in enumerate(c["questions"]):
            k = i % len(options)                       # move the right answer (listed first) to varied positions
            opts = options[1:k + 1] + [options[0]] + options[k + 1:]
            Question.objects.create(course=course, text=text, options=opts, correct=k, order=i)


class Migration(migrations.Migration):
    dependencies = [("learn", "0002_sample_course")]
    operations = [migrations.RunPython(add, migrations.RunPython.noop)]
