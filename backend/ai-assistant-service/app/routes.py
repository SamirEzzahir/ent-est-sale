import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import get_current_user, get_token
from .clients import (
    OLLAMA_MODEL,
    fetch_file,
    fetch_files,
    fetch_profile,
    generate_with_ollama,
    list_ollama_models,
)
from .prompting import build_fallback_answer, build_prompt

router = APIRouter()
ENABLE_FALLBACK = os.getenv("AI_ASSISTANT_FALLBACK", "true").lower() != "false"


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=3, max_length=4000)
    file_id: str | None = None


@router.get("/health")
async def assistant_health(user: dict = Depends(get_current_user)):
    models = await list_ollama_models()
    return {
        "service": "ai-assistant-service",
        "status": "ok",
        "user": user,
        "ollama_model": OLLAMA_MODEL,
        "ollama_models": models,
        "fallback_enabled": ENABLE_FALLBACK,
    }


@router.get("/context/files")
async def assistant_files(
    token: str = Depends(get_token),
    user: dict = Depends(get_current_user),
):
    files = await fetch_files(token)
    return {
        "user": user,
        "count": len(files),
        "files": files,
    }


@router.post("/chat")
async def assistant_chat(
    payload: ChatRequest,
    token: str = Depends(get_token),
    user: dict = Depends(get_current_user),
):
    profile = await fetch_profile(token, user)
    files = await fetch_files(token)
    selected_file = None

    if payload.file_id:
        selected_file = await fetch_file(token, payload.file_id)
        if not selected_file:
            raise HTTPException(status_code=404, detail="Selected file not found")

    prompt = build_prompt(profile, payload.message, files, selected_file)

    try:
        answer = await generate_with_ollama(prompt)
        provider = "ollama"
    except HTTPException:
        if not ENABLE_FALLBACK:
            raise
        answer = build_fallback_answer(profile, payload.message, files, selected_file)
        provider = "fallback"

    return {
        "answer": answer,
        "provider": provider,
        "model": OLLAMA_MODEL,
        "user": profile,
        "context": {
            "selected_file": selected_file,
            "available_file_count": len(files),
        },
    }
