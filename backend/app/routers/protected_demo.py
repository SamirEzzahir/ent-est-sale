from typing import Annotated

from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.schemas import UserInfo
from app.services.roles import ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER

router = APIRouter()


@router.get("/admin")
async def admin_area(user: Annotated[UserInfo, Depends(require_roles(ROLE_ADMIN))]):
    return {"scope": "admin", "user": user.model_dump()}


@router.get("/teacher")
async def teacher_area(user: Annotated[UserInfo, Depends(require_roles(ROLE_TEACHER))]):
    return {"scope": "teacher", "user": user.model_dump()}


@router.get("/student")
async def student_area(user: Annotated[UserInfo, Depends(require_roles(ROLE_STUDENT))]):
    return {"scope": "student", "user": user.model_dump()}
