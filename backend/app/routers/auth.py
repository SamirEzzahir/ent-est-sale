from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.schemas import (
    AdminCreateUserRequest,
    ApproveAccountResponse,
    LoginRequest,
    LoginResponse,
    PendingAccount,
    PendingAccountsResponse,
    RefreshRequest,
    RegisterResponse,
    UserInfo,
    ValidationRequestBody,
    ValidationRequestResponse,
)
from app.services.keycloak import KeycloakError, fetch_tokens_password, fetch_tokens_refresh
from app.services.keycloak_admin import (
    approve_account,
    assign_realm_role,
    create_realm_user,
    fetch_admin_access_token,
    list_pending_accounts,
    record_validation_request,
    reject_account,
)
from app.services.jwt_validate import build_user_from_payload, decode_and_verify_access_token
from app.deps import get_current_user, require_roles

router = APIRouter()


@router.post("/admin/users", response_model=RegisterResponse)
async def admin_create_user(
    body: AdminCreateUserRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    _admin: Annotated[UserInfo, Depends(require_roles("ADMIN"))],
):
    """Create a realm user (disabled, pending validation). Only administrators may call this."""
    if not settings.registration_configured():
        raise HTTPException(
            status_code=503,
            detail="Provisioning desactive: configurez KEYCLOAK_ADMIN_CLIENT_ID et KEYCLOAK_ADMIN_CLIENT_SECRET.",
        )
    role = body.role.strip().upper()
    if role not in ("ADMIN", "TEACHER", "STUDENT"):
        raise HTTPException(status_code=400, detail="Role invalide (ADMIN, TEACHER ou STUDENT).")
    try:
        admin_token = await fetch_admin_access_token(settings)
        user_id = await create_realm_user(
            settings,
            admin_token,
            email=body.email.strip(),
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
            enabled=False,
            pending_validation=True,
            provision_source="admin-provision",
        )
        await assign_realm_role(settings, admin_token, user_id, role)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    return RegisterResponse(
        message="Compte cree. En attente de validation sur la liste des comptes.",
        user_id=user_id,
    )


@router.post("/validation-request", response_model=ValidationRequestResponse)
async def validation_request(
    body: ValidationRequestBody,
    settings: Annotated[Settings, Depends(get_settings)],
):
    """Public endpoint: user asks for their pending account to be reviewed (no account enumeration)."""
    if not settings.registration_configured():
        raise HTTPException(
            status_code=503,
            detail="Service temporairement indisponible.",
        )
    try:
        admin_token = await fetch_admin_access_token(settings)
        await record_validation_request(settings, admin_token, body.email.strip(), body.message or "")
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    return ValidationRequestResponse(
        message=(
            "Si un compte correspondant existe et est en attente, votre demande a bien ete enregistree. "
            "Un administrateur pourra valider votre acces."
        ),
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, settings: Annotated[Settings, Depends(get_settings)]):
    """Resource-owner password grant (enable in Keycloak client for dev)."""
    try:
        raw = await fetch_tokens_password(settings, body.email, body.password)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    access = raw.get("access_token")
    refresh = raw.get("refresh_token")
    if not access or not refresh:
        raise HTTPException(status_code=502, detail="Keycloak response missing tokens")

    try:
        payload = decode_and_verify_access_token(settings, access)
        uid, email, role = build_user_from_payload(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"Token valid but user role missing. Assign realm roles ADMIN/TEACHER/STUDENT: {exc!s}",
        ) from exc

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=raw.get("expires_in"),
        refresh_expires_in=raw.get("refresh_expires_in"),
        user=UserInfo(id=uid, email=email or body.email, role=role),
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_tokens(body: RefreshRequest, settings: Annotated[Settings, Depends(get_settings)]):
    try:
        raw = await fetch_tokens_refresh(settings, body.refresh_token)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    access = raw.get("access_token")
    refresh = raw.get("refresh_token") or body.refresh_token
    if not access:
        raise HTTPException(status_code=502, detail="Keycloak response missing access_token")

    try:
        payload = decode_and_verify_access_token(settings, access)
        uid, email, role = build_user_from_payload(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=raw.get("expires_in"),
        refresh_expires_in=raw.get("refresh_expires_in"),
        user=UserInfo(id=uid, email=email, role=role),
    )


@router.get("/me", response_model=UserInfo)
async def me(user: Annotated[UserInfo, Depends(get_current_user)]):
    return user


@router.get("/pending-accounts", response_model=PendingAccountsResponse)
async def pending_accounts(
    settings: Annotated[Settings, Depends(get_settings)],
    _admin: Annotated[UserInfo, Depends(require_roles("ADMIN"))],
):
    try:
        admin_token = await fetch_admin_access_token(settings)
        rows = await list_pending_accounts(settings, admin_token)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    items = [PendingAccount(**row) for row in rows]
    return PendingAccountsResponse(items=items)


@router.post("/pending-accounts/{user_id}/approve", response_model=ApproveAccountResponse)
async def approve_pending_account(
    user_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    _admin: Annotated[UserInfo, Depends(require_roles("ADMIN"))],
):
    try:
        admin_token = await fetch_admin_access_token(settings)
        await approve_account(settings, admin_token, user_id)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    return ApproveAccountResponse(message="Compte valide avec succes.", user_id=user_id)


@router.post("/pending-accounts/{user_id}/reject", response_model=ApproveAccountResponse)
async def reject_pending_account(
    user_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    _admin: Annotated[UserInfo, Depends(require_roles("ADMIN"))],
):
    try:
        admin_token = await fetch_admin_access_token(settings)
        await reject_account(settings, admin_token, user_id)
    except KeycloakError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    return ApproveAccountResponse(message="Compte refuse.", user_id=user_id)
