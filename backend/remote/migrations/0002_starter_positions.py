from django.db import migrations

POSITIONS = [
    ("Content Writer", "Writing", "Write blog posts, website pages, product descriptions and captions for Xeon Net clients.",
     "Good written English (Urdu is a plus)\nCan research a topic and write original text\nMeets deadlines"),
    ("Social Media Assistant", "Social media", "Create posts and captions, schedule content and help manage client pages.",
     "Knows Facebook, Instagram and TikTok well\nBasic Canva or design skills\nCreative and consistent"),
    ("Graphic Designer", "Design", "Design social posts, banners, logos and ad creatives for client campaigns.",
     "Canva, Photoshop or Illustrator\nA few samples of your work\nEye for clean, professional design"),
    ("Video Editor", "Video", "Edit short videos and reels for client social media.",
     "CapCut, Premiere Pro or similar\nKnows reel / short-video formats\nCan add captions and music"),
    ("Data Entry & Research", "Admin", "Collect, check and enter data; online research for client projects.",
     "Good with Excel / Google Sheets\nAccurate and careful\nReliable internet connection"),
    ("Web Developer (Junior)", "Development", "Small website fixes, WordPress updates and front-end tasks.",
     "HTML, CSS and basic JavaScript\nWordPress or React is a plus\nUses GitHub"),
]


def add(apps, schema_editor):
    Position = apps.get_model("remote", "Position")
    if Position.objects.exists():
        return
    for i, (title, cat, summary, req) in enumerate(POSITIONS):
        slug = title.lower().replace(" & ", "-").replace(" (", "-").replace(")", "").replace(" ", "-")
        Position.objects.create(title=title, slug=slug, category=cat, summary=summary, requirements=req, sort=i)


class Migration(migrations.Migration):
    dependencies = [("remote", "0001_initial")]
    operations = [migrations.RunPython(add, migrations.RunPython.noop)]
