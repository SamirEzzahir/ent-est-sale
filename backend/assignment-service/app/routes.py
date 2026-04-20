import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from .cassandra_client import get_session
from .auth_client import validate_token

router = APIRouter()


class AssignmentCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    max_grade: float = 100.0


class SubmissionRequest(BaseModel):
    filename: str
    minio_path: str


class GradeSubmissionRequest(BaseModel):
    score: float
    feedback: Optional[str] = None


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    return await validate_token(token)


@router.get("/health")
async def health():
    return {"service": "assignment-service", "status": "ok"}


@router.post("/")
async def create_assignment(assignment: AssignmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can create assignments")

    session = get_session()
    assignment_id = uuid.uuid4()
    created_by = current_user.get("username") or current_user.get("id")

    try:
        session.set_keyspace('ent')
        cql = """
        INSERT INTO assignments (assignment_id, course_id, title, description, created_by, due_date, max_grade, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        due_date = None
        if assignment.due_date:
            try:
                due_date = datetime.fromisoformat(assignment.due_date)
            except:
                due_date = None

        session.execute(
            cql,
            (assignment_id, uuid.UUID(assignment.course_id), assignment.title, assignment.description, created_by, due_date, assignment.max_grade, datetime.utcnow())
        )
        return {"assignment_id": str(assignment_id), "message": "Assignment created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")


@router.get("/")
async def list_assignments(course_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        if course_id:
            cql = "SELECT assignment_id, course_id, title, description, created_by, due_date, max_grade, created_date FROM assignments WHERE course_id = ?"
            rows = session.execute(cql, (uuid.UUID(course_id),))
        else:
            cql = "SELECT assignment_id, course_id, title, description, created_by, due_date, max_grade, created_date FROM assignments"
            rows = session.execute(cql)

        return [
            {
                "assignment_id": str(row.assignment_id),
                "course_id": str(row.course_id),
                "title": row.title,
                "description": row.description,
                "created_by": row.created_by,
                "due_date": str(row.due_date) if row.due_date else None,
                "max_grade": row.max_grade,
                "created_date": str(row.created_date) if row.created_date else None,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list assignments: {str(e)}")


@router.get("/{assignment_id}")
async def get_assignment(assignment_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT assignment_id, course_id, title, description, created_by, due_date, max_grade, created_date FROM assignments WHERE assignment_id = ?"
        rows = session.execute(cql, (uuid.UUID(assignment_id),))
        row = rows.one()

        if not row:
            raise HTTPException(status_code=404, detail="Assignment not found")

        return {
            "assignment_id": str(row.assignment_id),
            "course_id": str(row.course_id),
            "title": row.title,
            "description": row.description,
            "created_by": row.created_by,
            "due_date": str(row.due_date) if row.due_date else None,
            "max_grade": row.max_grade,
            "created_date": str(row.created_date) if row.created_date else None,
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignment: {str(e)}")


@router.post("/{assignment_id}/submit")
async def submit_assignment(assignment_id: str, submission: SubmissionRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit assignments")

    session = get_session()
    session.set_keyspace('ent')
    submission_id = uuid.uuid4()
    student_id = current_user.get("username") or current_user.get("id")

    try:
        cql = """
        INSERT INTO submissions (submission_id, assignment_id, student_id, filename, minio_path, submitted_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (submission_id, uuid.UUID(assignment_id), student_id, submission.filename, submission.minio_path, datetime.utcnow(), "submitted")
        )
        return {"submission_id": str(submission_id), "message": "Assignment submitted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit: {str(e)}")


@router.get("/{assignment_id}/submissions")
async def get_submissions(assignment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can view submissions")

    session = get_session()
    session.set_keyspace('ent')

    try:
        cql = "SELECT submission_id, assignment_id, student_id, filename, minio_path, submitted_date, status FROM submissions WHERE assignment_id = ?"
        rows = session.execute(cql, (uuid.UUID(assignment_id),))

        return [
            {
                "submission_id": str(row.submission_id),
                "assignment_id": str(row.assignment_id),
                "student_id": row.student_id,
                "filename": row.filename,
                "minio_path": row.minio_path,
                "submitted_date": str(row.submitted_date) if row.submitted_date else None,
                "status": row.status,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get submissions: {str(e)}")


@router.post("/{assignment_id}/submissions/{submission_id}/grade")
async def grade_submission(assignment_id: str, submission_id: str, grade_req: GradeSubmissionRequest, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers/admins can grade")

    session = get_session()
    session.set_keyspace('ent')
    graded_by = current_user.get("username") or current_user.get("id")

    try:
        submission_cql = "SELECT student_id FROM submissions WHERE submission_id = ?"
        sub_rows = session.execute(submission_cql, (uuid.UUID(submission_id),))
        sub_row = sub_rows.one()

        if not sub_row:
            raise HTTPException(status_code=404, detail="Submission not found")

        cql = """
        INSERT INTO assignment_grades (submission_id, student_id, assignment_id, score, feedback, graded_by, graded_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """

        session.execute(
            cql,
            (uuid.UUID(submission_id), sub_row.student_id, uuid.UUID(assignment_id), grade_req.score, grade_req.feedback, graded_by, datetime.utcnow())
        )

        update_cql = "UPDATE submissions SET status = ? WHERE submission_id = ?"
        session.execute(update_cql, ("graded", uuid.UUID(submission_id)))

        return {"message": "Grade recorded"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid ID: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to grade: {str(e)}")


@router.get("/my-submissions")
async def my_submissions(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view own submissions")

    session = get_session()
    session.set_keyspace('ent')
    student_id = current_user.get("username") or current_user.get("id")

    try:
        cql = "SELECT submission_id, assignment_id, student_id, filename, minio_path, submitted_date, status FROM submissions WHERE student_id = ?"
        rows = session.execute(cql, (student_id,))

        return [
            {
                "submission_id": str(row.submission_id),
                "assignment_id": str(row.assignment_id),
                "student_id": row.student_id,
                "filename": row.filename,
                "minio_path": row.minio_path,
                "submitted_date": str(row.submitted_date) if row.submitted_date else None,
                "status": row.status,
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get submissions: {str(e)}")
