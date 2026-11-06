"""
Certificate & document verification.

Admin: /admin/certificates  — issue, edit, revoke, delete (login required)
Public: /verify             — enter a code
        /verify/<code>      — result page (what a QR code points to)
        /verify/<code>/qr.svg
"""
import io
import re
import secrets
from datetime import date, datetime

import segno
from flask import (Blueprint, Response, abort, flash, redirect, render_template,
                   request, url_for)

import data
from core import check_csrf, get_db, login_required

bp = Blueprint("verify", __name__)


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def clean_code(raw):
    return re.sub(r"[^A-Z0-9-]", "", (raw or "").upper().replace(" ", ""))[:40]


def new_code(db):
    year = date.today().year
    prefix = f"XN-CERT-{year}-"
    rows = db.execute("SELECT code FROM credentials WHERE code LIKE ?", (prefix + "%",)).fetchall()
    highest = 0
    for r in rows:
        try:
            highest = max(highest, int(r["code"].split("-")[3]))
        except (ValueError, IndexError):
            pass
    # random suffix so codes cannot be guessed by counting up
    return f"{prefix}{highest + 1:04d}-{secrets.token_hex(2).upper()}"


def find(db, code):
    return db.execute("SELECT * FROM credentials WHERE code = ?", (clean_code(code),)).fetchone()


# ------------------------------------------------------------------ public
@bp.route("/verify", methods=["GET", "POST"])
def verify_page():
    code = (request.values.get("code") or "").strip()
    if code:
        if request.method == "POST":
            check_csrf()
        return redirect(url_for("verify.verify_result", code=clean_code(code)))
    return render_template("verify.html", record=None, code="")


@bp.route("/verify/<code>")
def verify_result(code):
    record = find(get_db(), code)
    return render_template("verify.html", record=record, code=clean_code(code),
                           link=url_for("verify.verify_result", code=clean_code(code), _external=True))


@bp.route("/verify/<code>/qr.svg")
def qr(code):
    code = clean_code(code)
    link = url_for("verify.verify_result", code=code, _external=True)
    buf = io.BytesIO()
    segno.make(link, error="m").save(buf, kind="svg", scale=8, border=2, dark="#111111")
    return Response(buf.getvalue(), mimetype="image/svg+xml", headers={"Cache-Control": "public, max-age=86400"})


# ------------------------------------------------------------------- admin
@bp.route("/admin/certificates")
@login_required
def credentials_list():
    db = get_db()
    q = request.args.get("q", "").strip()
    rows = db.execute("SELECT * FROM credentials WHERE (? = '' OR holder_name LIKE ? OR code LIKE ? OR title LIKE ?) "
                      "ORDER BY id DESC", (q, f"%{q}%", f"%{q}%", f"%{q}%")).fetchall()
    edit = None
    if request.args.get("edit", "").isdigit():
        edit = db.execute("SELECT * FROM credentials WHERE id = ?", (int(request.args["edit"]),)).fetchone()
    return render_template("admin/credentials.html", rows=rows, edit=edit, q=q, types=data.CREDENTIAL_TYPES,
                           today=date.today().isoformat(), active="credentials")


@bp.route("/admin/certificates/save", methods=["POST"])
@login_required
def credential_save():
    check_csrf()
    f = request.form
    name = f.get("holder_name", "").strip()[:150]
    doc_type = f.get("doc_type", "").strip()[:80] or data.CREDENTIAL_TYPES[0]
    if len(name) < 2:
        flash("Name is required.", "error")
        return redirect(url_for("verify.credentials_list"))
    fields = (name, doc_type, f.get("title", "").strip()[:200], f.get("period", "").strip()[:120],
              f.get("issued_on") or date.today().isoformat(), f.get("note", "").strip()[:300])
    db = get_db()
    cid = f.get("id", "")
    if cid.isdigit():
        db.execute("UPDATE credentials SET holder_name=?, doc_type=?, title=?, period=?, issued_on=?, note=? WHERE id=?",
                   fields + (int(cid),))
        flash("Updated.", "success")
    else:
        db.insert("INSERT INTO credentials (code, holder_name, doc_type, title, period, issued_on, note, status, created_at) "
                  "VALUES (?,?,?,?,?,?,?,?,?)", (new_code(db),) + fields + ("valid", now_iso()))
        flash("Issued. Print the code (or the QR code) on the certificate.", "success")
    db.commit()
    return redirect(url_for("verify.credentials_list"))


@bp.route("/admin/certificates/<int:cid>/status", methods=["POST"])
@login_required
def credential_status(cid):
    check_csrf()
    db = get_db()
    row = db.execute("SELECT status FROM credentials WHERE id = ?", (cid,)).fetchone()
    if not row:
        abort(404)
    db.execute("UPDATE credentials SET status = ? WHERE id = ?", ("valid" if row["status"] == "revoked" else "revoked", cid))
    db.commit()
    return redirect(url_for("verify.credentials_list"))


@bp.route("/admin/certificates/<int:cid>/delete", methods=["POST"])
@login_required
def credential_delete(cid):
    check_csrf()
    db = get_db()
    db.execute("DELETE FROM credentials WHERE id = ?", (cid,))
    db.commit()
    flash("Deleted.", "success")
    return redirect(url_for("verify.credentials_list"))
