# upload/router.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.s3_service import upload_profile_photo
from users.models import User
from pydantic import BaseModel

router = APIRouter()

class PhotoUploadResponse(BaseModel):
    photo_url: str
    message: str

@router.post("/profile-photo", response_model=PhotoUploadResponse)
async def upload_profile_photo_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload profile photo to S3
    
    - Accepts multipart/form-data with 'file' field
    - Max size: 5 MB
    - Allowed types: jpg, jpeg, png
    - Returns public URL
    """
    try:
        # Upload to S3
        photo_url = await upload_profile_photo(current_user.id, file)
        
        return PhotoUploadResponse(
            photo_url=photo_url,
            message="Photo uploaded successfully"
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )
