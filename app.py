"""
Xeon Net — website (Flask frontend + backend)
Run:  python app.py      ->  http://127.0.0.1:5000
Admin panel: /admin
"""
import os
import re
import secrets
import sqlite3
from datetime import datetime
from functools import wraps

from flask import (Flask, abort, flash, g, jsonify, redirect, render_template,
                   request, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

import data

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# On Vercel / serverless the project folder is read-only; only /tmp is writable.
if os.environ.get("DATABASE_PATH"):
    DB_PATH = os.environ["DATABASE_PATH"]
elif os.environ.get("VERCEL"):
    DB_PATH = "/tmp/xeonnet.db"
else:
    DB_PATH = os.path.join(BASE_DIR, "instance", "xeonnet.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "static"),
            template_folder=os.path.join(BASE_DIR, "templates"))
app.config.update(
    SECRET_KEY=os.environ.get("SECRET_KEY", "change-this-secret-key-in-production"),
    DATABASE=DB_PATH,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

# Admin login: set these as environment variables in production
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASSWORD_HASH = generate_password_hash(os.environ.get("ADMIN_PASSWORD", "xeonnet@2007"))

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------------------------------------------------------------- database
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(app.config["DATABASE"])
    db.executescript("""
        CREATE TABLE IF NOT EXISTS messages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            email      TEXT NOT NULL,
            phone      TEXT,
            service    TEXT,
            budget     TEXT,
            message    TEXT NOT NULL,
            ip         TEXT,
            is_read    INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reviews (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            role       TEXT,
            rating     INTEGER NOT NULL,
            text       TEXT NOT NULL,
            approved   INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS subscribers (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        );
    """)
    db.commit()
    db.close()


init_db()


# ---------------------------------------------------------------- helpers
def csrf_token():
    if "_csrf" not in session:
        session["_csrf"] = secrets.token_urlsafe(32)
    return session["_csrf"]


def check_csrf():
    token = request.form.get("_csrf", "")
    if not token or not secrets.compare_digest(token, session.get("_csrf", "")):
        abort(400, "Invalid form token. Please refresh the page and try again.")


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


@app.context_processor
def inject_globals():
    return {
        "company": data.COMPANY,
        "years": data.YEARS,
        "tiers": data.SERVICE_TIERS,
        "nav": data.NAV,
        "service_count": data.SERVICE_COUNT,
        "csrf_token": csrf_token,
        "now": datetime.now(),
    }


# ---------------------------------------------------------------- public pages
@app.route("/")
def home():
    db = get_db()
    reviews = db.execute("SELECT * FROM reviews WHERE approved=1 ORDER BY id DESC LIMIT 3").fetchall()
    return render_template("index.html", journey=data.JOURNEY, why=data.WHY_US,
                           process=data.PROCESS, tech=data.TECH, reviews=reviews,
                           portfolio=data.PORTFOLIO[:3])


@app.route("/about")
def about():
    return render_template("about.html", journey=data.JOURNEY, values=data.VALUES,
                           mission=data.MISSION, vision=data.VISION, ceo=data.TEAM[0])


@app.route("/services")
def services():
    return render_template("services.html")


@app.route("/services/<slug>")
def service_detail(slug):
    tier, service = data.find_service(slug)
    if not service:
        abort(404)
    related = [s for s in tier["services"] if s["slug"] != slug]
    return render_template("service.html", tier=tier, service=service, related=related)


@app.route("/portfolio")
def portfolio():
    return render_template("portfolio.html", items=data.PORTFOLIO,
                           categories=data.PORTFOLIO_CATEGORIES)


@app.route("/clients")
def clients():
    return render_template("clients.html", logos=data.client_logos(),
                           industries=data.CLIENT_INDUSTRIES)


@app.route("/team")
def team():
    return render_template("team.html", members=data.TEAM, departments=data.DEPARTMENTS)


@app.route("/reviews")
def reviews():
    db = get_db()
    rows = db.execute("SELECT * FROM reviews WHERE approved=1 ORDER BY id DESC").fetchall()
    avg = db.execute("SELECT AVG(rating) FROM reviews WHERE approved=1").fetchone()[0]
    return render_template("reviews.html", reviews=rows, avg=round(avg, 1) if avg else None)


@app.route("/reviews/submit", methods=["POST"])
def review_submit():
    check_csrf()
    f = request.form
    if f.get("website"):  # honeypot
        return jsonify(ok=True, message="Thank you!")
    name = f.get("name", "").strip()[:80]
    role = f.get("role", "").strip()[:100]
    text = f.get("text", "").strip()[:1200]
    try:
        rating = int(f.get("rating", "0"))
    except ValueError:
        rating = 0
    errors = []
    if len(name) < 2:
        errors.append("Please enter your name.")
    if not 1 <= rating <= 5:
        errors.append("Please choose a star rating.")
    if len(text) < 15:
        errors.append("Please write at least 15 characters.")
    if errors:
        return jsonify(ok=False, errors=errors), 422
    db = get_db()
    db.execute("INSERT INTO reviews (name, role, rating, text, created_at) VALUES (?,?,?,?,?)",
               (name, role, rating, text, datetime.now().isoformat(timespec="seconds")))
    db.commit()
    return jsonify(ok=True, message="Thank you! Your review will appear after our team approves it.")


@app.route("/contact", methods=["GET"])
def contact_page():
    return render_template("contact.html")


@app.route("/contact/send", methods=["POST"])
def contact():
    check_csrf()
    f = request.form
    # Honeypot: bots fill this hidden field
    if f.get("website"):
        return redirect(url_for("contact_page"))

    name = f.get("name", "").strip()[:120]
    email = f.get("email", "").strip()[:160]
    phone = f.get("phone", "").strip()[:40]
    service = f.get("service", "").strip()[:120]
    budget = f.get("budget", "").strip()[:60]
    message = f.get("message", "").strip()[:4000]

    errors = []
    if len(name) < 2:
        errors.append("Please enter your name.")
    if not EMAIL_RE.match(email):
        errors.append("Please enter a valid email address.")
    if len(message) < 10:
        errors.append("Your message must be at least 10 characters.")

    wants_json = request.headers.get("X-Requested-With") == "fetch"
    if errors:
        if wants_json:
            return jsonify(ok=False, errors=errors), 422
        for e in errors:
            flash(e, "error")
        return redirect(url_for("contact_page"))

    db = get_db()
    db.execute(
        "INSERT INTO messages (name, email, phone, service, budget, message, ip, created_at)"
        " VALUES (?,?,?,?,?,?,?,?)",
        (name, email, phone, service, budget, message,
         request.headers.get("X-Forwarded-For", request.remote_addr),
         datetime.now().isoformat(timespec="seconds")),
    )
    db.commit()

    ok_msg = f"Thank you, {name}! We have received your message and will contact you soon."
    if wants_json:
        return jsonify(ok=True, message=ok_msg)
    flash(ok_msg, "success")
    return redirect(url_for("contact_page"))


@app.route("/subscribe", methods=["POST"])
def subscribe():
    check_csrf()
    email = request.form.get("email", "").strip()[:160]
    if not EMAIL_RE.match(email):
        return jsonify(ok=False, errors=["Please enter a valid email address."]), 422
    db = get_db()
    db.execute("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)",
               (email, datetime.now().isoformat(timespec="seconds")))
    db.commit()
    return jsonify(ok=True, message="You are subscribed. Thank you!")


# ---------------------------------------------------------------- JSON API
@app.route("/api/services")
def api_services():
    return jsonify([
        {"tier": t["name"], "slug": s["slug"], "title": s["title"], "summary": s["short"]}
        for t, s in data.all_services()
    ])


@app.route("/health")
def health():
    return jsonify(status="ok", company=data.COMPANY["name"], since=data.COMPANY["founded"])


# ---------------------------------------------------------------- admin panel
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        check_csrf()
        user = request.form.get("username", "")
        pw = request.form.get("password", "")
        if user == ADMIN_USER and check_password_hash(ADMIN_PASSWORD_HASH, pw):
            session.clear()
            session["admin"] = True
            nxt = request.args.get("next", "")
            return redirect(nxt if nxt.startswith("/admin") else url_for("admin_dashboard"))
        flash("Incorrect username or password.", "error")
    return render_template("admin/login.html")


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))


@app.route("/admin")
@login_required
def admin_dashboard():
    db = get_db()
    show = request.args.get("show", "all")
    q = "SELECT * FROM messages"
    if show == "unread":
        q += " WHERE is_read = 0"
    msgs = db.execute(q + " ORDER BY id DESC").fetchall()
    stats = {
        "total": db.execute("SELECT COUNT(*) FROM messages").fetchone()[0],
        "unread": db.execute("SELECT COUNT(*) FROM messages WHERE is_read=0").fetchone()[0],
        "subscribers": db.execute("SELECT COUNT(*) FROM subscribers").fetchone()[0],
    }
    subs = db.execute("SELECT * FROM subscribers ORDER BY id DESC LIMIT 50").fetchall()
    revs = db.execute("SELECT * FROM reviews ORDER BY approved ASC, id DESC").fetchall()
    stats["pending_reviews"] = db.execute("SELECT COUNT(*) FROM reviews WHERE approved=0").fetchone()[0]
    return render_template("admin/dashboard.html", msgs=msgs, stats=stats, subs=subs,
                           revs=revs, show=show)


@app.route("/admin/message/<int:mid>/toggle", methods=["POST"])
@login_required
def admin_toggle(mid):
    check_csrf()
    db = get_db()
    db.execute("UPDATE messages SET is_read = 1 - is_read WHERE id = ?", (mid,))
    db.commit()
    return redirect(request.referrer or url_for("admin_dashboard"))


@app.route("/admin/message/<int:mid>/delete", methods=["POST"])
@login_required
def admin_delete(mid):
    check_csrf()
    db = get_db()
    db.execute("DELETE FROM messages WHERE id = ?", (mid,))
    db.commit()
    flash("Message deleted.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/review/<int:rid>/<action>", methods=["POST"])
@login_required
def admin_review(rid, action):
    check_csrf()
    db = get_db()
    if action == "approve":
        db.execute("UPDATE reviews SET approved=1 WHERE id=?", (rid,))
    elif action == "hide":
        db.execute("UPDATE reviews SET approved=0 WHERE id=?", (rid,))
    elif action == "delete":
        db.execute("DELETE FROM reviews WHERE id=?", (rid,))
    else:
        abort(404)
    db.commit()
    return redirect(url_for("admin_dashboard") + "#reviews")


# ---------------------------------------------------------------- errors
@app.errorhandler(404)
def not_found(_e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", host="0.0.0.0",
            port=int(os.environ.get("PORT", 5000)))
