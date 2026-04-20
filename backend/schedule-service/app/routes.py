import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from .cassandra_client import get_session
from .auth_client import validate_token

router = APIRouter()


class ScheduleCreate(BaseModel):
    course_id: str
    day_of_week: str
    start_time: str
    end_time: str
    room: str
    teacher_id: str
    academic_year: str
    semester: int


class ExamCreate(BaseModel):
    course_id: str
    title: str
    exam_date: str
    duration_minutes: int
    room: str
    exam_type: str


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    return await validate_token(token)


@router.get("/health")
async def health():
    return {"service": "schedule-service", "status": "ok"}


@router.post("/schedule")
async def create_schedule(schedule: ScheduleCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create schedules")

    session = get_session()
    session.set_keyspace('ent')
    schedule_id = uuid.uuid4()

    try:
        cql = """
        INSERT INTO class_schedule (schedule_id, course_id, day_of_week, start_time, end_time, room, teacher_id, academic_year, semester)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (schedule_id, uuid.UUID(schedule.course_id), schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.room, schedule.teacher_id, schedule.academic_year, schedule.semester)
        )
        return {"schedule_id": str(schedule_id), "message": "Schedule created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create schedule: {str(e)}")


@router.get("/schedule/{course_id}")
async def get_schedule(course_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT schedule_id, course_id, day_of_week, start_time, end_time, room, teacher_id, academic_year, semester FROM class_schedule WHERE course_id = ?"
        rows = session.execute(cql, (uuid.UUID(course_id),))

        return [
            {
                "schedule_id": str(row.schedule_id),
                "course_id": str(row.course_id),
                "day_of_week": row.day_of_week,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "room": row.room,
                "teacher_id": row.teacher_id,
                "academic_year": row.academic_year,
                "semester": row.semester,
            }
            for row in rows
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid course_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get schedule: {str(e)}")


@router.post("/exams")
async def create_exam(exam: ExamCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can create exams")

    session = get_session()
    session.set_keyspace('ent')
    exam_id = uuid.uuid4()
    created_by = current_user.get("username") or current_user.get("id")

    try:
        cql = """
        INSERT INTO exams (exam_id, course_id, title, exam_date, duration_minutes, room, exam_type, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        exam_date = datetime.fromisoformat(exam.exam_date)

        session.execute(
            cql,
            (exam_id, uuid.UUID(exam.course_id), exam.title, exam_date, exam.duration_minutes, exam.room, exam.exam_type, created_by)
        )
        return {"exam_id": str(exam_id), "message": "Exam created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create exam: {str(e)}")


@router.get("/exams")
async def get_exams(current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT exam_id, course_id, title, exam_date, duration_minutes, room, exam_type, created_by FROM exams"
        rows = session.execute(cql)

        return [
            {
                "exam_id": str(row.exam_id),
                "course_id": str(row.course_id),
                "title": row.title,
                "exam_date": str(row.exam_date) if row.exam_date else None,
                "duration_minutes": row.duration_minutes,
                "room": row.room,
                "exam_type": row.exam_type,
                "created_by": row.created_by,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exams: {str(e)}")


@router.get("/exams/{exam_id}")
async def get_exam(exam_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT exam_id, course_id, title, exam_date, duration_minutes, room, exam_type, created_by FROM exams WHERE exam_id = ?"
        rows = session.execute(cql, (uuid.UUID(exam_id),))
        row = rows.one()

        if not row:
            raise HTTPException(status_code=404, detail="Exam not found")

        return {
            "exam_id": str(row.exam_id),
            "course_id": str(row.course_id),
            "title": row.title,
            "exam_date": str(row.exam_date) if row.exam_date else None,
            "duration_minutes": row.duration_minutes,
            "room": row.room,
            "exam_type": row.exam_type,
            "created_by": row.created_by,
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid exam_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get exam: {str(e)}")
