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
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.docx', '.pptx', '.xlsx', '.jpg', '.jpeg', '.png'}

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    course_name: str = Form("default"),
    username: str = Depends(require_teacher)
):
    try:
        # Validate file extension
        file_ext = '.' + file.filename.split('.')[-1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}")
        
        # Read file content and check size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File size exceeds {MAX_FILE_SIZE/1024/1024}MB limit")
        
        file_id = uuid4()
        file_key = f"{username}/{file_id}_{file.filename}"
        
        # Upload to MinIO
        minio_client = get_client()
        minio_client.put_object(
            BUCKET, 
            file_key, 
            io.BytesIO(file_content), 
            length=len(file_content)
        )
        logger.info(f"File uploaded to MinIO: {file_key}")
        
        # Persist metadata only after the object upload succeeds.
        try:
            cassandra_session = get_session()
            cassandra_session.execute("""
                INSERT INTO course_files (id, filename, course_name, uploaded_by, upload_date, minio_path)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (file_id, file.filename, course_name, username, datetime.utcnow(), f"{BUCKET}/{file_key}"))
            logger.info(f"Metadata saved for file: {file_id}")
        except Exception as db_error:
            logger.warning(f"Failed to save metadata to Cassandra: {str(db_error)}. Rolling back uploaded object.")
            try:
                minio_client.remove_object(BUCKET, file_key)
                logger.info(f"Rolled back MinIO object after Cassandra failure: {file_key}")
            except Exception as rollback_error:
                logger.error(f"Failed to roll back MinIO object {file_key}: {rollback_error}")
            raise HTTPException(status_code=503, detail="Failed to persist file metadata")
        
        return {
            "id": str(file_id), 
            "filename": file.filename,
            "uploaded_by": username,
            "upload_date": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error uploading file: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
