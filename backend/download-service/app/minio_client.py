from minio import Minio
import os
import logging

logger = logging.getLogger(__name__)

minio_host = os.getenv("MINIO_HOST", "localhost:9000")
minio_public_host = os.getenv("MINIO_PUBLIC_HOST", minio_host)
minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
minio_secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
minio_secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
BUCKET = os.getenv("MINIO_BUCKET", "course-files")

client = None
public_client = None


def get_client():
    global client

    if client is not None:
        return client

    try:
        client = Minio(
            minio_host,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure,
        )
        logger.info(f"MinIO client initialized for {minio_host}")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize MinIO client: {str(e)}")
        raise


def get_public_client():
    global public_client

    if public_client is not None:
        return public_client

    try:
        public_client = Minio(
            minio_public_host,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure,
        )
        logger.info(f"MinIO public client initialized for {minio_public_host}")
        return public_client
    except Exception as e:
        logger.error(f"Failed to initialize public MinIO client: {str(e)}")
        raise
