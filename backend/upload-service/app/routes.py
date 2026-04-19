from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from .minio_client import get_client, BUCKET
from .cassandra_client import get_session
from .auth import require_teacher
from uuid import uuid4
from datetime import datetime
import io
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx", ".pptx", ".xlsx", ".jpg", ".jpeg", ".png"}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    course_name: str = Form("default"),
    username: str = Depends(require_teacher),
):
    try:
        file_ext = "." + file.filename.split(".")[-1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            )

        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB limit",
            )

        file_id = uuid4()
        safe_prefix = username.replace("/", "_")
        file_key = f"{safe_prefix}/{file_id}_{file.filename}"

        minio_client = get_client()
        minio_client.put_object(
            BUCKET,
            file_key,
            io.BytesIO(file_content),
            length=len(file_content),
        )
        logger.info("File uploaded to MinIO: %s", file_key)

        try:
            cassandra_session = get_session()
            cassandra_session.execute(
                """
                INSERT INTO course_files (id, filename, course_name, uploaded_by, upload_date, minio_path)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    file_id,
                    file.filename,
                    course_name,
                    username,
                    datetime.utcnow(),
                    f"{BUCKET}/{file_key}",
                ),
            )
            logger.info("Metadata saved for file: %s", file_id)
        except Exception as db_error:
            logger.warning(
                "Failed to save metadata to Cassandra: %s. File still uploaded to MinIO.",
                db_error,
            )

        return {
            "id": str(file_id),
            "filename": file.filename,
            "uploaded_by": username,
            "upload_date": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        logger.error("Error uploading file: %s", e)
        logger.error("Traceback: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e!s}") from e
