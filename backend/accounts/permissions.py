"""
Who can do what in the staff panel.

Each module lists the roles that can READ it and the roles that can WRITE it.
Admin can do everything.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission
from .models import NON_STAFF_ROLES

MODULES = {
    #  module         read roles                                  write roles
    "dashboard":    ({"sales", "accounts", "hr", "staff"},       set()),
    "clients":      ({"sales", "accounts"},                      {"sales"}),
    "documents":    ({"sales", "accounts"},                      {"sales"}),
    "payments":     ({"sales", "accounts"},                      {"accounts"}),
    "certificates": ({"hr"},                                     {"hr"}),
    "projects":     ({"sales", "staff", "hr", "accounts"},       {"sales"}),
    "tasks":        ({"sales", "staff", "hr", "accounts"},       {"sales", "staff"}),
    "inbox":        ({"sales"},                                  {"sales"}),
    "team":         ({"hr"},                                     set()),
    "settings":     (set(),                                      set()),
    "notifications": ({"accounts", "sales"},                     set()),
    "remote":       ({"hr", "accounts", "sales"},                {"hr"}),        # remote jobs, tasks, reviews
    "payouts":      ({"hr", "accounts"},                         {"accounts"}),  # coin withdrawals
    "learning":     ({"hr", "accounts", "sales"},                {"hr"}),        # courses, lessons, tests, students
    "fees":         ({"accounts", "hr", "sales"},                {"accounts"}),  # course fee payments
}


def can(user, module, write=False):
    if not user or not user.is_authenticated or not user.is_active:
        return False
    if user.role in NON_STAFF_ROLES:
        return False
    if user.is_superuser or user.role == "admin":
        return True
    read, wr = MODULES.get(module, (set(), set()))
    return user.role in (wr if write else read | wr)


def modules_for(user):
    return {m: {"read": can(user, m), "write": can(user, m, True)} for m in MODULES}


class Module(BasePermission):
    """Use as permission_classes = [Module.of("clients")]."""

    module = None

    @classmethod
    def of(cls, module):
        return type(f"Module_{module}", (cls,), {"module": module})

    def has_permission(self, request, view):
        write = request.method not in SAFE_METHODS
        return can(request.user, self.module, write)


class IsClient(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.role == "client")


class IsStaffMember(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.role not in NON_STAFF_ROLES)


class IsRemoteWorker(BasePermission):
    message = "This area is for Xeon Net remote workers."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.role == "remote" and hasattr(u, "worker"))


class IsStudent(BasePermission):
    message = "This area is for Xeon Net students."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.role == "student")
