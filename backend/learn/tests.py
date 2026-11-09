from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Attempt, Course, Enrollment, Question

User = get_user_model()


def staff(role):
    u = User.objects.create_user(email=f"{role}@x.test", password="pass12345!", role=role)
    c = APIClient()
    c.force_authenticate(u)
    return u, c


def answer_all(paper, right=True):
    """Pick the right (or wrong) option using the real questions, mapped through the shuffled order."""
    a = Attempt.objects.get(pk=paper["attempt"])
    out = {}
    for q in paper["questions"]:
        real = Question.objects.get(pk=q["id"])
        perm = a.order[str(q["id"])]
        want = real.correct if right else (real.correct + 1) % len(real.options)
        out[str(q["id"])] = perm.index(want)
    return out


class Learning(TestCase):
    def setUp(self):
        self.c = Course.objects.get(slug="social-media-marketing-basics")
        self.c.is_published, self.c.price = True, Decimal("5000")
        self.c.save()
        self.hr, self.hr_api = staff("hr")
        self.acc, self.acc_api = staff("accounts")

    def join(self, email="sana@x.test"):
        s = APIClient()
        r = s.post(f"/api/public/courses/{self.c.slug}/enroll", {"name": "Sana Malik", "email": email, "phone": "0300 1112223",
                                                                 "password": "Strong-pass-77"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        return s, r.json()["enrollment"]

    def test_public_listing_hides_drafts_and_answers(self):
        Course.objects.create(title="Draft", is_published=False)
        titles = [x["title"] for x in APIClient().get("/api/public/courses").json()]
        self.assertEqual(titles, [self.c.title])
        d = APIClient().get(f"/api/public/courses/{self.c.slug}").json()
        self.assertEqual(len(d["syllabus"]), 4)
        self.assertEqual(len(d["previews"]), 1)
        self.assertNotIn("correct", str(d))

    def test_paid_course_full_flow(self):
        s, eid = self.join()
        self.assertEqual(s.get("/api/auth/me").json()["is_student"], True)
        course = s.get(f"/api/learn/courses/{eid}").json()
        self.assertEqual(course["enrollment"]["status"], "unpaid")
        self.assertEqual(len(course["lessons"]), 1)                                     # only the free preview
        lesson_ids = list(self.c.lessons.values_list("id", flat=True))
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/lessons/{lesson_ids[1]}", {"done": True}, format="json").status_code, 400)
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/pay", {"method": "jazzcash"}, format="json").status_code, 400)
        p = s.post(f"/api/learn/courses/{eid}/pay", {"method": "jazzcash", "reference": "JC123", "payer_name": "Sana"}, format="json")
        self.assertEqual(p.status_code, 201, p.content)
        self.assertEqual(p.json()["amount"], "5000.00")
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/pay", {"method": "jazzcash", "reference": "x"}, format="json").status_code, 400)
        # HR cannot approve fees; Accounts can. Reject first, then pay again and approve.
        self.assertEqual(self.hr_api.post(f"/api/staff/learn/payments/{p.json()['id']}/approve", {}, format="json").status_code, 403)
        self.acc_api.post(f"/api/staff/learn/payments/{p.json()['id']}/reject", {"note": "Wrong amount"}, format="json")
        self.assertEqual(Enrollment.objects.get(pk=eid).status, "unpaid")
        p2 = s.post(f"/api/learn/courses/{eid}/pay", {"method": "bank", "reference": "BANK9"}, format="json").json()
        self.acc_api.post(f"/api/staff/learn/payments/{p2['id']}/approve", {}, format="json")
        course = s.get(f"/api/learn/courses/{eid}").json()
        self.assertEqual((course["enrollment"]["status"], len(course["lessons"])), ("active", 4))
        # test locked until lessons are done
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/test", {}, format="json").status_code, 400)
        for lid in lesson_ids:
            s.post(f"/api/learn/courses/{eid}/lessons/{lid}", {"done": True}, format="json")
        paper = s.post(f"/api/learn/courses/{eid}/test", {}, format="json").json()
        self.assertEqual(len(paper["questions"]), 5)
        self.assertNotIn("correct", str(paper))
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/test", {}, format="json").json()["attempt"], paper["attempt"])  # same open test
        # fail 3 times -> locked; staff gives one more; pass -> certificate
        for i in range(3):
            r = s.post(f"/api/learn/attempts/{paper['attempt']}", {"answers": answer_all(paper, right=False)}, format="json").json()
            self.assertFalse(r["passed"])
            self.assertEqual(r["score"], 0)
            if i < 2:
                paper = s.post(f"/api/learn/courses/{eid}/test", {}, format="json").json()
        self.assertEqual(s.post(f"/api/learn/courses/{eid}/test", {}, format="json").status_code, 400)
        self.hr_api.patch(f"/api/staff/learn/enrollments/{eid}", {"extra_attempts": 1}, format="json")
        paper = s.post(f"/api/learn/courses/{eid}/test", {}, format="json").json()
        r = s.post(f"/api/learn/attempts/{paper['attempt']}", {"answers": answer_all(paper)}, format="json").json()
        self.assertTrue(r["passed"])
        self.assertEqual(r["score"], 100)
        self.assertTrue(r["certificate"].startswith("XN-CRS-"))
        self.assertEqual(s.post(f"/api/learn/attempts/{paper['attempt']}", {"answers": {}}, format="json").status_code, 400)
        v = APIClient().get(f"/api/public/verify/{r['certificate']}").json()
        self.assertEqual((v["holder_name"], v["doc_type"], v["title"]), ("Sana Malik", "Course Certificate", self.c.title))
        certs = s.get("/api/learn/certificates").json()
        self.assertEqual(certs[0]["code"], r["certificate"])

    def test_free_course_opens_at_once_and_roles_are_separate(self):
        self.c.price = Decimal("0")
        self.c.save()
        s, eid = self.join()
        self.assertEqual(Enrollment.objects.get(pk=eid).status, "active")
        for path in ["/api/staff/dashboard", "/api/remote/home", "/api/portal/summary", "/api/staff/learn/courses"]:
            self.assertIn(s.get(path).status_code, (401, 403), path)
        other, _ = self.join("x2@x.test")
        self.assertEqual(other.get(f"/api/learn/courses/{eid}").status_code, 404)        # not their enrolment
        self.assertEqual(self.hr_api.get("/api/learn/home").status_code, 403)

    def test_staff_builds_course(self):
        c = self.hr_api.post("/api/staff/learn/courses", {"title": "Python for Beginners", "price": "8000", "duration": "6 Weeks"}, format="json").json()
        self.assertEqual(c["slug"], "python-for-beginners")
        self.assertEqual(self.hr_api.post("/api/staff/learn/questions", {"course": c["id"], "text": "Q", "options": ["A"], "correct": 0}, format="json").status_code, 400)
        self.assertEqual(self.hr_api.post("/api/staff/learn/questions", {"course": c["id"], "text": "Q", "options": ["A", "B"], "correct": 1}, format="json").status_code, 201)
        self.assertEqual(self.hr_api.post("/api/staff/learn/lessons", {"course": c["id"], "title": "Intro", "video_url": "https://youtu.be/abc"}, format="json").status_code, 201)
        self.assertEqual(self.acc_api.post("/api/staff/learn/courses", {"title": "No"}, format="json").status_code, 403)
