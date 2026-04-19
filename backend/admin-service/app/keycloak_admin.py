import os
from typing import Optional

import httpx
from fastapi import HTTPException

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ent-est-sale")
KEYCLOAK_ADMIN_REALM = os.getenv("KEYCLOAK_ADMIN_REALM", "master")
KEYCLOAK_ADMIN_CLIENT_ID = os.getenv("KEYCLOAK_ADMIN_CLIENT_ID", "admin-cli")
KEYCLOAK_ADMIN_CLIENT_SECRET = os.getenv("KEYCLOAK_ADMIN_CLIENT_SECRET", "")
KEYCLOAK_ADMIN = os.getenv("KEYCLOAK_ADMIN", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "admin")


def _raise_keycloak_error(response: httpx.Response, fallback_detail: str) -> None:
    detail = fallback_detail
    try:
        payload = response.json()
        if isinstance(payload, dict):
            detail = payload.get("errorMessage") or payload.get("error_description") or payload.get("detail") or detail
        elif isinstance(payload, str) and payload.strip():
            detail = payload.strip()
    except ValueError:
        body = response.text.strip()
        if body:
            detail = body

    raise HTTPException(status_code=response.status_code, detail=detail)


def _admin_headers() -> dict:
    token_url = (
        f"{KEYCLOAK_URL}/realms/{KEYCLOAK_ADMIN_REALM}/protocol/openid-connect/token"
    )
    data = {
        "grant_type": "password",
        "client_id": KEYCLOAK_ADMIN_CLIENT_ID,
        "username": KEYCLOAK_ADMIN,
        "password": KEYCLOAK_ADMIN_PASSWORD,
    }
    if KEYCLOAK_ADMIN_CLIENT_SECRET:
        data["client_secret"] = KEYCLOAK_ADMIN_CLIENT_SECRET

    try:
        response = httpx.post(token_url, data=data, timeout=10)
        response.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Keycloak admin auth failed: {exc}")

    access_token = response.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=503, detail="Keycloak admin token missing")

    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


def _admin_base_url() -> str:
    return f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}"


def _extract_role(user: dict) -> str:
    roles = user.get("realmRoles", []) or []
    for role in ["admin", "teacher", "student"]:
        if role in roles:
            return role
    return "student"


def _normalize_user(user: dict) -> dict:
    attributes = user.get("attributes") or {}
    birth_date_values = attributes.get("birth_date") or []
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user.get("email", ""),
        "first_name": user.get("firstName", ""),
        "last_name": user.get("lastName", ""),
        "birth_date": birth_date_values[0] if birth_date_values else "",
        "enabled": user.get("enabled", True),
        "role": _extract_role(user),
    }


def _get_role_representation(role_name: str) -> dict:
    url = f"{_admin_base_url()}/roles/{role_name}"
    response = httpx.get(url, headers=_admin_headers(), timeout=10)
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found in Keycloak")
    if response.is_error:
        _raise_keycloak_error(response, "Unable to retrieve Keycloak role")
    return response.json()


def _get_user_role_mappings(user_id: str) -> list[dict]:
    url = f"{_admin_base_url()}/users/{user_id}/role-mappings/realm"
    response = httpx.get(url, headers=_admin_headers(), timeout=10)
    if response.is_error:
        _raise_keycloak_error(response, "Unable to retrieve user roles from Keycloak")
    return response.json()


def list_keycloak_users() -> list[dict]:
    url = f"{_admin_base_url()}/users"
    response = httpx.get(url, headers=_admin_headers(), timeout=10)
    if response.is_error:
        _raise_keycloak_error(response, "Unable to list users from Keycloak")
    users = response.json()

    normalized_users = []
    for user in users:
        user_id = user["id"]
        realm_roles = [role["name"] for role in _get_user_role_mappings(user_id)]
        user["realmRoles"] = realm_roles
        normalized_users.append(_normalize_user(user))
    return normalized_users


def get_keycloak_user(user_id: str) -> dict:
    url = f"{_admin_base_url()}/users/{user_id}"
    response = httpx.get(url, headers=_admin_headers(), timeout=10)
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    if response.is_error:
        _raise_keycloak_error(response, "Unable to retrieve user from Keycloak")
    user = response.json()
    user["realmRoles"] = [role["name"] for role in _get_user_role_mappings(user_id)]
    return _normalize_user(user)


def create_keycloak_user(
    *,
    username: str,
    password: str,
    role: str,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    birth_date: Optional[str] = None,
) -> dict:
    url = f"{_admin_base_url()}/users"
    payload = {
        "username": username,
        "email": email or f"{username}@est-sale.ma",
        "enabled": True,
        "firstName": first_name or "",
        "lastName": last_name or "",
        "credentials": [
            {"type": "password", "value": password, "temporary": False}
        ],
        "attributes": {
            "birth_date": [birth_date.strip()] if birth_date and birth_date.strip() else []
        },
    }

    response = httpx.post(url, headers=_admin_headers(), json=payload, timeout=10)
    if response.status_code == 409:
        raise HTTPException(status_code=409, detail="Username already exists")
    if response.is_error:
        _raise_keycloak_error(response, "Unable to create user in Keycloak")

    user_lookup = httpx.get(
        f"{_admin_base_url()}/users",
        headers=_admin_headers(),
        params={"username": username, "exact": "true"},
        timeout=10,
    )
    if user_lookup.is_error:
        _raise_keycloak_error(user_lookup, "Created user could not be queried from Keycloak")
    users = user_lookup.json()
    if not users:
        raise HTTPException(status_code=500, detail="Created user could not be retrieved from Keycloak")

    user_id = users[0]["id"]
    set_user_realm_role(user_id, role)
    return get_keycloak_user(user_id)


def update_keycloak_user(
    user_id: str,
    *,
    role: str,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    birth_date: Optional[str] = None,
    enabled: bool = True,
    password: Optional[str] = None,
) -> dict:
    payload = {
        "enabled": enabled,
        "firstName": first_name or "",
        "lastName": last_name or "",
        "attributes": {
            "birth_date": [birth_date.strip()] if birth_date and birth_date.strip() else []
        },
    }
    if email and email.strip():
        payload["email"] = email.strip()

    response = httpx.put(
        f"{_admin_base_url()}/users/{user_id}",
        headers=_admin_headers(),
        json=payload,
        timeout=10,
    )
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    if response.status_code == 409:
        raise HTTPException(status_code=409, detail="Username already exists")
    if response.is_error:
        _raise_keycloak_error(response, "Unable to update user in Keycloak")

    if password:
        password_response = httpx.put(
            f"{_admin_base_url()}/users/{user_id}/reset-password",
            headers=_admin_headers(),
            json={"type": "password", "value": password, "temporary": False},
            timeout=10,
        )
        if password_response.is_error:
            _raise_keycloak_error(password_response, "Unable to reset user password in Keycloak")

    set_user_realm_role(user_id, role)
    return get_keycloak_user(user_id)


def set_user_realm_role(user_id: str, role_name: str) -> dict:
    current_roles = _get_user_role_mappings(user_id)
    if current_roles:
        remove_response = httpx.request(
            "DELETE",
            f"{_admin_base_url()}/users/{user_id}/role-mappings/realm",
            headers=_admin_headers(),
            json=current_roles,
            timeout=10,
        )
        if remove_response.is_error:
            _raise_keycloak_error(remove_response, "Unable to remove existing user roles")

    role_representation = _get_role_representation(role_name)
    assign_response = httpx.post(
        f"{_admin_base_url()}/users/{user_id}/role-mappings/realm",
        headers=_admin_headers(),
        json=[role_representation],
        timeout=10,
    )
    if assign_response.is_error:
        _raise_keycloak_error(assign_response, "Unable to assign user role")
    return get_keycloak_user(user_id)


def delete_keycloak_user(user_id: str) -> None:
    response = httpx.delete(
        f"{_admin_base_url()}/users/{user_id}",
        headers=_admin_headers(),
        timeout=10,
    )
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    if response.is_error:
        _raise_keycloak_error(response, "Unable to delete user from Keycloak")
