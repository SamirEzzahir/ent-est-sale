from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)
SECRET = os.getenv("JWT_SECRET", "dev-secret-key")

def get_token(authorization: str = Header(None)) -> str:
    """Extract and validate JWT token from authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    
    return token

def get_current_user(token: str = Depends(get_token)) -> str:
    """Extract username from JWT token."""
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        username = payload.get("sub")
        
        if not username:
            raise HTTPException(status_code=401, detail="Token missing user claim")
        
        return username
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_role(token: str = Depends(get_token)) -> str:
    """Extract role from JWT token."""
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        role = payload.get("role")
        
        if not role:
            raise HTTPException(status_code=401, detail="Token missing role claim")
        
        return role
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

def require_teacher(username: str = Depends(get_current_user), role: str = Depends(get_current_role)) -> str:
    """Verify user is a teacher."""
    if role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher role required")
    return username