# applications/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from core.database import get_db
from core.security import get_current_user
from users.models import User, UserRole
from applications.models import Application, ApplicationStatus
from applications.schemas import ApplicationCreate, ApplicationResponse
from jobs.models import Job

router = APIRouter()

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Worker bewirbt sich auf einen Job ("Ich habe Zeit")
    """
    # Check if user is worker
    if current_user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can apply for jobs"
        )
    
    # Check if job exists
    job_result = await db.execute(
        select(Job).where(Job.id == application_data.job_id)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if worker already applied
    existing_result = await db.execute(
        select(Application).where(
            Application.job_id == application_data.job_id,
            Application.worker_id == current_user.id
        )
    )
    existing_application = existing_result.scalar_one_or_none()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )
    
    # Create application
    application = Application(
        id=uuid.uuid4(),
        job_id=application_data.job_id,
        worker_id=current_user.id,
        status=ApplicationStatus.APPLIED
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    return application

@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
async def get_applications_for_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Employer sieht alle Bewerbungen auf einen seiner Jobs
    """
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can view job applications"
        )
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Check if job exists and belongs to this employer
    job_result = await db.execute(
        select(Job).where(Job.id == job_uuid)
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view applications for your own jobs"
        )
    
    # Get all applications for this job
    result = await db.execute(
        select(Application).where(Application.job_id == job_uuid)
    )
    applications = result.scalars().all()
    
    return applications

@router.get("/me", response_model=List[ApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Worker sieht alle eigenen Bewerbungen
    """
    # Check if user is worker
    if current_user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can view their applications"
        )
    
    # Get all applications for this worker
    result = await db.execute(
        select(Application).where(Application.worker_id == current_user.id)
    )
    applications = result.scalars().all()
    
    return applications

@router.post("/{application_id}/pay", response_model=ApplicationResponse)
async def pay_for_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Employer zahlt für eine Application und schaltet den Chat frei
    """
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can pay for applications"
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
    
    # Verify that the job belongs to this employer
    job_result = await db.execute(
        select(Job).where(Job.id == application.job_id)
    )
    job = job_result.scalar_one_or_none()
    
    if not job or job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only pay for applications on your own jobs"
        )
    
    # Mark as paid and unlock chat
    application.is_paid = True
    application.chat_unlocked = True
    application.status = ApplicationStatus.ACTIVE
    
    await db.commit()
    await db.refresh(application)
    
    return application
