from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from .permissions import modules_for

User = get_user_model()


class LoginThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def me_payload(user):
    data = {"id": user.id, "email": user.email, "name": user.display_name, "first_name": user.first_name,
            "last_name": user.last_name, "role": user.role, "phone": user.phone, "job_title": user.job_title,
            "is_client": user.is_client, "is_remote": user.is_remote, "is_student": user.is_student}
    if user.is_remote:
        w = getattr(user, "worker", None)
        data["worker"] = {"status": w.status, "position": w.position.title if w and w.position else ""} if w else None
    elif user.is_client:
        client = getattr(user, "client_profile", None)
        data["client"] = {"id": client.id, "name": client.name, "company": client.company} if client else None
    else:
        data["modules"] = modules_for(user)
    return data


def password_link(user, path="set-password"):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    tok = default_token_generator.make_token(user)
    return f"{settings.SITE_URL}/{path}?uid={uid}&token={tok}"


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    user = authenticate(request, email=request.data.get("email", ""), password=request.data.get("password", ""))
    if not user:
        return Response({"detail": "Incorrect email or password."}, status=400)
    login(request, user)
    return Response(me_payload(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({"ok": True})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    if request.method == "PATCH":
        for f in ("first_name", "last_name", "phone"):
            if f in request.data:
                setattr(u, f, str(request.data[f])[:150])
        u.save()
    return Response(me_payload(u))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    u = request.user
    if not u.check_password(request.data.get("current", "")):
        return Response({"detail": "Current password is incorrect."}, status=400)
    new = request.data.get("new", "")
    try:
        validate_password(new, u)
    except ValidationError as e:
        return Response({"detail": " ".join(e.messages)}, status=400)
    u.set_password(new)
    u.save()
    update_session_auth_hash(request, u)
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def forgot_password(request):
    from notify.providers import send_email
    email = str(request.data.get("email", "")).strip().lower()
    user = User.objects.filter(email=email, is_active=True).first()
    if user:
        link = password_link(user)
        try:
            send_email(user.email, "Reset your Xeon Net password",
                       f"Hello {user.display_name},\n\nUse this link to choose a new password (valid for 3 days):\n"
                       f"{link}\n\nIf you did not ask for this, you can ignore this email.\nXeon Net")
        except Exception:  # noqa: BLE001
            pass
    # same answer either way, so nobody can test which emails exist
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def set_password(request):
    try:
        uid = force_str(urlsafe_base64_decode(request.data.get("uid", "")))
        user = User.objects.get(pk=uid, is_active=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response({"detail": "This link is invalid or has expired."}, status=400)
    if not default_token_generator.check_token(user, request.data.get("token", "")):
        return Response({"detail": "This link is invalid or has expired."}, status=400)
    new = request.data.get("password", "")
    try:
        validate_password(new, user)
    except ValidationError as e:
        return Response({"detail": " ".join(e.messages)}, status=400)
    user.set_password(new)
    user.save()
    login(request, user)
    return Response(me_payload(user))


# ---------------------------------------------------------------- mobile app
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def app_login(request):
    from . import tokens
    user = authenticate(request, email=str(request.data.get("email", "")).strip(), password=request.data.get("password", ""))
    if not user:
        return Response({"detail": "Incorrect email or password."}, status=400)
    key = tokens.issue(user, str(request.data.get("device_name", "")), str(request.data.get("platform", "")))
    return Response({"token": key, "user": me_payload(user)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def app_logout(request):
    from . import tokens
    tok = tokens.current(request)
    if tok:
        tok.delete()
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def app_push(request):
    """The app sends its Expo push token here after the user allows notifications ('' turns them off)."""
    import re
    from . import tokens
    tok = tokens.current(request)
    if not tok:
        return Response({"detail": "Only the mobile app can register for notifications."}, status=400)
    value = str(request.data.get("push_token", "")).strip()
    if value and not re.fullmatch(r"Expo(nent)?PushToken\[[A-Za-z0-9_\-]+\]", value):
        return Response({"detail": "That is not a valid push token."}, status=400)
    tok.push_token = value
    tok.save(update_fields=["push_token"])
    return Response({"ok": True})
