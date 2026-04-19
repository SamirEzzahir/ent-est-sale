import httpx

from app.config import Settings


class KeycloakError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def fetch_tokens_password(
    settings: Settings,
    username: str,
    password: str,
) -> dict:
    data = {
        "grant_type": "password",
        "client_id": settings.keycloak_client_id,
        "username": username,
        "password": password,
    }
    if settings.keycloak_client_secret:
        data["client_secret"] = settings.keycloak_client_secret

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            settings.token_endpoint,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code != 200:
        raise KeycloakError(r.text or "Keycloak authentication failed", status_code=401)
    return r.json()


async def fetch_tokens_refresh(settings: Settings, refresh_token: str) -> dict:
    data = {
        "grant_type": "refresh_token",
        "client_id": settings.keycloak_client_id,
        "refresh_token": refresh_token,
    }
    if settings.keycloak_client_secret:
        data["client_secret"] = settings.keycloak_client_secret

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            settings.token_endpoint,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code != 200:
        raise KeycloakError(r.text or "Refresh token invalid or expired", status_code=401)
    return r.json()
