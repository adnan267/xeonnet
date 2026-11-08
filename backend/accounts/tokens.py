"""Bearer-token login for the mobile app. Tokens look like  xn_<random>  and only their SHA-256 is stored."""
import hashlib
import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .models import AppToken


def _hash(key):
    return hashlib.sha256(key.encode()).hexdigest()


def issue(user, device_name="", platform=""):
    key = "xn_" + secrets.token_urlsafe(32)
    AppToken.objects.create(user=user, key_hash=_hash(key), device_name=device_name[:120], platform=platform[:20])
    return key


def current(request):
    return getattr(request, "_app_token", None)


class AppTokenAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request):
        parts = get_authorization_header(request).split()
        if len(parts) != 2 or parts[0].lower() != self.keyword:
            return None
        key = parts[1].decode(errors="ignore")
        tok = AppToken.objects.select_related("user").filter(key_hash=_hash(key)).first()
        if not tok or not tok.user.is_active:
            raise AuthenticationFailed("Your session has ended. Please log in again.")
        if timezone.now() - tok.last_seen > timedelta(minutes=10):
            AppToken.objects.filter(pk=tok.pk).update(last_seen=timezone.now())
        request._request._app_token = tok
        return tok.user, tok

    def authenticate_header(self, request):
        return "Bearer"
