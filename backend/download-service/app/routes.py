from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from .cassandra_client import get_session
from .minio_client import get_client, BUCKET
from .auth import get_current_user, require_teacher_or_admin
import logging
from urllib.parse import quote
import mimetypes
import os

logger = logging.getLogger(__name__)
router = APIRouter()


class UpdateFileRequest(BaseModel):
    course_name: str
    filename: str | None = None


def _row_to_file(row) -> dict:
    return {
        "id": str(row.id),
        "filename": row.filename,
        "course_name": row.course_name,
        "uploaded_by": row.uploaded_by,
        "upload_date": str(row.upload_date),
        "minio_path": row.minio_path,
    }


def _extract_object_key(minio_path: str) -> str:
    if "/" in minio_path:
        return minio_path.split("/", 1)[1]
    return minio_path


def _get_file_row(session, file_id: str):
    from uuid import UUID
    rows = session.execute(
        "SELECT * FROM course_files WHERE id = %s", (UUID(file_id),)
    )
    row = rows.one()
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    return row


def _ensure_manage_permission(user: dict, row) -> None:
    if user["role"] == "admin":
        return
    if user["role"] == "teacher" and row.uploaded_by == user["username"]:
        return
    raise HTTPException(status_code=403, detail="You can only manage your own resources")


def _public_base_url(request: Request) -> str:
    configured = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    if configured:
        return configured
    return str(request.base_url).rstrip("/")


def _download_url(request: Request, file_id: str, disposition: str) -> str:
    base = _public_base_url(request)
    return f"{base}/api/download/files/{file_id}/content?disposition={disposition}"


def _iter_object(response, chunk_size: int = 64 * 1024):
    try:
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            yield chunk
    finally:
        response.close()
        response.release_conn()

@router.get("/files")
def list_files(user: dict = Depends(get_current_user)):
    """List all uploaded files (metadata from Cassandra)."""
    try:
        session = get_session()
        rows = session.execute("SELECT * FROM course_files")
        return [_row_to_file(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to list files: {e}")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")


@router.get("/files/{file_id}")
def get_file(file_id: str, user: dict = Depends(get_current_user)):
    """Get metadata for a single file."""
    try:
        session = get_session()
        row = _get_file_row(session, file_id)
        return _row_to_file(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file {file_id}: {e}")
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")


@router.get("/files/{file_id}/download")
def download_file(
    request: Request,
    file_id: str,
    disposition: str = Query(default="attachment", pattern="^(attachment|inline)$"),
    user: dict = Depends(get_current_user),
):
    """Return a backend URL for downloading or previewing a file."""
    try:
        session = get_session()
        row = _get_file_row(session, file_id)
        logger.info(f"Generated presigned URL for file {file_id} by user {user['username']}")
        return {
            "download_url": _download_url(request, file_id, disposition),
            "filename": row.filename,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate download URL for {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")


@router.get("/files/{file_id}/content")
def stream_file(
    file_id: str,
    disposition: str = Query(default="attachment", pattern="^(attachment|inline)$"),
    user: dict = Depends(get_current_user),
):
    """Stream a file through the backend so browser preview/download works reliably."""
    try:
        session = get_session()
        row = _get_file_row(session, file_id)

        object_key = _extract_object_key(row.minio_path)
        filename = row.filename or object_key.rsplit("/", 1)[-1]
        encoded_filename = quote(filename)
        media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        minio_client = get_client()
        response = minio_client.get_object(BUCKET, object_key)

        headers = {
            "Content-Disposition": f"{disposition}; filename*=UTF-8''{encoded_filename}"
        }
        logger.info("Streaming file %s to user %s", file_id, user["username"])
        return StreamingResponse(
            _iter_object(response),
            media_type=media_type,
            headers=headers,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stream file {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stream file: {str(e)}")


@router.patch("/files/{file_id}")
def update_file(
    file_id: str,
    body: UpdateFileRequest,
    user: dict = Depends(require_teacher_or_admin),
):
    try:
        if not body.course_name.strip():
            raise HTTPException(status_code=400, detail="Course name cannot be empty")
        if body.filename is not None and not body.filename.strip():
            raise HTTPException(status_code=400, detail="Filename cannot be empty")

        session = get_session()
        row = _get_file_row(session, file_id)
        _ensure_manage_permission(user, row)

        filename = body.filename.strip() if body.filename is not None else row.filename
        course_name = body.course_name.strip()

        session.execute(
            """
            UPDATE course_files
            SET filename = %s, course_name = %s
            WHERE id = %s
            """,
            (filename, course_name, row.id),
        )

        updated_row = _get_file_row(session, file_id)
        logger.info("User %s updated file %s", user["username"], file_id)
        return _row_to_file(updated_row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update file {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update file: {str(e)}")


@router.delete("/files/{file_id}", status_code=204)
def delete_file(
    file_id: str,
    user: dict = Depends(require_teacher_or_admin),
):
    try:
        session = get_session()
        row = _get_file_row(session, file_id)
        _ensure_manage_permission(user, row)

        object_key = _extract_object_key(row.minio_path)
        minio_client = get_client()
        minio_client.remove_object(BUCKET, object_key)

        session.execute("DELETE FROM course_files WHERE id = %s", (row.id,))
        logger.info("User %s deleted file %s", user["username"], file_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
