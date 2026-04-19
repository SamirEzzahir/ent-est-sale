from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.schemas import UserInfo
from app.services.jwt_validate import build_user_from_payload, decode_and_verify_access_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    settings: Annotated[Settings, Depends(get_settings)],
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> UserInfo:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_and_verify_access_token(settings, credentials.credentials)
        uid, email, role = build_user_from_payload(payload)
        return UserInfo(id=uid, email=email, role=role)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc!s}") from exc


def require_roles(*roles: str):
    async def _dep(user: UserInfo = Depends(get_current_user)) -> UserInfo:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return _dep
