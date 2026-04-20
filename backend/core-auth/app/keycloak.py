import logging
import os
from urllib.parse import quote
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException
from jose import JWTError, jwt

logger = logging.getLogger(__name__)


def _default_keycloak_public_url() -> str:
    public_base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost").rstrip("/")
    keycloak_public_port = os.getenv("KEYCLOAK_PUBLIC_PORT", "8080")
    parsed = urlparse(public_base_url)
    hostname = parsed.hostname or "localhost"
    if parsed.port == int(keycloak_public_port):
        return public_base_url
    return f"{parsed.scheme or 'http'}://{hostname}:{keycloak_public_port}"


KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_PUBLIC_URL = os.getenv("KEYCLOAK_PUBLIC_URL") or _default_keycloak_public_url()
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ent-est-sale")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "ent-backend")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "")

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    jwks_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
    try:
        resp = httpx.get(jwks_url, timeout=5)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        logger.info("Loaded Keycloak JWKS from %s", jwks_url)
        return _jwks_cache
    except Exception as exc:
        logger.error("Failed to fetch Keycloak JWKS: %s", exc)
        raise HTTPException(status_code=503, detail="Keycloak unavailable")


def _pick_role(roles: list) -> str:
    for role in ["admin", "teacher", "student"]:
        if role in roles:
            return role
    return "student"


def validate_keycloak_token(token: str) -> dict:
    jwks = _get_jwks()
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID,
            options={"verify_exp": True},
        )
    except JWTError as exc:
        logger.warning("Keycloak token validation failed: %s", exc)
        raise HTTPException(status_code=401, detail=f"Invalid Keycloak token: {exc}")

    sub = payload.get("sub", "")
    username = payload.get("preferred_username") or payload.get("sub")
    email = payload.get("email", "")
    realm_roles = payload.get("realm_access", {}).get("roles", [])
    role = _pick_role(realm_roles)

    return {"id": sub, "username": username, "role": role, "email": email}


def get_keycloak_login_url(redirect_uri: str) -> str:
    return (
        f"{KEYCLOAK_PUBLIC_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth"
        f"?client_id={KEYCLOAK_CLIENT_ID}"
        f"&response_type=code"
        f"&scope=openid profile email"
        f"&redirect_uri={quote(redirect_uri, safe='')}"
    )


def exchange_code_for_token(code: str, redirect_uri: str) -> dict:
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": KEYCLOAK_CLIENT_ID,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    if KEYCLOAK_CLIENT_SECRET:
        data["client_secret"] = KEYCLOAK_CLIENT_SECRET

    try:
        resp = httpx.post(token_url, data=data, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Token exchange failed: %s", exc.response.text)
        raise HTTPException(status_code=401, detail="Token exchange failed")


def exchange_password_for_token(username: str, password: str) -> dict:
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id": KEYCLOAK_CLIENT_ID,
        "username": username,
        "password": password,
    }
    if KEYCLOAK_CLIENT_SECRET:
        data["client_secret"] = KEYCLOAK_CLIENT_SECRET

    try:
        resp = httpx.post(token_url, data=data, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Password grant failed: %s", exc.response.text)
        raise HTTPException(status_code=401, detail="Invalid username/email or password")


def refresh_keycloak_token(refresh_token: str) -> dict:
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        "grant_type": "refresh_token",
        "client_id": KEYCLOAK_CLIENT_ID,
        "refresh_token": refresh_token,
    }
    if KEYCLOAK_CLIENT_SECRET:
        data["client_secret"] = KEYCLOAK_CLIENT_SECRET

    try:
        resp = httpx.post(token_url, data=data, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Refresh grant failed: %s", exc.response.text)
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")


def get_keycloak_logout_url(post_logout_redirect_uri: str) -> str:
    logout_url = (
        f"{KEYCLOAK_PUBLIC_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/logout"
        f"?client_id={KEYCLOAK_CLIENT_ID}"
        f"&post_logout_redirect_uri={quote(post_logout_redirect_uri, safe='')}"
    )
    if KEYCLOAK_CLIENT_SECRET:
        logout_url += f"&client_secret={quote(KEYCLOAK_CLIENT_SECRET, safe='')}"
    return logout_url
