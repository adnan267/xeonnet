from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import CoinEntry, Position, RemoteSettings, Task, Withdrawal

User = get_user_model()


def staff(role):
    u = User.objects.create_user(email=f"{role}@x.test", password="pass12345!", role=role)
    c = APIClient()
    c.force_authenticate(u)
    return u, c


def join(email="ali@x.test", **extra):
    c = APIClient()
    body = {"name": "Ali Raza", "email": email, "phone": "0300 1234567", "password": "Strong-pass-77", "agree": True, **extra}
    return c, c.post("/api/public/remote/join", body, format="json")


class RemoteWork(TestCase):
    def setUp(self):
        RemoteSettings.objects.update_or_create(pk=1, defaults={"coin_value": Decimal("0.50"), "min_withdraw_coins": 100})
        self.pos = Position.objects.get(slug="content-writer")
        self.hr, self.hr_api = staff("hr")
        self.acc, self.acc_api = staff("accounts")

    def test_public_info_and_signup_is_free_and_instant(self):
        info = APIClient().get("/api/public/remote").json()
        self.assertTrue(info["signup_open"])
        self.assertGreaterEqual(len(info["positions"]), 5)
        c, r = join(position=self.pos.id)
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(r.json()["is_remote"])
        self.assertEqual(c.get("/api/remote/home").json()["balance"], 0)       # logged in and active straight away
        _, dup = join()
        self.assertIn("email", dup.json())
        _, bad = join(email="b@x.test", password="123", agree=False)
        self.assertEqual(set(bad.json()) >= {"password", "agree"}, True)

    def test_worker_is_not_staff(self):
        c, _ = join()
        for path in ["/api/staff/clients", "/api/staff/dashboard", "/api/staff/remote/tasks", "/api/portal/summary"]:
            self.assertIn(c.get(path).status_code, (403, 401), path)
        self.assertIn(APIClient().get("/api/remote/home").status_code, (401, 403))
        self.assertEqual(self.hr_api.get("/api/remote/home").status_code, 403)

    def test_task_to_coins_to_withdrawal(self):
        w, _ = join(position=self.pos.id)
        user = User.objects.get(email="ali@x.test")
        t = self.hr_api.post("/api/staff/remote/tasks", {"title": "Write 2 blog posts", "instructions": "500 words each",
                                                         "coins": 150, "slots": 1, "position": self.pos.id}, format="json").json()
        other = self.hr_api.post("/api/staff/remote/tasks", {"title": "Designers only", "instructions": "x", "coins": 10,
                                                             "position": Position.objects.get(slug="graphic-designer").id}, format="json").json()
        open_ids = [x["id"] for x in w.get("/api/remote/tasks").json()]
        self.assertIn(t["id"], open_ids)
        self.assertNotIn(other["id"], open_ids)                                  # task for another position is hidden
        self.assertEqual(w.post(f"/api/remote/tasks/{other['id']}", {"text": "hi"}, format="json").status_code, 400)
        self.assertEqual(w.post(f"/api/remote/tasks/{t['id']}", {}, format="json").status_code, 400)   # empty work
        sub = w.post(f"/api/remote/tasks/{t['id']}", {"text": "Done", "link": "https://docs.google.com/x"}, format="json")
        self.assertEqual(sub.status_code, 201, sub.content)
        self.assertEqual(w.post(f"/api/remote/tasks/{t['id']}", {"text": "again"}, format="json").status_code, 400)
        # slot is taken, so a second worker cannot send it
        w2, _ = join(email="sara@x.test", position=self.pos.id)
        self.assertEqual(w2.post(f"/api/remote/tasks/{t['id']}", {"text": "me too"}, format="json").status_code, 400)
        # reject -> can send again; approve -> coins
        sid = sub.json()["id"]
        self.assertEqual(self.hr_api.post(f"/api/staff/remote/submissions/{sid}/reject", {}, format="json").status_code, 400)
        self.hr_api.post(f"/api/staff/remote/submissions/{sid}/reject", {"note": "Add headings"}, format="json")
        sub2 = w.post(f"/api/remote/tasks/{t['id']}", {"text": "Fixed"}, format="json").json()
        r = self.hr_api.post(f"/api/staff/remote/submissions/{sub2['id']}/approve", {}, format="json")
        self.assertEqual(r.json()["coins"], 150)
        self.assertEqual(self.hr_api.post(f"/api/staff/remote/submissions/{sub2['id']}/approve", {}, format="json").status_code, 400)
        home = w.get("/api/remote/home").json()
        self.assertEqual((home["balance"], home["balance_rupees"]), (150, "75.00"))
        # withdrawal needs payout details, minimum and enough coins
        self.assertEqual(w.post("/api/remote/wallet", {"coins": 120}, format="json").status_code, 400)
        w.patch("/api/remote/profile", {"payout_method": "jazzcash", "payout_name": "Ali Raza", "payout_number": "03001234567"}, format="json")
        self.assertEqual(w.post("/api/remote/wallet", {"coins": 50}, format="json").status_code, 400)    # below minimum
        self.assertEqual(w.post("/api/remote/wallet", {"coins": 500}, format="json").status_code, 400)   # more than balance
        wd = w.post("/api/remote/wallet", {"coins": 120}, format="json")
        self.assertEqual(wd.status_code, 201, wd.content)
        self.assertEqual(wd.json()["amount"], "60.00")
        self.assertEqual(w.get("/api/remote/home").json()["balance"], 30)
        self.assertEqual(w.post("/api/remote/wallet", {"coins": 100}, format="json").status_code, 400)   # one at a time
        # HR cannot pay; accounts can
        self.assertEqual(self.hr_api.post(f"/api/staff/remote/withdrawals/{wd.json()['id']}/paid", {}, format="json").status_code, 403)
        self.acc_api.post(f"/api/staff/remote/withdrawals/{wd.json()['id']}/reject", {"note": "Wrong number"}, format="json")
        self.assertEqual(w.get("/api/remote/home").json()["balance"], 150)      # coins came back
        wd2 = w.post("/api/remote/wallet", {"coins": 150}, format="json").json()
        paid = self.acc_api.post(f"/api/staff/remote/withdrawals/{wd2['id']}/paid", {"reference": "TX123"}, format="json").json()
        self.assertEqual((paid["status"], paid["reference"]), ("paid", "TX123"))
        self.assertEqual(self.acc_api.post(f"/api/staff/remote/withdrawals/{wd2['id']}/reject", {"note": "x"}, format="json").status_code, 400)
        wallet = w.get("/api/remote/wallet").json()
        self.assertEqual(wallet["balance"], 0)
        self.assertEqual(sum(e["coins"] for e in wallet["entries"]), 0)
        self.assertEqual(Withdrawal.objects.get(pk=wd2["id"]).amount, Decimal("75.00"))

    def test_bonus_suspend_and_settings(self):
        w, _ = join()
        user = User.objects.get(email="ali@x.test")
        self.assertEqual(self.hr_api.post(f"/api/staff/remote/workers/{user.id}/coins", {"coins": -5, "kind": "adjust", "note": "x"}, format="json").status_code, 400)
        self.hr_api.post(f"/api/staff/remote/workers/{user.id}/coins", {"coins": 40, "kind": "bonus", "note": "Great work"}, format="json")
        self.assertEqual(self.hr_api.get(f"/api/staff/remote/workers/{user.id}").json()["balance"], 40)
        self.hr_api.patch(f"/api/staff/remote/workers/{user.id}", {"status": "suspended"}, format="json")
        t = self.hr_api.post("/api/staff/remote/tasks", {"title": "T", "instructions": "x", "coins": 5}, format="json").json()
        self.assertEqual(w.post(f"/api/remote/tasks/{t['id']}", {"text": "x"}, format="json").status_code, 400)
        self.assertEqual(self.hr_api.put("/api/staff/remote/settings", {"coin_value": "2"}, format="json").status_code, 403)
        _, admin = staff("admin")
        self.assertEqual(admin.put("/api/staff/remote/settings", {"coin_value": "2", "signup_open": False}, format="json").status_code, 200)
        _, closed = join(email="new@x.test")
        self.assertEqual(closed.status_code, 400)
        self.assertEqual(CoinEntry.objects.filter(worker=user).count(), 1)
        self.assertTrue(Task.objects.filter(pk=t["id"]).exists())
