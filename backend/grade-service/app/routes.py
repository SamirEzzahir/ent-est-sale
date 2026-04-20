import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from .cassandra_client import get_session
from .auth_client import validate_token

router = APIRouter()


class GradeCreate(BaseModel):
    student_id: str
    course_id: str
    grade_type: str
    score: float
    max_score: float = 100.0
    label: Optional[str] = None


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    return await validate_token(token)


@router.get("/health")
async def health():
    return {"service": "grade-service", "status": "ok"}


@router.post("/")
async def create_grade(grade: GradeCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can create grades")

    session = get_session()
    session.set_keyspace('ent')
    grade_id = uuid.uuid4()
    recorded_by = current_user.get("username") or current_user.get("id")

    try:
        cql = """
        INSERT INTO grades (grade_id, student_id, course_id, grade_type, score, max_score, label, recorded_by, record_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (grade_id, grade.student_id, uuid.UUID(grade.course_id), grade.grade_type, grade.score, grade.max_score, grade.label, recorded_by, datetime.utcnow())
        )
        return {"grade_id": str(grade_id), "message": "Grade recorded"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create grade: {str(e)}")


@router.get("/my-grades")
async def my_grades(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view own grades")

    session = get_session()
    session.set_keyspace('ent')
    student_id = current_user.get("username") or current_user.get("id")

    try:
        cql = "SELECT grade_id, student_id, course_id, grade_type, score, max_score, label, recorded_by, record_date FROM grades WHERE student_id = ?"
        rows = session.execute(cql, (student_id,))

        return [
            {
                "grade_id": str(row.grade_id),
                "student_id": row.student_id,
                "course_id": str(row.course_id),
                "grade_type": row.grade_type,
                "score": row.score,
                "max_score": row.max_score,
                "label": row.label,
                "recorded_by": row.recorded_by,
                "record_date": str(row.record_date) if row.record_date else None,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get grades: {str(e)}")


@router.get("/course/{course_id}")
async def course_grades(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can view course grades")

    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT grade_id, student_id, course_id, grade_type, score, max_score, label, recorded_by, record_date FROM grades WHERE course_id = ?"
        rows = session.execute(cql, (uuid.UUID(course_id),))

        return [
            {
                "grade_id": str(row.grade_id),
                "student_id": row.student_id,
                "course_id": str(row.course_id),
                "grade_type": row.grade_type,
                "score": row.score,
                "max_score": row.max_score,
                "label": row.label,
                "recorded_by": row.recorded_by,
                "record_date": str(row.record_date) if row.record_date else None,
            }
            for row in rows
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course grades: {str(e)}")


@router.delete("/{grade_id}")
async def delete_grade(grade_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete grades")

    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "DELETE FROM grades WHERE grade_id = ?"
        session.execute(cql, (uuid.UUID(grade_id),))
        return {"message": "Grade deleted"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid grade_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete grade: {str(e)}")
