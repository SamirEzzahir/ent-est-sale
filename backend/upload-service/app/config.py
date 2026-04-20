import os


def _bool(s: str) -> bool:
    return s.lower() in ("1", "true", "yes", "on")


def _default_keycloak_public_url() -> str:
    public_base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost").rstrip("/")
    keycloak_public_port = os.getenv("KEYCLOAK_PUBLIC_PORT", "8080")
    if "://" not in public_base_url:
        public_base_url = f"http://{public_base_url}"
    from urllib.parse import urlparse

    parsed = urlparse(public_base_url)
    hostname = parsed.hostname or "localhost"
    if parsed.port == int(keycloak_public_port):
        return public_base_url
    return f"{parsed.scheme or 'http'}://{hostname}:{keycloak_public_port}"


KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080").rstrip("/")
KEYCLOAK_PUBLIC_URL = (os.getenv("KEYCLOAK_PUBLIC_URL") or _default_keycloak_public_url()).rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ent-est-sale")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "account")
KEYCLOAK_VERIFY_AUD = _bool(os.getenv("KEYCLOAK_VERIFY_AUD", "false"))


def issuer() -> str:
    return f"{KEYCLOAK_PUBLIC_URL}/realms/{KEYCLOAK_REALM}"


def jwks_uri() -> str:
    return f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
