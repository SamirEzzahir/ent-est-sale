import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from .cassandra_client import get_session
from .auth_client import validate_token

router = APIRouter()


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    description: Optional[str] = None
    semester: int
    academic_year: str
    credits: int = 3


class CourseUpdate(BaseModel):
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    description: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    credits: Optional[int] = None


class EnrollRequest(BaseModel):
    student_id: str


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    return await validate_token(token)


@router.get("/health")
async def health():
    return {"service": "course-service", "status": "ok"}


@router.post("/")
async def create_course(course: CourseCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can create courses")

    session = get_session()
    course_id = uuid.uuid4()
    teacher_id = current_user.get("username") or current_user.get("id")
    teacher_name = current_user.get("preferred_username") or teacher_id

    cql = """
    INSERT INTO courses (course_id, course_code, course_name, description, teacher_id, teacher_name, semester, academic_year, credits, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    try:
        session.execute(
            cql,
            (course_id, course.course_code, course.course_name, course.description, teacher_id, teacher_name, course.semester, course.academic_year, course.credits, datetime.utcnow())
        )
        return {"course_id": str(course_id), "message": "Course created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create course: {str(e)}")


@router.get("/")
async def list_courses(current_user: dict = Depends(get_current_user)):
    session = get_session()
    user_role = current_user.get("role")
    user_id = current_user.get("username") or current_user.get("id")

    try:
        if user_role == "admin":
            cql = "SELECT course_id, course_code, course_name, description, teacher_id, teacher_name, semester, academic_year, credits, created_date FROM courses"
            rows = session.execute(cql)
        elif user_role == "teacher":
            cql = "SELECT course_id, course_code, course_name, description, teacher_id, teacher_name, semester, academic_year, credits, created_date FROM courses WHERE teacher_id = ?"
            rows = session.execute(cql, (user_id,))
        else:
            cql = "SELECT course_id, student_id, enrolled_date FROM course_enrollments WHERE student_id = ?"
            enrollment_rows = session.execute(cql, (user_id,))
            course_ids = [row.course_id for row in enrollment_rows]

            if not course_ids:
                return []

            courses = []
            for course_id in course_ids:
                course_cql = "SELECT course_id, course_code, course_name, description, teacher_id, teacher_name, semester, academic_year, credits, created_date FROM courses WHERE course_id = ?"
                course_rows = session.execute(course_cql, (course_id,))
                courses.extend(course_rows)
            rows = courses

        return [
            {
                "course_id": str(row.course_id),
                "course_code": row.course_code,
                "course_name": row.course_name,
                "description": row.description,
                "teacher_id": row.teacher_id,
                "teacher_name": row.teacher_name,
                "semester": row.semester,
                "academic_year": row.academic_year,
                "credits": row.credits,
                "created_date": str(row.created_date) if row.created_date else None,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list courses: {str(e)}")


@router.get("/{course_id}")
async def get_course(course_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session()

    try:
        cql = "SELECT course_id, course_code, course_name, description, teacher_id, teacher_name, semester, academic_year, credits, created_date FROM courses WHERE course_id = ?"
        rows = session.execute(cql, (uuid.UUID(course_id),))
        course_row = rows.one()

        if not course_row:
            raise HTTPException(status_code=404, detail="Course not found")

        return {
            "course_id": str(course_row.course_id),
            "course_code": course_row.course_code,
            "course_name": course_row.course_name,
            "description": course_row.description,
            "teacher_id": course_row.teacher_id,
            "teacher_name": course_row.teacher_name,
            "semester": course_row.semester,
            "academic_year": course_row.academic_year,
            "credits": course_row.credits,
            "created_date": str(course_row.created_date) if course_row.created_date else None,
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course: {str(e)}")


@router.put("/{course_id}")
async def update_course(course_id: str, course: CourseUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can update courses")

    session = get_session()

    try:
        course_uuid = uuid.UUID(course_id)
        current_cql = "SELECT teacher_id FROM courses WHERE course_id = ?"
        current_rows = session.execute(current_cql, (course_uuid,))
        current_row = current_rows.one()

        if not current_row:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.get("role") == "teacher" and current_row.teacher_id != (current_user.get("username") or current_user.get("id")):
            raise HTTPException(status_code=403, detail="Teachers can only update their own courses")

        update_fields = []
        values = []

        if course.course_code is not None:
            update_fields.append("course_code = ?")
            values.append(course.course_code)
        if course.course_name is not None:
            update_fields.append("course_name = ?")
            values.append(course.course_name)
        if course.description is not None:
            update_fields.append("description = ?")
            values.append(course.description)
        if course.semester is not None:
            update_fields.append("semester = ?")
            values.append(course.semester)
        if course.academic_year is not None:
            update_fields.append("academic_year = ?")
            values.append(course.academic_year)
        if course.credits is not None:
            update_fields.append("credits = ?")
            values.append(course.credits)

        if not update_fields:
            return {"message": "No fields to update"}

        values.append(course_uuid)
        cql = f"UPDATE courses SET {', '.join(update_fields)} WHERE course_id = ?"
        session.execute(cql, tuple(values))

        return {"message": "Course updated successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update course: {str(e)}")


@router.delete("/{course_id}")
async def delete_course(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete courses")

    session = get_session()

    try:
        course_uuid = uuid.UUID(course_id)
        cql = "DELETE FROM courses WHERE course_id = ?"
        session.execute(cql, (course_uuid,))

        cql_enroll = "DELETE FROM course_enrollments WHERE course_id = ?"
        session.execute(cql_enroll, (course_uuid,))

        return {"message": "Course deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")


@router.post("/{course_id}/enroll")
async def enroll_course(course_id: str, request: EnrollRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "teacher"]:
        if current_user.get("username") != request.student_id and current_user.get("id") != request.student_id:
            raise HTTPException(status_code=403, detail="Students can only enroll themselves")

    session = get_session()

    try:
        course_uuid = uuid.UUID(course_id)
        cql_enroll = "INSERT INTO course_enrollments (course_id, student_id, enrolled_date) VALUES (?, ?, ?)"
        session.execute(cql_enroll, (course_uuid, request.student_id, datetime.utcnow()))

        cql_student = "INSERT INTO student_courses (student_id, course_id, enrolled_date) VALUES (?, ?, ?)"
        session.execute(cql_student, (request.student_id, course_uuid, datetime.utcnow()))

        return {"message": "Student enrolled successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enroll: {str(e)}")


@router.delete("/{course_id}/enroll/{student_id}")
async def unenroll_course(course_id: str, student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "teacher"]:
        if current_user.get("username") != student_id and current_user.get("id") != student_id:
            raise HTTPException(status_code=403, detail="Students can only unenroll themselves")

    session = get_session()

    try:
        course_uuid = uuid.UUID(course_id)
        cql_enroll = "DELETE FROM course_enrollments WHERE course_id = ? AND student_id = ?"
        session.execute(cql_enroll, (course_uuid, student_id))

        cql_student = "DELETE FROM student_courses WHERE student_id = ? AND course_id = ?"
        session.execute(cql_student, (student_id, course_uuid))

        return {"message": "Student unenrolled successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unenroll: {str(e)}")


@router.get("/{course_id}/students")
async def get_course_students(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can view students")

    session = get_session()

    try:
        course_uuid = uuid.UUID(course_id)
        cql = "SELECT student_id, enrolled_date FROM course_enrollments WHERE course_id = ?"
        rows = session.execute(cql, (course_uuid,))

        return [
            {"student_id": row.student_id, "enrolled_date": str(row.enrolled_date) if row.enrolled_date else None}
            for row in rows
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get students: {str(e)}")
