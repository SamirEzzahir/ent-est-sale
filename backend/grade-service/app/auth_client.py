import os
import httpx
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)


async def validate_token(token: str) -> dict:
    auth_url = os.getenv("CORE_AUTH_URL", "http://core-auth:8001/api/auth")

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f"{auth_url}/me",
                headers={"Authorization": f"Bearer {token}"}
            )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = response.json()
        return user
    except httpx.RequestError as e:
        logger.error(f"Auth service unreachable: {e}")
        raise HTTPException(status_code=503, detail="Auth service unavailable")
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
