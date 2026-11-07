from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from notify.models import NotificationLog
from notify.providers import normalize_phone
from notify.service import run_reminders

from .models import Client, CompanySettings, Credential, Document, Project, Task
from .money import amount_in_words, totals


def staff(role, email=None):
    u = User.objects.create_user(email=email or f"{role}@x.test", password="pass12345!", role=role)
    c = APIClient()
    c.force_authenticate(u)
    return u, c


DOC = {"doc_type": "invoice", "client": None, "title": "Website", "currency": "GBP", "discount_type": "percent",
       "discount_value": "10", "tax_percent": "5", "due_date": None,
       "items": [{"description": "Design", "qty": "1", "unit_price": "100"}, {"description": "Hosting", "qty": "2", "unit_price": "5"}]}


@override_settings(EMAIL_PROVIDER="console", SMS_PROVIDER="console")
class BillingTests(TestCase):
    def setUp(self):
        self.client_obj = Client.objects.create(name="Weave & Wear", email="ww@example.com", phone="07700 900123", country="GB")
        cfg = CompanySettings.get()
        cfg.sms_enabled = True
        cfg.save()

    def test_numbering_starts_at_0335(self):
        d1 = Document.objects.create(doc_type="invoice", client=self.client_obj)
        d2 = Document.objects.create(doc_type="invoice", client=self.client_obj)
        p1 = Document.objects.create(doc_type="proposal", client=self.client_obj)
        y = date.today().year
        self.assertEqual(d1.number, f"XN-INV-{y}-0335")
        self.assertEqual(d2.number, f"XN-INV-{y}-0336")
        self.assertEqual(p1.number, f"XN-PRO-{y}-0335")

    def test_words(self):
        self.assertEqual(amount_in_words(Decimal("1234567.50"), "PKR"),
                         "Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Fifty Paisa Only")
        self.assertEqual(amount_in_words(Decimal("1250000"), "GBP"), "Pounds One Million Two Hundred Fifty Thousand Only")

    def test_phone(self):
        self.assertEqual(normalize_phone("0300 6666190", "PK"), "+923006666190")
        self.assertEqual(normalize_phone("07700 900123", "GB"), "+447700900123")
        self.assertEqual(normalize_phone("+44 7700 900123", "PK"), "+447700900123")

    def test_create_send_pay_flow(self):
        _, api = staff("sales")
        r = api.post("/api/staff/documents", {**DOC, "client": self.client_obj.id}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        doc = r.json()
        self.assertEqual(doc["totals"]["total"], "103.95")  # (100+10) -10% then +5%
        r = api.post(f"/api/staff/documents/{doc['id']}/send", {}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual({x["channel"] for x in r.json()["sent"]}, {"email", "sms"})
        # sales cannot record payments
        self.assertEqual(api.post(f"/api/staff/documents/{doc['id']}/payments", {"amount": "50"}, format="json").status_code, 403)
        _, acc = staff("accounts")
        r = acc.post(f"/api/staff/documents/{doc['id']}/payments", {"amount": "50", "method": "Cash"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["document"]["display_status"], "partial")
        self.assertTrue(NotificationLog.objects.filter(kind="payment_received", channel="email").exists())
        # accounts cannot edit documents
        self.assertEqual(acc.patch(f"/api/staff/documents/{doc['id']}", {"title": "x"}, format="json").status_code, 403)

    def test_convert_and_public_accept(self):
        _, api = staff("admin")
        r = api.post("/api/staff/documents", {**DOC, "doc_type": "proposal", "client": self.client_obj.id}, format="json")
        pid, token = r.json()["id"], r.json()["token"]
        anon = APIClient()
        self.assertEqual(anon.get(f"/api/public/documents/{token}").status_code, 404)  # draft is private
        api.post(f"/api/staff/documents/{pid}/send", {"notify": False}, format="json")
        self.assertEqual(anon.get(f"/api/public/documents/{token}").status_code, 200)
        r = anon.post(f"/api/public/documents/{token}/accept")
        self.assertEqual(r.json()["status"], "accepted")
        r = api.post(f"/api/staff/documents/{pid}/convert", {}, format="json")
        self.assertEqual(r.json()["doc_type"], "invoice")
        self.assertEqual(r.json()["source"], pid)

    def test_reminders(self):
        d = Document.objects.create(doc_type="invoice", client=self.client_obj, status="sent",
                                    due_date=date.today() + timedelta(days=2))
        d.items.create(description="x", qty=1, unit_price=10)
        o = Document.objects.create(doc_type="invoice", client=self.client_obj, status="sent",
                                    due_date=date.today() - timedelta(days=5))
        o.items.create(description="x", qty=1, unit_price=10)
        self.assertEqual(run_reminders(), {"due_soon": 1, "overdue": 1})
        self.assertEqual(run_reminders(), {"due_soon": 0, "overdue": 0})  # not twice

    def test_portal_isolation(self):
        _, api = staff("admin")
        r = api.post(f"/api/staff/clients/{self.client_obj.id}/invite", {}, format="json")
        self.assertIn("set-password", r.json()["link"])
        other = Client.objects.create(name="Other")
        mine = Document.objects.create(doc_type="invoice", client=self.client_obj, status="sent")
        theirs = Document.objects.create(doc_type="invoice", client=other, status="sent")
        Document.objects.create(doc_type="invoice", client=self.client_obj, status="draft")
        portal = APIClient()
        portal.force_authenticate(User.objects.get(email="ww@example.com"))
        ids = [d["id"] for d in portal.get("/api/portal/documents").json()]
        self.assertEqual(ids, [mine.id])
        self.assertEqual(portal.get(f"/api/portal/documents/{theirs.id}").status_code, 404)
        self.assertEqual(portal.get("/api/staff/documents").status_code, 403)


class ProjectsAndPublicTests(TestCase):
    def test_staff_sees_only_own_projects(self):
        c = Client.objects.create(name="A")
        u, api = staff("staff")
        p1 = Project.objects.create(client=c, title="Mine")
        p1.members.add(u)
        Project.objects.create(client=c, title="Not mine")
        self.assertEqual([p["title"] for p in api.get("/api/staff/projects").json()], ["Mine"])
        r = api.post("/api/staff/tasks", {"project": p1.id, "title": "Build page", "assignee": u.id}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(api.post("/api/staff/projects", {"client": c.id, "title": "x"}, format="json").status_code, 403)
        self.assertEqual(Task.objects.count(), 1)

    def test_verify_and_contact(self):
        cred = Credential.objects.create(holder_name="Ahmed Raza")
        self.assertEqual(cred.code, f"XN-INT-{date.today().year}-0101" if date.today().year == 2026 else f"XN-INT-{date.today().year}-0001")
        anon = APIClient()
        r = anon.get(f"/api/public/verify/{cred.code.lower()}")
        self.assertTrue(r.json()["found"])
        self.assertEqual(anon.get("/api/public/verify/XN-INT-2026-9999").status_code, 404)
        r = anon.post("/api/public/contact", {"name": "Ali", "email": "a@b.co", "message": "Need a website please"}, format="json")
        self.assertEqual(r.status_code, 200)
        _, hr = staff("hr")
        self.assertEqual(hr.get("/api/staff/messages").status_code, 403)
        self.assertEqual(hr.get("/api/staff/certificates").status_code, 200)


class CertificateNumbers(TestCase):
    def test_sequence_and_uniqueness(self):
        a = Credential.objects.create(holder_name="A", issued_on=date(2026, 8, 1))
        b = Credential.objects.create(holder_name="B", issued_on=date(2026, 8, 2))
        self.assertEqual((a.code, b.code), ("XN-INT-2026-0101", "XN-INT-2026-0102"))
        e = Credential.objects.create(holder_name="C", doc_type="Experience Letter", issued_on=date(2026, 8, 3))
        self.assertEqual(e.code, "XN-EXP-2026-0001")
        n = Credential.objects.create(holder_name="D", issued_on=date(2027, 1, 5))
        self.assertEqual(n.code, "XN-INT-2027-0001")
        b.holder_name = "B2"; b.save()
        self.assertEqual(Credential.objects.get(pk=b.pk).code, "XN-INT-2026-0102")   # never changes
        self.assertEqual(len({c.code for c in Credential.objects.all()}), 4)

    def test_collision_takes_next_number(self):
        from unittest import mock
        Credential.objects.create(holder_name="A", issued_on=date(2026, 8, 1))
        real = Credential.next_code
        calls = []
        def stale(doc_type, year):
            calls.append(1)
            return "XN-INT-2026-0101" if len(calls) == 1 else real(doc_type, year)
        with mock.patch.object(Credential, "next_code", side_effect=stale):
            c = Credential.objects.create(holder_name="B", issued_on=date(2026, 8, 2))
        self.assertEqual(c.code, "XN-INT-2026-0102")

    def test_verify_by_number(self):
        c = Credential.objects.create(holder_name="Ali", issued_on=date(2026, 8, 1))
        r = APIClient().get("/api/public/verify/xn-int-2026-0101")
        self.assertEqual((r.status_code, r.json()["holder_name"], r.json()["code"]), (200, "Ali", c.code))
        self.assertEqual(APIClient().get(f"/api/public/qr/{c.code}.svg").status_code, 200)


class CertificateDetails(TestCase):
    def test_duration_period_and_print_data(self):
        c = Credential.objects.create(holder_name="Ali", title="Full Stack Web Development",
                                      start_date=date(2026, 8, 1), end_date=date(2026, 10, 31), issued_on=date(2026, 10, 31))
        self.assertEqual((c.duration, c.period), ("3 Months", "1 August 2026 – 31 October 2026"))
        w = Credential.objects.create(holder_name="B", start_date=date(2026, 8, 1), end_date=date(2026, 8, 21))
        self.assertEqual(w.duration, "3 Weeks")
        r = APIClient().get(f"/api/public/verify/{c.code}").json()
        self.assertEqual((r["duration"], r["title"], r["status"]), ("3 Months", "Full Stack Web Development", "valid"))
        _, hr = staff("hr")
        sig = "data:image/png;base64,iVBORw0KGgo="
        CompanySettings.objects.update_or_create(pk=1, defaults={"ceo_signature": sig})
        d = hr.get(f"/api/staff/certificates/{c.id}/printable").json()
        self.assertEqual((d["code"], d["ceo_signature"], d["hr_signature"]), (c.code, sig, ""))
        bad = hr.post("/api/staff/certificates", {"holder_name": "X", "start_date": "2026-09-01", "end_date": "2026-08-01"}, format="json")
        self.assertEqual(bad.status_code, 400)

    def test_signature_upload_is_checked(self):
        _, admin = staff("admin")
        self.assertEqual(admin.put("/api/staff/settings", {"ceo_signature": "javascript:alert(1)"}, format="json").status_code, 400)
        ok = admin.put("/api/staff/settings", {"ceo_signature": "data:image/png;base64,iVBORw0KGgo="}, format="json")
        self.assertEqual(ok.status_code, 200)


class BlankTemplate(TestCase):
    def test_blank_gives_next_number_and_today(self):
        from django.utils import timezone
        _, hr = staff("hr")
        d = hr.get("/api/staff/certificates/blank").json()
        y = timezone.localdate().year
        self.assertEqual(d["issued_on"], timezone.localdate().isoformat())
        self.assertTrue(d["next_code"].startswith(f"XN-INT-{y}-"))
        c = hr.post("/api/staff/certificates", {"holder_name": "Sara", "title": "UI/UX Design", "duration": "2 Months",
                                                 "start_date": "2026-09-01", "end_date": "2026-10-31"}, format="json").json()
        self.assertEqual((c["code"], c["issued_on"]), (d["next_code"], d["issued_on"]))
