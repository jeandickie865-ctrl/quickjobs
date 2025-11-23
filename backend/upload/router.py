# upload/router.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from users.models import User
from pydantic import BaseModel
import os
import uuid
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("/app/uploads/profile-photos")
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class PhotoUploadResponse(BaseModel):
    photo_url: str
    message: str

@router.post("/profile-photo", response_model=PhotoUploadResponse)
async def upload_profile_photo_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid file type", "allowed": ["jpg", "png", "webp"]}
        )
    
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "File too large", "max_size_mb": 5}
        )
    
    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    photo_url = f"/uploads/profile-photos/{filename}"
    
    return PhotoUploadResponse(
        photo_url=photo_url,
        message="Photo uploaded successfully"
    )
