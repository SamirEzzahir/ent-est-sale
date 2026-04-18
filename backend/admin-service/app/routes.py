from typing import Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr

from .auth import require_admin
from .keycloak_admin import (
    create_keycloak_user,
    delete_keycloak_user,
    get_keycloak_user,
    list_keycloak_users,
    set_user_realm_role,
    update_keycloak_user,
)

logger = logging.getLogger(__name__)
router = APIRouter()

AVAILABLE_ROLES = ["admin", "teacher", "student"]


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str


class UpdateUserRequest(BaseModel):
    username: str
    role: str
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    enabled: bool = True
    password: Optional[str] = None


def _validate_username(username: str) -> str:
    cleaned = username.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if any(char.isspace() for char in cleaned):
        raise HTTPException(status_code=400, detail="Username cannot contain spaces")
    return cleaned


@router.get("/users")
def list_users(admin: dict = Depends(require_admin)):
    users = list_keycloak_users()
    logger.info("Admin %s listed users", admin["username"])
    return users


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(body: CreateUserRequest, admin: dict = Depends(require_admin)):
    if body.role not in AVAILABLE_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {AVAILABLE_ROLES}")
    username = _validate_username(body.username)

    user = create_keycloak_user(
        username=username,
        password=body.password,
        role=body.role,
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    logger.info("Admin %s created user %s with role %s", admin["username"], username, body.role)
    return user


@router.get("/users/{user_id}")
def get_user(user_id: str, admin: dict = Depends(require_admin)):
    user = get_keycloak_user(user_id)
    logger.info("Admin %s retrieved user %s", admin["username"], user_id)
    return user


@router.patch("/users/{user_id}/roles")
def update_role(user_id: str, body: UpdateRoleRequest, admin: dict = Depends(require_admin)):
    if body.role not in AVAILABLE_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {AVAILABLE_ROLES}")

    user = set_user_realm_role(user_id, body.role)
    logger.info("Admin %s changed user %s role to %s", admin["username"], user_id, body.role)
    return user


@router.patch("/users/{user_id}")
def update_user(user_id: str, body: UpdateUserRequest, admin: dict = Depends(require_admin)):
    if body.role not in AVAILABLE_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {AVAILABLE_ROLES}")
    username = _validate_username(body.username)

    target_user = get_keycloak_user(user_id)
    if target_user["username"] == admin["username"] and not body.enabled:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    user = update_keycloak_user(
        user_id,
        username=username,
        role=body.role,
        email=body.email,
        first_name=(body.first_name or "").strip(),
        last_name=(body.last_name or "").strip(),
        enabled=body.enabled,
        password=(body.password or "").strip() or None,
    )
    logger.info("Admin %s updated user %s", admin["username"], user_id)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    target_user = get_keycloak_user(user_id)
    if target_user["username"] == admin["username"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    delete_keycloak_user(user_id)
    logger.info("Admin %s deleted user %s", admin["username"], target_user["username"])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/roles")
def list_roles(admin: dict = Depends(require_admin)):
    return {"roles": AVAILABLE_ROLES}
