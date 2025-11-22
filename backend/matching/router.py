# matching/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
from core.database import get_db
from core.security import get_current_user
from users.models import User
from profiles.worker_models import WorkerProfile
from jobs.schemas import JobResponse
from matching.service import find_matching_jobs

router = APIRouter()

@router.get("/worker/{worker_id}", response_model=List[JobResponse])
async def get_matching_jobs_for_worker(
    worker_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all matching jobs for a specific worker based on:
    - Location and radius
    - Categories
    - Qualifications
    """
    # Get worker profile
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == uuid.UUID(worker_id))
    )
    worker_profile = result.scalar_one_or_none()
    
    if not worker_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found"
        )
    
    # Find matching jobs
    matching_jobs = await find_matching_jobs(db, worker_profile)
    
    return [JobResponse.from_orm(job) for job in matching_jobs]

@router.get("/me", response_model=List[JobResponse])
async def get_my_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all matching jobs for the current authenticated worker
    """
    # Get worker profile
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == current_user.id)
    )
    worker_profile = result.scalar_one_or_none()
    
    if not worker_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found. Please create your profile first."
        )
    
    # Find matching jobs
    matching_jobs = await find_matching_jobs(db, worker_profile)
    
    return [JobResponse.from_orm(job) for job in matching_jobs]
