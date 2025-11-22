# core/s3_service.py
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "deepin-profile-photos")
S3_REGION = os.getenv("S3_REGION", "eu-central-1")

# Allowed file types and size
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION
)

def get_file_extension(filename: str) -> str:
    """Extract file extension from filename"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def validate_image_file(file: UploadFile) -> None:
    """Validate image file type and size"""
    # Check file extension
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size (read content to get size)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024):.1f} MB"
        )

async def upload_profile_photo(user_id: uuid.UUID, file: UploadFile) -> str:
    """
    Upload profile photo to S3 and return public URL
    
    Args:
        user_id: UUID of the user
        file: UploadFile from FastAPI
    
    Returns:
        str: Public URL of the uploaded image
    
    Raises:
        HTTPException: If validation fails or upload fails
    """
    # Validate file
    validate_image_file(file)
    
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = get_file_extension(file.filename)
    s3_key = f"{user_id}/{timestamp}.{ext}"
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=file.content_type or 'image/jpeg',
            ACL='public-read'  # Make file publicly accessible
        )
        
        # Generate public URL
        public_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{s3_key}"
        
        return public_url
        
    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to S3: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during upload: {str(e)}"
        )

async def delete_profile_photo(photo_url: str) -> bool:
    """
    Delete profile photo from S3
    
    Args:
        photo_url: Full S3 URL of the photo
    
    Returns:
        bool: True if deletion successful
    """
    try:
        # Extract S3 key from URL
        # URL format: https://bucket-name.s3.region.amazonaws.com/key
        s3_key = photo_url.split(f"{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/")[1]
        
        s3_client.delete_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key
        )
        
        return True
        
    except Exception as e:
        print(f"Error deleting photo from S3: {str(e)}")
        return False
