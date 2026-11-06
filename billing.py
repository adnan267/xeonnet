"""
Proposals & invoices for clients — admin tools plus a private share link.

Admin (login required):
  /admin/clients              clients list + add / edit
  /admin/documents            proposals and invoices list
  /admin/documents/new        create (type=proposal | invoice)
  /admin/documents/<id>       preview, print / save as PDF, share, payments
Public (secret link, no login):
  /d/<token>                  what the client sees (can accept a proposal)
"""
import re
import secrets
from datetime import date, datetime, timedelta
from urllib.parse import quote

from flask import (Blueprint, abort, flash, redirect, render_template, request,
                   url_for)

import data
from core import check_csrf, get_db, login_required

bp = Blueprint("billing", __name__)

CURRENCIES = {
    "PKR": ("Rupees", "Paisa"), "USD": ("US Dollars", "Cents"), "GBP": ("Pounds", "Pence"),
    "EUR": ("Euros", "Cents"), "AED": ("UAE Dirhams", "Fils"), "SAR": ("Saudi Riyals", "Halalas"),
}
STATUSES = {
    "proposal": ["draft", "sent", "accepted", "rejected"],
    "invoice": ["draft", "sent", "cancelled"],
}
TYPE_LABEL = {"proposal": "Proposal", "invoice": "Invoice"}
TYPE_PREFIX = {"proposal": "PRO", "invoice": "INV"}


# ------------------------------------------------------------------ helpers
def today():
    return date.today().isoformat()


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def num(value, default=0.0):
    try:
        return float(str(value).replace(",", "").strip() or default)
    except ValueError:
        return default


def r2(x):
    return round(x + 1e-9, 2)


def fmt_money(amount, currency="PKR"):
    amount = r2(amount or 0)
    text = f"{amount:,.0f}" if abs(amount - round(amount)) < 0.005 else f"{amount:,.2f}"
    return f"{currency} {text}"


def fmt_date(value):
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").strftime("%d %b %Y")
    except (TypeError, ValueError):
        return value or ""


_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
         "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _below_1000(n):
    out = []
    if n >= 100:
        out.append(_ONES[n // 100] + " Hundred")
        n %= 100
    if n >= 20:
        out.append(_TENS[n // 10] + (" " + _ONES[n % 10] if n % 10 else ""))
    elif n:
        out.append(_ONES[n])
    return " ".join(out)


def number_to_words(n):
    """South-Asian grouping: crore, lakh, thousand."""
    n = int(n)
    if n == 0:
        return "Zero"
    parts = []
    for size, name in ((10_000_000, "Crore"), (100_000, "Lakh"), (1000, "Thousand")):
        if n >= size:
            parts.append(_below_1000(n // size) + " " + name)
            n %= size
    if n:
        parts.append(_below_1000(n))
    return " ".join(parts)


def amount_in_words(amount, currency="PKR"):
    major, minor = CURRENCIES.get(currency, (currency, "Cents"))
    amount = r2(amount)
    whole = int(amount)
    cents = int(round((amount - whole) * 100))
    text = f"{major} {number_to_words(whole)}"
    if cents:
        text += f" and {number_to_words(cents)} {minor}"
    return text + " Only"


def phone_for_whatsapp(phone):
    digits = re.sub(r"\D", "", phone or "")
    if not digits:
        return ""
    if digits.startswith("00"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = "92" + digits[1:]
    return digits


def compute_totals(doc, items):
    subtotal = r2(sum(i["qty"] * i["unit_price"] for i in items))
    if doc["discount_type"] == "percent":
        discount = subtotal * min(max(doc["discount_value"], 0), 100) / 100
    else:
        discount = min(max(doc["discount_value"], 0), subtotal)
    discount = r2(discount)
    taxable = r2(subtotal - discount)
    tax = r2(taxable * max(doc["tax_percent"], 0) / 100)
    total = r2(taxable + tax)
    paid = r2(doc["paid_amount"] or 0)
    return {"subtotal": subtotal, "discount": discount, "taxable": taxable, "tax": tax,
            "total": total, "paid": paid, "balance": r2(max(total - paid, 0))}


def effective_status(doc, totals):
    """Status shown to people: invoices become partial / paid / overdue automatically."""
    if doc["doc_type"] != "invoice":
        return doc["status"]
    if doc["status"] in ("draft", "cancelled"):
        return doc["status"]
    if totals["total"] > 0 and totals["paid"] >= totals["total"]:
        return "paid"
    overdue = bool(doc["due_date"]) and doc["due_date"] < today()
    if totals["paid"] > 0:
        return "overdue" if overdue else "partial"
    return "overdue" if overdue else "sent"


def next_number(db, doc_type):
    year = date.today().year
    prefix = f"XN-{TYPE_PREFIX[doc_type]}-{year}-"
    rows = db.execute("SELECT number FROM documents WHERE number LIKE ?", (prefix + "%",)).fetchall()
    highest = data.NUMBER_START.get(doc_type, 1) - 1   # first number to be issued is NUMBER_START
    for row in rows:
        try:
            highest = max(highest, int(row["number"].rsplit("-", 1)[1]))
        except (ValueError, IndexError):
            pass
    return f"{prefix}{highest + 1:04d}"


def load_document(db, doc_id=None, token=None):
    if token is not None:
        doc = db.execute("SELECT * FROM documents WHERE token = ?", (token,)).fetchone()
    else:
        doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        return None
    doc = dict(doc)
    doc["client"] = None
    if doc["client_id"]:
        row = db.execute("SELECT * FROM clients WHERE id = ?", (doc["client_id"],)).fetchone()
        doc["client"] = dict(row) if row else None
    items = [dict(i) for i in db.execute(
        "SELECT * FROM document_items WHERE document_id = ? ORDER BY position, id", (doc["id"],)).fetchall()]
    payments = [dict(p) for p in db.execute(
        "SELECT * FROM payments WHERE document_id = ? ORDER BY paid_on, id", (doc["id"],)).fetchall()]
    totals = compute_totals(doc, items)
    return {"doc": doc, "items": items, "payments": payments, "totals": totals,
            "status": effective_status(doc, totals),
            "words": amount_in_words(totals["total"], doc["currency"])}


def recompute_paid(db, doc_id):
    paid = db.scalar("SELECT SUM(amount) AS v FROM payments WHERE document_id = ?", (doc_id,), default=0)
    db.execute("UPDATE documents SET paid_amount = ?, updated_at = ? WHERE id = ?",
               (r2(paid), now_iso(), doc_id))


def parse_items(form):
    descs = form.getlist("item_desc")
    qtys = form.getlist("item_qty")
    prices = form.getlist("item_price")
    items = []
    for i, desc in enumerate(descs):
        desc = desc.strip()
        if not desc:
            continue
        qty = num(qtys[i] if i < len(qtys) else 1, 1)
        price = num(prices[i] if i < len(prices) else 0, 0)
        items.append({"description": desc[:500], "qty": qty if qty > 0 else 1, "unit_price": max(price, 0)})
    return items


def share_links(bundle):
    doc, client = bundle["doc"], bundle["doc"]["client"]
    link = url_for("billing.public_document", token=doc["token"], _external=True)
    label = TYPE_LABEL[doc["doc_type"]].lower()
    name = client["name"] if client else "there"
    text = (f"Hello {name}, please find your {label} {doc['number']} from {data.COMPANY['name']} "
            f"({fmt_money(bundle['totals']['total'], doc['currency'])}): {link}")
    phone = phone_for_whatsapp(client["phone"]) if client else ""
    return {
        "link": link,
        "whatsapp": f"https://wa.me/{phone}?text={quote(text)}" if phone else f"https://wa.me/?text={quote(text)}",
        "email": (f"mailto:{client['email'] if client and client['email'] else ''}"
                  f"?subject={quote(f'{TYPE_LABEL[doc['doc_type']]} {doc['number']} from {data.COMPANY['name']}')}"
                  f"&body={quote(text)}"),
    }


@bp.app_template_filter("money")
def money_filter(amount, currency="PKR"):
    return fmt_money(amount, currency)


@bp.app_template_filter("pdate")
def date_filter(value):
    return fmt_date(value)


@bp.app_context_processor
def billing_context():
    labels = (("bank", "Bank"), ("account_title", "Account title"), ("account_number", "Account no."),
              ("iban", "IBAN"), ("other", "Other"))
    return {"bank_lines": [(label, data.BANK[k]) for k, label in labels if data.BANK.get(k)]}


# ------------------------------------------------------------------ clients
@bp.route("/admin/clients")
@login_required
def clients_list():
    db = get_db()
    rows = db.execute("""
        SELECT c.*, (SELECT COUNT(*) FROM documents d WHERE d.client_id = c.id) AS doc_count
        FROM clients c ORDER BY c.name""").fetchall()
    edit = None
    if request.args.get("edit", "").isdigit():
        edit = db.execute("SELECT * FROM clients WHERE id = ?", (int(request.args["edit"]),)).fetchone()
    return render_template("admin/clients.html", clients=rows, edit=edit, active="clients")


@bp.route("/admin/clients/save", methods=["POST"])
@login_required
def client_save():
    check_csrf()
    f = request.form
    name = f.get("name", "").strip()[:150]
    if len(name) < 2:
        flash("Client name is required.", "error")
        return redirect(url_for("billing.clients_list"))
    fields = (name, f.get("company", "").strip()[:150], f.get("email", "").strip()[:160],
              f.get("phone", "").strip()[:40], f.get("address", "").strip()[:400],
              f.get("notes", "").strip()[:600])
    db = get_db()
    cid = f.get("id", "")
    if cid.isdigit():
        db.execute("UPDATE clients SET name=?, company=?, email=?, phone=?, address=?, notes=? WHERE id=?",
                   fields + (int(cid),))
        flash("Client updated.", "success")
    else:
        cid = db.insert("INSERT INTO clients (name, company, email, phone, address, notes, created_at)"
                        " VALUES (?,?,?,?,?,?,?)", fields + (now_iso(),))
        flash("Client added.", "success")
    db.commit()
    nxt = f.get("next", "")
    return redirect(nxt if nxt.startswith("/admin") else url_for("billing.clients_list"))


@bp.route("/admin/clients/<int:cid>/delete", methods=["POST"])
@login_required
def client_delete(cid):
    check_csrf()
    db = get_db()
    if db.scalar("SELECT COUNT(*) AS v FROM documents WHERE client_id = ?", (cid,)):
        flash("This client has proposals or invoices, so it cannot be deleted.", "error")
    else:
        db.execute("DELETE FROM clients WHERE id = ?", (cid,))
        db.commit()
        flash("Client deleted.", "success")
    return redirect(url_for("billing.clients_list"))


# ---------------------------------------------------------------- documents
@bp.route("/admin/documents")
@login_required
def documents_list():
    db = get_db()
    doc_type = request.args.get("type", "all")
    status = request.args.get("status", "all")
    q = request.args.get("q", "").strip()
    rows = db.execute("SELECT d.id FROM documents d LEFT JOIN clients c ON c.id = d.client_id "
                      "WHERE (? = 'all' OR d.doc_type = ?) AND (? = '' OR d.number LIKE ? OR c.name LIKE ? "
                      "OR c.company LIKE ? OR d.title LIKE ?) ORDER BY d.id DESC",
                      (doc_type, doc_type, q, f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%")).fetchall()
    bundles = [load_document(db, r["id"]) for r in rows]
    if status != "all":
        bundles = [b for b in bundles if b["status"] == status]

    invoices = [load_document(db, r["id"]) for r in db.execute(
        "SELECT id FROM documents WHERE doc_type='invoice'").fetchall()]
    live = [b for b in invoices if b["status"] not in ("draft", "cancelled")]
    stats = {
        "invoiced": sum(b["totals"]["total"] for b in live),
        "paid": sum(b["totals"]["paid"] for b in live),
        "outstanding": sum(b["totals"]["balance"] for b in live),
        "overdue": sum(1 for b in live if b["status"] == "overdue"),
        "proposals_open": db.scalar("SELECT COUNT(*) AS v FROM documents WHERE doc_type='proposal' AND status='sent'"),
        "proposals_won": db.scalar("SELECT COUNT(*) AS v FROM documents WHERE doc_type='proposal' AND status='accepted'"),
    }
    return render_template("admin/documents.html", bundles=bundles, stats=stats, doc_type=doc_type,
                           status=status, q=q, active="documents")


def form_defaults(doc_type, client_id=""):
    d = data.DOC_DEFAULTS
    valid_days = 14 if doc_type == "invoice" else 30
    return {
        "id": "", "doc_type": doc_type, "number": "", "client_id": int(client_id) if str(client_id).isdigit() else None,
        "title": "", "issue_date": today(), "due_date": (date.today() + timedelta(days=valid_days)).isoformat(),
        "currency": "PKR", "discount_type": "amount", "discount_value": 0, "tax_percent": 0,
        "status": "draft", "intro": d["proposal_intro"] if doc_type == "proposal" else "",
        "scope": "", "timeline": "", "terms": d["proposal_terms"] if doc_type == "proposal" else d["invoice_terms"],
        "notes": "",
    }


def render_form(doc, items, title):
    db = get_db()
    clients = db.execute("SELECT id, name, company FROM clients ORDER BY name").fetchall()
    services = [s["title"] for _, s in data.all_services()]
    return render_template("admin/document_form.html", doc=doc, items=items or [{"description": "", "qty": 1, "unit_price": 0}],
                           clients=clients, currencies=list(CURRENCIES), services=services,
                           page_title=title, active="documents")


@bp.route("/admin/documents/new")
@login_required
def document_new():
    doc_type = request.args.get("type", "invoice")
    if doc_type not in TYPE_LABEL:
        abort(404)
    return render_form(form_defaults(doc_type, request.args.get("client", "")), [],
                       f"New {TYPE_LABEL[doc_type].lower()}")


@bp.route("/admin/documents/<int:doc_id>/edit")
@login_required
def document_edit(doc_id):
    bundle = load_document(get_db(), doc_id)
    if not bundle:
        abort(404)
    return render_form(bundle["doc"], bundle["items"], f"Edit {bundle['doc']['number']}")


@bp.route("/admin/documents/save", methods=["POST"])
@login_required
def document_save():
    check_csrf()
    f = request.form
    db = get_db()
    doc_type = f.get("doc_type", "invoice")
    if doc_type not in TYPE_LABEL:
        abort(400)
    items = parse_items(f)
    client_id = int(f["client_id"]) if f.get("client_id", "").isdigit() else None
    currency = f.get("currency", "PKR") if f.get("currency") in CURRENCIES else "PKR"
    fields = {
        "client_id": client_id, "title": f.get("title", "").strip()[:200],
        "issue_date": f.get("issue_date") or today(), "due_date": f.get("due_date") or None,
        "currency": currency,
        "discount_type": "percent" if f.get("discount_type") == "percent" else "amount",
        "discount_value": max(num(f.get("discount_value")), 0), "tax_percent": max(num(f.get("tax_percent")), 0),
        "intro": f.get("intro", "").strip()[:3000], "scope": f.get("scope", "").strip()[:6000],
        "timeline": f.get("timeline", "").strip()[:3000], "terms": f.get("terms", "").strip()[:4000],
        "notes": f.get("notes", "").strip()[:3000],
    }
    if not client_id or not items:
        flash("Please choose a client and add at least one item.", "error")
        draft = {**form_defaults(doc_type), **fields, "id": f.get("id", ""), "doc_type": doc_type,
                 "number": f.get("number", "")}
        return render_form(draft, [{**i} for i in items], "Fix and save")

    doc_id = f.get("id", "")
    if doc_id.isdigit():
        doc_id = int(doc_id)
        existing = db.execute("SELECT id FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not existing:
            abort(404)
        sets = ", ".join(f"{k} = ?" for k in fields) + ", updated_at = ?"
        db.execute(f"UPDATE documents SET {sets} WHERE id = ?", (*fields.values(), now_iso(), doc_id))
        db.execute("DELETE FROM document_items WHERE document_id = ?", (doc_id,))
        flash("Saved.", "success")
    else:
        cols = ", ".join(fields)
        marks = ", ".join("?" for _ in fields)
        doc_id = db.insert(
            f"INSERT INTO documents (doc_type, number, status, token, created_at, updated_at, {cols}) "
            f"VALUES (?,?,?,?,?,?,{marks})",
            (doc_type, next_number(db, doc_type), "draft", secrets.token_urlsafe(18), now_iso(), now_iso(),
             *fields.values()))
        flash(f"{TYPE_LABEL[doc_type]} created.", "success")
    for pos, item in enumerate(items):
        db.execute("INSERT INTO document_items (document_id, position, description, qty, unit_price) VALUES (?,?,?,?,?)",
                   (doc_id, pos, item["description"], item["qty"], item["unit_price"]))
    db.commit()
    return redirect(url_for("billing.document_view", doc_id=doc_id))


@bp.route("/admin/documents/<int:doc_id>")
@login_required
def document_view(doc_id):
    bundle = load_document(get_db(), doc_id)
    if not bundle:
        abort(404)
    return render_template("admin/document_view.html", b=bundle, share=share_links(bundle),
                           statuses=STATUSES[bundle["doc"]["doc_type"]], active="documents",
                           methods=data.PAYMENT_METHODS, today=today())


@bp.route("/admin/documents/<int:doc_id>/status", methods=["POST"])
@login_required
def document_status(doc_id):
    check_csrf()
    db = get_db()
    doc = db.execute("SELECT doc_type FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        abort(404)
    new = request.form.get("status", "")
    if new not in STATUSES[doc["doc_type"]]:
        abort(400)
    db.execute("UPDATE documents SET status = ?, updated_at = ?, accepted_at = ? WHERE id = ?",
               (new, now_iso(), now_iso() if new == "accepted" else None, doc_id))
    db.commit()
    flash(f"Marked as {new}.", "success")
    return redirect(url_for("billing.document_view", doc_id=doc_id))


def clone_document(db, bundle, new_type, source_id=None):
    doc = bundle["doc"]
    fields = {k: doc[k] for k in ("client_id", "title", "currency", "discount_type", "discount_value",
                                  "tax_percent", "intro", "scope", "timeline", "terms", "notes")}
    if new_type != doc["doc_type"]:
        fields["terms"] = data.DOC_DEFAULTS["invoice_terms"] if new_type == "invoice" else data.DOC_DEFAULTS["proposal_terms"]
        fields["intro"] = ""
    due_days = 14 if new_type == "invoice" else 30
    new_id = db.insert(
        "INSERT INTO documents (doc_type, number, client_id, title, issue_date, due_date, currency, discount_type, "
        "discount_value, tax_percent, status, intro, scope, timeline, terms, notes, token, source_id, created_at, updated_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (new_type, next_number(db, new_type), fields["client_id"], fields["title"], today(),
         (date.today() + timedelta(days=due_days)).isoformat(), fields["currency"], fields["discount_type"],
         fields["discount_value"], fields["tax_percent"], "draft", fields["intro"], fields["scope"],
         fields["timeline"], fields["terms"], fields["notes"], secrets.token_urlsafe(18), source_id,
         now_iso(), now_iso()))
    for pos, item in enumerate(bundle["items"]):
        db.execute("INSERT INTO document_items (document_id, position, description, qty, unit_price) VALUES (?,?,?,?,?)",
                   (new_id, pos, item["description"], item["qty"], item["unit_price"]))
    return new_id


@bp.route("/admin/documents/<int:doc_id>/duplicate", methods=["POST"])
@login_required
def document_duplicate(doc_id):
    check_csrf()
    db = get_db()
    bundle = load_document(db, doc_id)
    if not bundle:
        abort(404)
    new_id = clone_document(db, bundle, bundle["doc"]["doc_type"])
    db.commit()
    flash("Duplicated as a new draft.", "success")
    return redirect(url_for("billing.document_view", doc_id=new_id))


@bp.route("/admin/documents/<int:doc_id>/convert", methods=["POST"])
@login_required
def document_convert(doc_id):
    check_csrf()
    db = get_db()
    bundle = load_document(db, doc_id)
    if not bundle or bundle["doc"]["doc_type"] != "proposal":
        abort(404)
    new_id = clone_document(db, bundle, "invoice", source_id=doc_id)
    db.commit()
    flash("Invoice created from this proposal. Review it and mark it as sent.", "success")
    return redirect(url_for("billing.document_view", doc_id=new_id))


@bp.route("/admin/documents/<int:doc_id>/delete", methods=["POST"])
@login_required
def document_delete(doc_id):
    check_csrf()
    db = get_db()
    db.execute("DELETE FROM payments WHERE document_id = ?", (doc_id,))
    db.execute("DELETE FROM document_items WHERE document_id = ?", (doc_id,))
    db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    db.commit()
    flash("Deleted.", "success")
    return redirect(url_for("billing.documents_list"))


@bp.route("/admin/documents/<int:doc_id>/payment", methods=["POST"])
@login_required
def payment_add(doc_id):
    check_csrf()
    db = get_db()
    bundle = load_document(db, doc_id)
    if not bundle or bundle["doc"]["doc_type"] != "invoice":
        abort(404)
    amount = num(request.form.get("amount"))
    if amount <= 0:
        flash("Enter a payment amount greater than zero.", "error")
    else:
        db.execute("INSERT INTO payments (document_id, amount, paid_on, method, note, created_at) VALUES (?,?,?,?,?,?)",
                   (doc_id, amount, request.form.get("paid_on") or today(), request.form.get("method", "")[:40],
                    request.form.get("note", "")[:200], now_iso()))
        recompute_paid(db, doc_id)
        if bundle["doc"]["status"] == "draft":
            db.execute("UPDATE documents SET status = 'sent' WHERE id = ?", (doc_id,))
        db.commit()
        flash("Payment recorded.", "success")
    return redirect(url_for("billing.document_view", doc_id=doc_id) + "#payments")


@bp.route("/admin/payments/<int:pid>/delete", methods=["POST"])
@login_required
def payment_delete(pid):
    check_csrf()
    db = get_db()
    row = db.execute("SELECT document_id FROM payments WHERE id = ?", (pid,)).fetchone()
    if not row:
        abort(404)
    db.execute("DELETE FROM payments WHERE id = ?", (pid,))
    recompute_paid(db, row["document_id"])
    db.commit()
    flash("Payment removed.", "success")
    return redirect(url_for("billing.document_view", doc_id=row["document_id"]) + "#payments")


# ------------------------------------------------------------------- public
@bp.route("/d/<token>")
def public_document(token):
    bundle = load_document(get_db(), token=token)
    if not bundle:
        abort(404)
    return render_template("doc_public.html", b=bundle)


@bp.route("/d/<token>/accept", methods=["POST"])
def public_accept(token):
    check_csrf()
    db = get_db()
    bundle = load_document(db, token=token)
    if not bundle or bundle["doc"]["doc_type"] != "proposal":
        abort(404)
    if bundle["doc"]["status"] == "sent":
        db.execute("UPDATE documents SET status='accepted', accepted_at=?, updated_at=? WHERE id=?",
                   (now_iso(), now_iso(), bundle["doc"]["id"]))
        db.commit()
        flash("Thank you! The proposal has been accepted. We will contact you shortly.", "success")
    return redirect(url_for("billing.public_document", token=token))
