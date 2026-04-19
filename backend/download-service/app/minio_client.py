from minio import Minio
import os
import logging
from urllib.parse import urlparse, urlunparse

logger = logging.getLogger(__name__)


def _default_minio_public_host() -> str:
    public_base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost").rstrip("/")
    minio_public_port = os.getenv("MINIO_PUBLIC_PORT", "9000")
    parsed = urlparse(public_base_url)
    hostname = parsed.hostname or "localhost"
    return f"{hostname}:{minio_public_port}"


minio_host = os.getenv("MINIO_HOST", "minio:9000")
minio_public_host = os.getenv("MINIO_PUBLIC_HOST") or _default_minio_public_host()
minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
minio_secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
minio_secure = os.getenv("MINIO_SECURE", "False").lower() == "true"
BUCKET = os.getenv("MINIO_BUCKET", "course-files")

client = None


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


def to_public_url(url: str) -> str:
    parsed = urlparse(url)
    public_netloc = minio_public_host
    public_scheme = "https" if minio_secure else "http"
    return urlunparse(
        (
            public_scheme,
            public_netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment,
        )
    )
