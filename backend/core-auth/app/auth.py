from fastapi import Depends, Header, HTTPException

from .keycloak import validate_keycloak_token


def get_token(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return token


def get_current_user(token: str = Depends(get_token)) -> dict:
    return validate_keycloak_token(token)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user
