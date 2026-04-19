import time
from typing import Any

import jwt
from jwt import PyJWKClient

from app.config import Settings
from app.services.roles import pick_app_role, user_email, user_id

_jwks_client: PyJWKClient | None = None
_jwks_fetched_at: float = 0.0
JWKS_CACHE_TTL = 3600


def _get_jwks_client(settings: Settings) -> PyJWKClient:
    global _jwks_client, _jwks_fetched_at
    now = time.time()
    if _jwks_client is None or now - _jwks_fetched_at > JWKS_CACHE_TTL:
        _jwks_client = PyJWKClient(
            settings.jwks_uri,
            cache_keys=True,
            max_cached_keys=16,
        )
        _jwks_fetched_at = now
    return _jwks_client


def decode_and_verify_access_token(settings: Settings, token: str) -> dict[str, Any]:
    jwks = _get_jwks_client(settings)
    signing_key = jwks.get_signing_key_from_jwt(token)
    options = {"verify_aud": settings.keycloak_verify_aud and bool(settings.keycloak_audience)}
    decode_kw: dict[str, Any] = {
        "algorithms": ["RS256"],
        "issuer": settings.issuer,
        "options": options,
    }
    if settings.keycloak_verify_aud and settings.keycloak_audience:
        decode_kw["audience"] = settings.keycloak_audience
    return jwt.decode(
        token,
        signing_key.key,
        **decode_kw,
    )


def build_user_from_payload(payload: dict[str, Any]) -> tuple[str, str, str]:
    role = pick_app_role(payload)
    if not role:
        raise ValueError("No application role (ADMIN, TEACHER, STUDENT) in token")
    return user_id(payload), user_email(payload), role
