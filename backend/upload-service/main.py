import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _allowed_origins() -> list[str]:
    configured = os.getenv("CORS_ALLOWED_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    public_base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost").rstrip("/")
    defaults = [public_base_url, "http://localhost:5173", "http://127.0.0.1:5173"]
    return list(dict.fromkeys(defaults))

app = FastAPI(title="Upload Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Upload service started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Upload service shutting down")

app.include_router(router, prefix="/api/upload")


@app.get("/")
def health():
    return {"service": "upload-service", "status": "ok"}
