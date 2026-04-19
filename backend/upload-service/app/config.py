import os


def _bool(s: str) -> bool:
    return s.lower() in ("1", "true", "yes", "on")


KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080").rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ent-sale")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "account")
KEYCLOAK_VERIFY_AUD = _bool(os.getenv("KEYCLOAK_VERIFY_AUD", "false"))


def issuer() -> str:
    return f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"


def jwks_uri() -> str:
    return f"{issuer()}/protocol/openid-connect/certs"
