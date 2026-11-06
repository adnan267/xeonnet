"""
Xeon Net backend settings.

Everything that differs between your computer and the live server comes from
environment variables (see .env.example). Nothing secret is stored in code.
"""
import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name, default=""):
    return os.environ.get(name, default)


def env_bool(name, default=False):
    return env(name, "1" if default else "0").lower() in ("1", "true", "yes", "on")


def env_list(name, default=""):
    return [x.strip() for x in env(name, default).split(",") if x.strip()]


DEBUG = env_bool("DEBUG", False)
SECRET_KEY = env("SECRET_KEY") or ("dev-only-insecure-key" if DEBUG or not env("VERCEL") else "")
if not SECRET_KEY:
    raise RuntimeError("Set the SECRET_KEY environment variable.")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,.vercel.app,.xeonnet.site")
# Public address of the website (Next.js). Used in emails and links.
SITE_URL = env("SITE_URL", "http://localhost:3000").rstrip("/")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", SITE_URL + ",https://xeonnet.site,https://www.xeonnet.site")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "accounts",
    "office",
    "notify",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "xeon.urls"
WSGI_APPLICATION = "xeon.wsgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# Database: PostgreSQL when DATABASE_URL is set (Neon / Supabase), SQLite otherwise.
DATABASES = {
    "default": dj_database_url.parse(env("DATABASE_URL"), conn_max_age=0, ssl_require=False)
    if env("DATABASE_URL") else {"ENGINE": "django.db.backends.sqlite3",
                                 # Vercel can only write to /tmp (temporary!) — set DATABASE_URL for real data
                                 "NAME": "/tmp/xeonnet.sqlite3" if env("VERCEL") else BASE_DIR / "db.sqlite3"}
}
if DATABASES["default"]["ENGINE"].endswith("postgresql"):
    # pooled connection strings (pgbouncer) do not support server-side prepared statements
    DATABASES["default"].setdefault("OPTIONS", {})["prepare_threshold"] = None
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["accounts.backends.EmailBackend"]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]

LANGUAGE_CODE = "en-gb"
TIME_ZONE = env("TIME_ZONE", "Asia/Karachi")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
WHITENOISE_USE_FINDERS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.SessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PAGINATION_CLASS": None,
    "DEFAULT_THROTTLE_RATES": {"public": "20/hour", "login": "10/min"},
}

SECURE = SITE_URL.startswith("https://")
SESSION_COOKIE_SECURE = SECURE
CSRF_COOKIE_SECURE = SECURE
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if SECURE:
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# ---- notifications -------------------------------------------------------
EMAIL_PROVIDER = env("EMAIL_PROVIDER", "console")        # resend | smtp | console
RESEND_API_KEY = env("RESEND_API_KEY")
EMAIL_FROM = env("EMAIL_FROM", "Xeon Net <info@xeonnet.site>")
EMAIL_REPLY_TO = env("EMAIL_REPLY_TO", "info@xeonnet.site")
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_BACKEND = ("django.core.mail.backends.smtp.EmailBackend" if EMAIL_PROVIDER == "smtp"
                 else "django.core.mail.backends.console.EmailBackend")

SMS_PROVIDER = env("SMS_PROVIDER", "console")            # twilio | http | console
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN")
TWILIO_FROM = env("TWILIO_FROM")
# Generic HTTP SMS gateway (most Pakistani providers). {to} and {message} are replaced.
SMS_HTTP_URL = env("SMS_HTTP_URL")
SMS_HTTP_METHOD = env("SMS_HTTP_METHOD", "GET")
SMS_HTTP_BODY = env("SMS_HTTP_BODY")                     # optional, for POST: e.g. {"to":"{to}","text":"{message}"}
SMS_DEFAULT_COUNTRY = env("SMS_DEFAULT_COUNTRY", "PK")

CRON_SECRET = env("CRON_SECRET")

LOGGING = {
    "version": 1,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
