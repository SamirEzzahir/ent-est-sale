from fastapi import FastAPI
from app.routes import router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Upload Service", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("Upload service started")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Upload service shutting down")

app.include_router(router, prefix="/api/upload")
