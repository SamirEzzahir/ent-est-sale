"""Keycloak Admin REST API (service account) for user registration."""

from datetime import datetime, timezone
from urllib.parse import unquote

import httpx

from app.config import Settings
from app.services.keycloak import KeycloakError


async def fetch_admin_access_token(settings: Settings) -> str:
    if not settings.registration_configured():
        raise KeycloakError("Registration is not configured (admin client id/secret)", status_code=503)

    # Dev fallback first: use bootstrap admin credentials on master realm.
    if settings.keycloak_admin_username and settings.keycloak_admin_password:
        fallback_data = {
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": settings.keycloak_admin_username,
            "password": settings.keycloak_admin_password,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            fr = await client.post(
                settings.admin_token_endpoint,
                data=fallback_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        if fr.status_code == 200:
            body = fr.json()
            token = body.get("access_token")
            if token:
                return str(token)

    data = {
        "grant_type": "client_credentials",
        "client_id": settings.keycloak_admin_client_id,
        "client_secret": settings.keycloak_admin_client_secret,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            settings.token_endpoint,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code == 200:
        body = r.json()
        token = body.get("access_token")
        if token:
            return str(token)

    raise KeycloakError(r.text or "Admin client authentication failed", status_code=502)


def _user_id_from_location(location: str | None) -> str | None:
    if not location:
        return None
    # .../users/{uuid}
    part = location.rstrip("/").split("/")[-1]
    return unquote(part) if part else None


async def create_realm_user(
    settings: Settings,
    admin_token: str,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    enabled: bool = True,
    pending_validation: bool = False,
    provision_source: str = "self-register",
) -> str:
    username = email.strip().lower()
    payload: dict = {
        "username": username,
        "email": username,
        "enabled": enabled,
        "emailVerified": False,
        "credentials": [{"type": "password", "value": password, "temporary": False}],
    }
    if first_name.strip():
        payload["firstName"] = first_name.strip()
    if last_name.strip():
        payload["lastName"] = last_name.strip()
    if pending_validation:
        payload["attributes"] = {
            "ent_status": ["PENDING"],
            "ent_source": [provision_source],
        }

    url = f"{settings.admin_api_base}/users"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, json=payload, headers=headers)

    if r.status_code == 409:
        raise KeycloakError("Un compte existe deja avec cet email.", status_code=409)
    if r.status_code not in (200, 201):
        raise KeycloakError(r.text or f"Create user failed ({r.status_code})", status_code=502)

    user_id = _user_id_from_location(r.headers.get("Location"))
    if not user_id:
        # Fallback: find by email
        user_id = await find_user_id_by_email(settings, admin_token, username)
    if not user_id:
        raise KeycloakError("Utilisateur cree mais ID introuvable.", status_code=502)
    return user_id


async def find_user_id_by_email(settings: Settings, admin_token: str, email: str) -> str | None:
    url = f"{settings.admin_api_base}/users"
    params = {"email": email, "exact": "true"}
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params, headers=headers)
    if r.status_code != 200:
        return None
    users = r.json()
    if isinstance(users, list) and users:
        return str(users[0].get("id", "")) or None
    return None


async def assign_realm_role(
    settings: Settings,
    admin_token: str,
    user_id: str,
    role_name: str,
) -> None:
    role_url = f"{settings.admin_api_base}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        rr = await client.get(role_url, headers=headers)
    if rr.status_code != 200:
        raise KeycloakError(
            f"Realm role {role_name!r} introuvable. Creez-le dans Keycloak.",
            status_code=502,
        )
    role_rep = rr.json()
    map_url = f"{settings.admin_api_base}/users/{user_id}/role-mappings/realm"
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(map_url, json=[role_rep], headers={**headers, "Content-Type": "application/json"})
    if r.status_code not in (200, 204):
        raise KeycloakError(r.text or f"Assign role failed ({r.status_code})", status_code=502)


def _first_attr(user: dict, key: str) -> str:
    attrs = user.get("attributes") or {}
    if not isinstance(attrs, dict):
        return ""
    val = attrs.get(key)
    if isinstance(val, list) and val:
        return str(val[0])
    if isinstance(val, str):
        return val
    return ""


async def list_pending_accounts(settings: Settings, admin_token: str) -> list[dict]:
    url = f"{settings.admin_api_base}/users"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            url,
            params={"max": 200, "briefRepresentation": "false"},
            headers=headers,
        )
        r_disabled = await client.get(
            url,
            params={"max": 200, "briefRepresentation": "false", "enabled": "false"},
            headers=headers,
        )
    if r.status_code != 200:
        raise KeycloakError(r.text or "List pending accounts failed", status_code=502)
    if r_disabled.status_code != 200:
        raise KeycloakError(r_disabled.text or "List disabled accounts failed", status_code=502)
    users_main = r.json()
    users_disabled = r_disabled.json()
    if not isinstance(users_main, list):
        users_main = []
    if not isinstance(users_disabled, list):
        users_disabled = []
    merged: dict[str, dict] = {}
    for u in [*users_main, *users_disabled]:
        if not isinstance(u, dict):
            continue
        uid = str(u.get("id") or "")
        if not uid:
            continue
        merged[uid] = u
    users = list(merged.values())
    if not isinstance(users, list):
        return []
    pending: list[dict] = []
    for u in users:
        if not isinstance(u, dict):
            continue
        username = str(u.get("username") or "")
        email = str(u.get("email") or username or "")
        if not email or username.startswith("service-account-"):
            continue
        status = _first_attr(u, "ent_status").upper()
        enabled = bool(u.get("enabled"))
        # Primary signal: explicit ent_status attribute.
        # Fallback for realms that don't persist custom attributes: disabled user means pending.
        is_pending = status == "PENDING" or (status == "" and not enabled)
        if not is_pending:
            continue
        src = _first_attr(u, "ent_source")
        pending.append(
            {
                "id": str(u.get("id") or ""),
                "email": email,
                "first_name": str(u.get("firstName") or ""),
                "last_name": str(u.get("lastName") or ""),
                "created_at": str(u.get("createdTimestamp") or ""),
                "status": "PENDING",
                "provision_source": src,
                "validation_requested_at": _first_attr(u, "ent_validation_requested_at"),
            }
        )
    return pending


async def record_validation_request(
    settings: Settings,
    admin_token: str,
    email: str,
    message: str = "",
) -> None:
    """Attach a validation request timestamp (and optional note) to a pending account, if it exists."""
    username = email.strip().lower()
    user_id = await find_user_id_by_email(settings, admin_token, username)
    if not user_id:
        return

    get_url = f"{settings.admin_api_base}/users/{user_id}"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        gr = await client.get(get_url, headers=headers)
    if gr.status_code != 200:
        return
    user = gr.json()
    if not isinstance(user, dict):
        return

    status = _first_attr(user, "ent_status").upper()
    enabled = bool(user.get("enabled"))
    is_pending = status == "PENDING" or (status == "" and not enabled)
    if not is_pending:
        return

    attrs = user.get("attributes") or {}
    if not isinstance(attrs, dict):
        attrs = {}
    ts = datetime.now(timezone.utc).isoformat()
    attrs["ent_validation_requested_at"] = [ts]
    if message.strip():
        attrs["ent_validation_note"] = [message.strip()[:2000]]
    user["attributes"] = attrs

    async with httpx.AsyncClient(timeout=30.0) as client:
        ur = await client.put(get_url, json=user, headers=headers)
    if ur.status_code not in (200, 204):
        raise KeycloakError(ur.text or "Record validation request failed", status_code=502)


async def approve_account(settings: Settings, admin_token: str, user_id: str) -> None:
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    get_url = f"{settings.admin_api_base}/users/{user_id}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        gr = await client.get(get_url, headers=headers)
    if gr.status_code != 200:
        raise KeycloakError(gr.text or "Pending account not found", status_code=404)

    user = gr.json()
    attrs = user.get("attributes") or {}
    if not isinstance(attrs, dict):
        attrs = {}
    attrs["ent_status"] = ["APPROVED"]
    user["attributes"] = attrs
    user["enabled"] = True

    async with httpx.AsyncClient(timeout=30.0) as client:
        ur = await client.put(get_url, json=user, headers=headers)
    if ur.status_code not in (200, 204):
        raise KeycloakError(ur.text or "Approve account failed", status_code=502)


async def reject_account(settings: Settings, admin_token: str, user_id: str) -> None:
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    get_url = f"{settings.admin_api_base}/users/{user_id}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        gr = await client.get(get_url, headers=headers)
    if gr.status_code != 200:
        raise KeycloakError(gr.text or "Pending account not found", status_code=404)

    user = gr.json()
    attrs = user.get("attributes") or {}
    if not isinstance(attrs, dict):
        attrs = {}
    attrs["ent_status"] = ["REJECTED"]
    user["attributes"] = attrs
    user["enabled"] = False

    async with httpx.AsyncClient(timeout=30.0) as client:
        ur = await client.put(get_url, json=user, headers=headers)
    if ur.status_code not in (200, 204):
        raise KeycloakError(ur.text or "Reject account failed", status_code=502)
