from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "ent-sale"
    keycloak_client_id: str = "ent-frontend"
    keycloak_client_secret: str = ""
    keycloak_audience: str = "account"
    # Set false if your Keycloak access token has no aud claim matching KEYCLOAK_AUDIENCE
    keycloak_verify_aud: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Service account for Keycloak Admin API (admin provisioning + validation requests). Leave empty to disable those routes.
    keycloak_admin_client_id: str = ""
    keycloak_admin_client_secret: str = ""
    # Dev fallback: use Keycloak bootstrap admin on master realm when service-account permissions are missing.
    keycloak_admin_username: str = ""
    keycloak_admin_password: str = ""
    keycloak_admin_realm: str = "master"
    # Realm role assigned to new accounts (must exist in Keycloak)
    default_register_role: str = "STUDENT"  # env: DEFAULT_REGISTER_ROLE

    @property
    def issuer(self) -> str:
        return f"{self.keycloak_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def token_endpoint(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/token"

    @property
    def jwks_uri(self) -> str:
        return f"{self.issuer}/protocol/openid-connect/certs"

    @property
    def admin_api_base(self) -> str:
        return f"{self.keycloak_url.rstrip('/')}/admin/realms/{self.keycloak_realm}"

    @property
    def admin_token_endpoint(self) -> str:
        return f"{self.keycloak_url.rstrip('/')}/realms/{self.keycloak_admin_realm}/protocol/openid-connect/token"

    def registration_configured(self) -> bool:
        return bool(self.keycloak_admin_client_id and self.keycloak_admin_client_secret)

    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
