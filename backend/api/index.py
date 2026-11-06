"""Vercel entry point for the Django backend."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xeon.settings")

from xeon.wsgi import app  # noqa: E402,F401
