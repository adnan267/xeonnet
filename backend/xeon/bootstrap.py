"""
Runs once when the server starts (Vercel has no terminal to run commands):
  * applies database migrations when AUTO_MIGRATE=1
  * creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if no admin exists yet
"""
import logging
import os

log = logging.getLogger("bootstrap")
ERRORS = []   # shown (without passwords) on /api/health


def _remember(where, e):
    msg = f"{where}: {type(e).__name__}: {e}"
    pw = ""
    try:
        from urllib.parse import urlparse
        pw = urlparse(os.environ.get("DATABASE_URL", "")).password or ""
    except Exception:  # noqa: BLE001
        pass
    if pw:
        msg = msg.replace(pw, "***")
    ERRORS.append(msg[:500])
    log.error(msg)


def run():
    from django.conf import settings
    from django.core.management import call_command
    from django.db import connection

    if os.environ.get("AUTO_MIGRATE", "0") == "1":
        try:
            if connection.vendor == "postgresql":
                with connection.cursor() as c:
                    c.execute("SELECT pg_advisory_lock(7007007)")   # only one server migrates at a time
            call_command("migrate", interactive=False, verbosity=0)
        except Exception as e:  # noqa: BLE001
            _remember("migrate", e)
        finally:
            if connection.vendor == "postgresql":
                try:
                    with connection.cursor() as c:
                        c.execute("SELECT pg_advisory_unlock(7007007)")
                except Exception:  # noqa: BLE001
                    pass

    email, password = os.environ.get("ADMIN_EMAIL", ""), os.environ.get("ADMIN_PASSWORD", "")
    if email and password:
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(is_superuser=True).exists():
                User.objects.create_superuser(email=email, password=password, first_name="Muhammad",
                                              last_name="Adnan", job_title="CEO")
                log.info("created first admin %s", email)
        except Exception as e:  # noqa: BLE001
            _remember("admin", e)
    _ = settings
