from minio import Minio
import os
import logging

logger = logging.getLogger(__name__)

minio_host = os.getenv("MINIO_HOST", "localhost:9000")
minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
minio_secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
minio_secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
BUCKET = os.getenv("MINIO_BUCKET", "course-files")

client = None

def get_client():
    """Lazy-load MinIO client."""
    global client
    
    if client is not None:
        return client
    
    try:
        client = Minio(
            minio_host,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure
        )
        
        if not client.bucket_exists(BUCKET):
            client.make_bucket(BUCKET)
            logger.info(f"Created MinIO bucket: {BUCKET}")
        else:
            logger.info(f"MinIO bucket exists: {BUCKET}")
        
        return client
    except Exception as e:
        logger.error(f"Failed to initialize MinIO client: {str(e)}")
        raise