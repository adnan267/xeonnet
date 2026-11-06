"""Shared helpers: database access, CSRF protection, admin login guard."""
import re
import secrets
from functools import wraps

from flask import abort, g, redirect, request, session, url_for

import db as dbmod

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_db():
    if "db" not in g:
        g.db = dbmod.Database()
        dbmod.init_schema(g.db)
    return g.db


def close_db(_exc=None):
    database = g.pop("db", None)
    if database is not None:
        database.close()


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
