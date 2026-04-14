import os
import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from .auth import get_current_user, get_token
from .keycloak import (
    exchange_code_for_token,
    get_keycloak_login_url,
    get_keycloak_logout_url,
    validate_keycloak_token,
)

logger = logging.getLogger(__name__)
router = APIRouter()

USE_KEYCLOAK = bool(os.getenv("KEYCLOAK_URL"))


@router.post("/token/validate")
def validate_token(token: str = Depends(get_token)):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")
    user = validate_keycloak_token(token)
    return {"valid": True, **user}


@router.get("/login/keycloak")
def keycloak_login_url(redirect_uri: str = Query(..., description="Frontend callback URL")):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")
    return {"login_url": get_keycloak_login_url(redirect_uri)}


@router.get("/callback")
def keycloak_callback(
    code: str = Query(...),
    redirect_uri: str = Query(...),
):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")

    tokens = exchange_code_for_token(code, redirect_uri)
    access_token = tokens.get("access_token")
    user = validate_keycloak_token(access_token)

    logger.info("[Keycloak] User %s authenticated with role %s", user["username"], user["role"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "email": user.get("email", ""),
    }


@router.get("/logout/keycloak")
def keycloak_logout_url(
    post_logout_redirect_uri: str = Query(..., description="Frontend URL after logout"),
):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")
    return {"logout_url": get_keycloak_logout_url(post_logout_redirect_uri)}


@router.get("/me")
def get_me(token: str = Depends(get_token)):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")
    return get_current_user(token)


@router.get("/roles")
def get_roles(token: str = Depends(get_token)):
    if not USE_KEYCLOAK:
        raise HTTPException(status_code=503, detail="Keycloak integration is required")
    user = get_current_user(token)
    return {"username": user["username"], "roles": [user["role"]]}
