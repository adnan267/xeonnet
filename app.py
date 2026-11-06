"""
Xeon Net — website (Flask frontend + backend)
Run:  python app.py      ->  http://127.0.0.1:5000
Admin panel: /admin
"""
import os
from datetime import datetime

from flask import (Flask, abort, flash, jsonify, redirect, render_template,
                   request, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

import data
import db as dbmod
from billing import bp as billing_bp
from core import EMAIL_RE, check_csrf, close_db, csrf_token, get_db, login_required

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, "static"),
            template_folder=os.path.join(BASE_DIR, "templates"))
app.config.update(
    SECRET_KEY=os.environ.get("SECRET_KEY", "change-this-secret-key-in-production"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)
app.teardown_appcontext(close_db)
app.register_blueprint(billing_bp)

# Admin login: set these as environment variables in production
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASSWORD_HASH = generate_password_hash(os.environ.get("ADMIN_PASSWORD", "xeonnet@2007"))


@app.context_processor
def inject_globals():
    return {
        "company": data.COMPANY,
        "years": data.YEARS,
        "tiers": data.SERVICE_TIERS,
        "nav": data.NAV,
        "service_art": data.service_art,
        "project_cover": data.project_cover,
        "faqs": data.FAQS,
        "service_count": data.SERVICE_COUNT,
        "csrf_token": csrf_token,
        "now": datetime.now(),
        "temp_storage": dbmod.is_temporary_storage(),
    }


# ---------------------------------------------------------------- public pages
@app.route("/")
def home():
    db = get_db()
    reviews = db.execute("SELECT * FROM reviews WHERE approved=1 ORDER BY id DESC LIMIT 3").fetchall()
    return render_template("index.html", journey=data.JOURNEY, why=data.WHY_US,
                           process=data.PROCESS, tech=data.TECH, reviews=reviews,
                           portfolio=data.PORTFOLIO[:3], brands=data.BRANDS)


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
    return render_template("service.html", tier=tier, service=service, related=related,
                           process=data.PROCESS_DETAIL)


@app.route("/portfolio")
def portfolio():
    return render_template("portfolio.html", items=data.PORTFOLIO,
                           categories=data.PORTFOLIO_CATEGORIES)


@app.route("/portfolio/<slug>")
def project_detail(slug):
    project, nxt = data.find_project(slug)
    if not project:
        abort(404)
    return render_template("project.html", p=project, nxt=nxt)


@app.route("/brands")
def brands():
    return render_template("brands.html", brands=data.BRANDS)


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
    avg = db.scalar("SELECT AVG(rating) AS v FROM reviews WHERE approved=1", default=None)
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
    db.execute("INSERT INTO subscribers (email, created_at) VALUES (?, ?) ON CONFLICT (email) DO NOTHING",
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
        "total": db.scalar("SELECT COUNT(*) AS v FROM messages"),
        "unread": db.scalar("SELECT COUNT(*) AS v FROM messages WHERE is_read=0"),
        "subscribers": db.scalar("SELECT COUNT(*) AS v FROM subscribers"),
    }
    subs = db.execute("SELECT * FROM subscribers ORDER BY id DESC LIMIT 50").fetchall()
    revs = db.execute("SELECT * FROM reviews ORDER BY approved ASC, id DESC").fetchall()
    stats["pending_reviews"] = db.scalar("SELECT COUNT(*) AS v FROM reviews WHERE approved=0")
    return render_template("admin/dashboard.html", msgs=msgs, stats=stats, subs=subs,
                           revs=revs, show=show, active="inbox")


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
