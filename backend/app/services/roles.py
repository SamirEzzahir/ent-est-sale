from typing import Any

# Realm role names expected in Keycloak (must match exactly)
ROLE_ADMIN = "ADMIN"
ROLE_TEACHER = "TEACHER"
ROLE_STUDENT = "STUDENT"
APP_ROLES = (ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT)


def pick_app_role(payload: dict[str, Any]) -> str | None:
    """Pick a single app role from Keycloak JWT (realm_access.roles)."""
    roles = payload.get("realm_access") or {}
    if isinstance(roles, dict):
        realm_roles = roles.get("roles") or []
    else:
        realm_roles = []
    if not isinstance(realm_roles, list):
        return None
    upper = {str(r).upper() for r in realm_roles}
    for r in (ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT):
        if r in upper:
            return r
    # allow lowercase in Keycloak by mistake
    for r in APP_ROLES:
        if r.lower() in {str(x).lower() for x in realm_roles}:
            return r
    return None


def user_email(payload: dict[str, Any]) -> str:
    return str(payload.get("email") or payload.get("preferred_username") or "")


def user_id(payload: dict[str, Any]) -> str:
    return str(payload.get("sub") or "")
