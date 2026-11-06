"""Vercel entry point for the Django backend."""
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xeon.settings")

try:
    from xeon.wsgi import app  # noqa: F401
except Exception:  # noqa: BLE001  — show why start-up failed instead of a blank 500
    _error = traceback.format_exc()
    _pw = ""
    try:
        from urllib.parse import urlparse
        _pw = urlparse(os.environ.get("DATABASE_URL", "")).password or ""
    except Exception:  # noqa: BLE001
        pass
    if _pw:
        _error = _error.replace(_pw, "***")
    print(_error, file=sys.stderr)

    def app(environ, start_response):  # minimal WSGI app
        body = ("Xeon Net backend could not start.\n\n" + _error[-3000:]).encode()
        start_response("500 Internal Server Error", [("Content-Type", "text/plain; charset=utf-8"),
                                                     ("Content-Length", str(len(body)))])
        return [body]
