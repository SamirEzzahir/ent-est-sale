"""JWT validation aligned with ENT auth service (Keycloak RS256, realm roles)."""

from __future__ import annotations

import logging
import time
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient

from app.config import KEYCLOAK_AUDIENCE, KEYCLOAK_VERIFY_AUD, issuer, jwks_uri

logger = logging.getLogger(__name__)

_jwks_client: PyJWKClient | None = None
_jwks_fetched_at: float = 0.0
JWKS_CACHE_TTL = 3600

ROLE_ADMIN = "ADMIN"
ROLE_TEACHER = "TEACHER"
ROLE_STUDENT = "STUDENT"


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_fetched_at
    now = time.time()
    if _jwks_client is None or now - _jwks_fetched_at > JWKS_CACHE_TTL:
        _jwks_client = PyJWKClient(jwks_uri(), cache_keys=True, max_cached_keys=16)
        _jwks_fetched_at = now
    return _jwks_client


def _pick_app_role(payload: dict[str, Any]) -> str | None:
    ra = payload.get("realm_access") or {}
    if not isinstance(ra, dict):
        return None
    realm_roles = ra.get("roles") or []
    if not isinstance(realm_roles, list):
        return None
    upper = {str(r).upper() for r in realm_roles}
    for r in (ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT):
        if r in upper:
            return r
    return None


def _decode_token(token: str) -> dict[str, Any]:
    try:
        jwks = _get_jwks_client()
        signing_key = jwks.get_signing_key_from_jwt(token)
        options = {"verify_aud": KEYCLOAK_VERIFY_AUD and bool(KEYCLOAK_AUDIENCE)}
        decode_kw: dict[str, Any] = {
            "algorithms": ["RS256"],
            "issuer": issuer(),
            "options": options,
        }
        if KEYCLOAK_VERIFY_AUD and KEYCLOAK_AUDIENCE:
            decode_kw["audience"] = KEYCLOAK_AUDIENCE
        return jwt.decode(token, signing_key.key, **decode_kw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("JWT decode failed: %s", exc)
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc


def get_token(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return token


def get_current_user(token: str = Depends(get_token)) -> dict[str, Any]:
    payload = _decode_token(token)
    role = _pick_app_role(payload)
    if not role:
        raise HTTPException(status_code=403, detail="Token missing realm role ADMIN/TEACHER/STUDENT")
    email = str(payload.get("email") or payload.get("preferred_username") or "")
    sub = str(payload.get("sub") or "")
    return {"sub": sub, "email": email, "role": role}


def require_teacher(user: dict[str, Any] = Depends(get_current_user)) -> str:
    if user["role"] not in (ROLE_ADMIN, ROLE_TEACHER):
        raise HTTPException(status_code=403, detail="Teacher or admin role required")
    # MinIO path prefix: prefer email, else sub
    return user["email"] or user["sub"]
