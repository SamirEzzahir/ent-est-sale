import logging
import os

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ent-est-sale")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "ent-backend")

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    import httpx

    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
    try:
        resp = httpx.get(url, timeout=5)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        logger.info("Loaded JWKS from %s", url)
        return _jwks_cache
    except Exception as exc:
        logger.error("Failed to fetch JWKS: %s", exc)
        raise HTTPException(status_code=503, detail="Keycloak unavailable")


def _pick_role(roles: list) -> str:
    for role in ["admin", "teacher", "student"]:
        if role in roles:
            return role
    return "student"


def _decode_token(token: str) -> dict:
    jwks = _get_jwks()
    try:
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience=KEYCLOAK_CLIENT_ID)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")
    username = payload.get("preferred_username") or payload.get("sub")
    realm_roles = payload.get("realm_access", {}).get("roles", [])
    role = _pick_role(realm_roles)

    if not username:
        raise HTTPException(status_code=401, detail="Token missing username claim")
    return {"username": username, "role": role}


def get_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return token


def get_current_user(token: str = Depends(get_token)) -> dict:
    return _decode_token(token)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user
