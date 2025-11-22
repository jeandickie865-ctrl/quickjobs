# matches/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime
from core.database import get_db
from core.security import get_current_user
from users.models import User, UserRole
from applications.models import Application, ApplicationStatus
from jobs.models import Job

router = APIRouter()

@router.post("/select/{application_id}")
async def select_worker(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Employer wählt einen Worker aus einer Bewerbung aus
    """
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can select workers"
        )
    
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid application ID format"
        )
    
    # Get application
    result = await db.execute(
        select(Application).where(Application.id == app_uuid)
    )
    application = result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Get job to verify ownership
    job_result = await db.execute(
        select(Job).where(Job.id == application.job_id)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if employer owns this job
    if job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only select workers for your own jobs"
        )
    
    # Update application status
    application.status = ApplicationStatus.SELECTED
    
    await db.commit()
    await db.refresh(application)
    
    return {
        "status": "selected",
        "application_id": str(application.id)
    }
