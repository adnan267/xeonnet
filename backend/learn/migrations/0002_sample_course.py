from decimal import Decimal

from django.db import migrations

LESSONS = [
    ("Week 1", "What social media marketing is", "Why businesses use social media, choosing the right platforms, and setting a simple goal (followers, messages or sales).", 15),
    ("Week 1", "Planning a content calendar", "Plan 3–4 posts a week. Mix: helpful tips, behind the scenes, offers and customer reviews. Keep a simple Google Sheet calendar.", 20),
    ("Week 2", "Making posts that people stop for", "Strong first line, one clear message, brand colours, and a call to action (e.g. 'Message us on WhatsApp').", 25),
    ("Week 2", "Reading your results", "Check reach, engagement and messages every week. Keep what works, change what does not.", 15),
]
QUESTIONS = [
    ("What should every post end with?", ["A call to action", "A long paragraph", "Ten hashtags", "Nothing"], 0),
    ("A good starting posting plan for a small business is…", ["3–4 posts a week", "20 posts a day", "One post a year", "Only when there is a sale"], 0),
    ("Which number shows how many different people saw a post?", ["Reach", "Likes", "Comments", "Shares"], 0),
    ("Before making content you should first…", ["Choose a clear goal", "Buy followers", "Post on every platform", "Copy a competitor"], 0),
    ("A content calendar is…", ["A plan of what to post and when", "A list of followers", "A paid advert", "A type of hashtag"], 0),
]


def add(apps, schema_editor):
    Course = apps.get_model("learn", "Course")
    if Course.objects.exists():
        return
    c = Course.objects.create(
        title="Social Media Marketing Basics", slug="social-media-marketing-basics", category="Digital Marketing",
        summary="Plan, create and measure social media content for a small business.",
        description="A practical starter course. Edit the lessons, add your own videos, set the fee and publish when ready.",
        outcomes="Plan a monthly content calendar\nWrite posts with a clear call to action\nRead reach and engagement numbers",
        price=Decimal("0"), duration="2 Weeks", is_published=False)
    Lesson = apps.get_model("learn", "Lesson")
    for i, (section, title, body, minutes) in enumerate(LESSONS):
        Lesson.objects.create(course=c, section=section, title=title, body=body, minutes=minutes, order=i, is_preview=(i == 0))
    Question = apps.get_model("learn", "Question")
    for i, (text, options, correct) in enumerate(QUESTIONS):
        Question.objects.create(course=c, text=text, options=options, correct=correct, order=i)


class Migration(migrations.Migration):
    dependencies = [("learn", "0001_initial")]
    operations = [migrations.RunPython(add, migrations.RunPython.noop)]
