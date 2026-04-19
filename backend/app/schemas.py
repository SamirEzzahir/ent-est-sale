from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class UserInfo(BaseModel):
    id: str
    email: str
    role: str  # ADMIN | TEACHER | STUDENT


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    refresh_expires_in: int | None = None
    user: UserInfo


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(default="", max_length=80)
    last_name: str = Field(default="", max_length=80)


class AdminCreateUserRequest(BaseModel):
    """Provisioned by an administrator; account stays disabled until approved on the pending list."""

    email: str = Field(min_length=3)
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(default="", max_length=80)
    last_name: str = Field(default="", max_length=80)
    role: str = Field(default="STUDENT", max_length=32)


class RegisterResponse(BaseModel):
    message: str
    user_id: str


class ValidationRequestBody(BaseModel):
    email: str = Field(min_length=3)
    message: str = Field(default="", max_length=2000)


class ValidationRequestResponse(BaseModel):
    message: str


class PendingAccount(BaseModel):
    id: str
    email: str
    first_name: str = ""
    last_name: str = ""
    created_at: str = ""
    status: str = "PENDING"
    provision_source: str = ""
    validation_requested_at: str = ""


class PendingAccountsResponse(BaseModel):
    items: list[PendingAccount]


class ApproveAccountResponse(BaseModel):
    message: str
    user_id: str
