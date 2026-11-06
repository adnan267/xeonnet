"""Vercel entry point for the Django backend."""
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xeon.settings")

_START_ERROR = ""
try:
    from xeon.wsgi import application as _django_app
except Exception:  # noqa: BLE001  — show why start-up failed instead of a blank 500
    _django_app = None
    _START_ERROR = traceback.format_exc()
    try:
        from urllib.parse import urlparse
        _pw = urlparse(os.environ.get("DATABASE_URL", "")).password or ""
        if _pw:
            _START_ERROR = _START_ERROR.replace(_pw, "***")
    except Exception:  # noqa: BLE001
        pass
    print(_START_ERROR, file=sys.stderr)


def _error_app(environ, start_response):
    body = ("Xeon Net backend could not start.\n\n" + _START_ERROR[-3000:]).encode()
    start_response("500 Internal Server Error", [("Content-Type", "text/plain; charset=utf-8"),
                                                 ("Content-Length", str(len(body)))])
    return [body]


app = _django_app if _django_app is not None else _error_app
