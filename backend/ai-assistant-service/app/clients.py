import logging
import os

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

CORE_AUTH_URL = os.getenv("CORE_AUTH_URL", "http://core-auth:8001/api/auth").rstrip("/")
DOWNLOAD_SERVICE_URL = os.getenv("DOWNLOAD_SERVICE_URL", "http://download-service:8003/api/download").rstrip("/")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def _headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def fetch_profile(token: str, fallback_user: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{CORE_AUTH_URL}/me", headers=_headers(token))
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict):
                return {
                    "username": payload.get("username", fallback_user["username"]),
                    "role": payload.get("role", fallback_user["role"]),
                    "email": payload.get("email", fallback_user.get("email", "")),
                }
    except Exception as exc:
        logger.warning("Could not enrich user profile via core-auth: %s", exc)
    return fallback_user


async def fetch_files(token: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(f"{DOWNLOAD_SERVICE_URL}/files", headers=_headers(token))
            response.raise_for_status()
            payload = response.json()
            return payload if isinstance(payload, list) else []
    except httpx.HTTPStatusError as exc:
        logger.error("download-service returned %s while listing files", exc.response.status_code)
        raise HTTPException(status_code=502, detail="download-service rejected the assistant request")
    except Exception as exc:
        logger.error("Failed to fetch files from download-service: %s", exc)
        raise HTTPException(status_code=503, detail="download-service unavailable")


async def fetch_file(token: str, file_id: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(f"{DOWNLOAD_SERVICE_URL}/files/{file_id}", headers=_headers(token))
            if response.status_code == 404:
                return None
            response.raise_for_status()
            payload = response.json()
            return payload if isinstance(payload, dict) else None
    except httpx.HTTPStatusError as exc:
        logger.error("download-service returned %s while getting file %s", exc.response.status_code, file_id)
        raise HTTPException(status_code=502, detail="download-service could not provide the requested resource")
    except Exception as exc:
        logger.error("Failed to fetch file %s from download-service: %s", file_id, exc)
        raise HTTPException(status_code=503, detail="download-service unavailable")


async def list_ollama_models() -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            payload = response.json()
            models = payload.get("models", [])
            return [model.get("name", "") for model in models if model.get("name")]
    except Exception as exc:
        logger.warning("Could not list Ollama models: %s", exc)
        return []


async def generate_with_ollama(prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            payload = response.json()
            answer = payload.get("response", "").strip()
            if not answer:
                raise HTTPException(status_code=502, detail="Ollama returned an empty response")
            return answer
    except httpx.HTTPStatusError as exc:
        logger.warning("Ollama returned %s: %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=502, detail="Ollama could not generate a response")
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Failed to call Ollama: %s", exc)
        raise HTTPException(status_code=503, detail="Ollama unavailable")
