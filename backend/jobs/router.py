# jobs/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import uuid
from datetime import datetime, date, time
from core.database import get_db
from core.security import get_current_user
from users.models import User, UserRole
from jobs.models import Job
from jobs.schemas import JobCreate, JobUpdate, JobResponse

router = APIRouter()


# ===== CLEANUP FUNCTION =====
async def delete_expired_jobs(db: AsyncSession):
    """
    Löscht alle abgelaufenen Jobs.
    Ein Job ist abgelaufen wenn:
    - timeMode == "fixed_time" UND
    - (date < HEUTE ODER (date == HEUTE UND endAt < JETZT))
    
    Jobs mit status='matched' werden zusammen mit ihren Applications gelöscht.
    """
    now = datetime.utcnow()
    today_date = now.date()
    current_time = now.time()
    
    # Hole alle fixed_time Jobs
    result = await db.execute(
        select(Job).where(Job.time_mode == 'fixed_time')
    )
    all_jobs = result.scalars().all()
    
    jobs_to_delete = []
    
    for job in all_jobs:
        if not job.date or not job.end_at:
            continue
            
        try:
            # Parse date
            job_date = datetime.fromisoformat(job.date).date() if isinstance(job.date, str) else job.date
            
            # Parse end_at (Format: HH:MM)
            if ':' in str(job.end_at):
                end_hour, end_min = map(int, job.end_at.split(':'))
                job_end_time = time(end_hour, end_min)
            else:
                continue
            
            # Check if job is EXPIRED
            # EXPIRED = date < HEUTE ODER (date == HEUTE UND endAt < JETZT)
            is_expired = False
            if job_date < today_date:
                is_expired = True
            elif job_date == today_date and job_end_time < current_time:
                is_expired = True
            
            if is_expired:
                jobs_to_delete.append(job)
                
        except (ValueError, AttributeError):
            # Skip jobs with invalid date/time format
            continue
    
    # Delete jobs and their applications
    for job in jobs_to_delete:
        # If matched, delete applications first
        if job.status == 'matched':
            from applications.models import Application
            await db.execute(
                delete(Application).where(Application.job_id == job.id)
            )
        
        # Delete the job (both open and matched)
        await db.delete(job)
    
    if jobs_to_delete:
        await db.commit()
        print(f"🧹 Deleted {len(jobs_to_delete)} expired jobs")


def is_job_expired(job: Job) -> bool:
    """
    Helper to check if a job is expired.
    EXPIRED = date < HEUTE ODER (date == HEUTE UND endAt < JETZT)
    """
    if not job.date or not job.end_at:
        return False
        
    now = datetime.utcnow()
    today_date = now.date()
    current_time = now.time()
    
    try:
        job_date = datetime.fromisoformat(job.date).date() if isinstance(job.date, str) else job.date
        
        if ':' in str(job.end_at):
            end_hour, end_min = map(int, job.end_at.split(':'))
            job_end_time = time(end_hour, end_min)
        else:
            return False
        
        # EXPIRED check
        if job_date < today_date:
            return True
        elif job_date == today_date and job_end_time < current_time:
            return True
            
    except (ValueError, AttributeError):
        pass
    
    return False

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new job (only employers)"""
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can create jobs"
        )
    
    # Create job
    job = Job(
        id=uuid.uuid4(),
        employer_id=current_user.id,
        title=job_data.title,
        description=job_data.description,
        street=job_data.street,
        house_number=job_data.house_number,
        postal_code=job_data.postal_code,
        city=job_data.city,
        lat=job_data.lat,
        lon=job_data.lon,
        categories=job_data.categories,
        qualifications=job_data.qualifications,
        date=job_data.date,
        start_at=job_data.startAt,
        end_at=job_data.endAt,
        time_mode=job_data.timeMode,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.get("/employer/me", response_model=List[JobResponse])
async def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all jobs of the current employer"""
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can access this endpoint"
        )
    
    # Cleanup expired jobs first
    await delete_expired_jobs(db)
    
    result = await db.execute(
        select(Job).where(Job.employer_id == current_user.id)
    )
    jobs = result.scalars().all()
    
    # Clean up old jobs
    today = datetime.now().date()
    
    cleaned = []
    for job in jobs:
        if not job.date:
            continue
        try:
            job_date = datetime.strptime(job.date, "%Y-%m-%d").date()
        except:
            continue
        
        if job_date < today:
            # löschen
            await db.delete(job)
            await db.commit()
            continue
        
        cleaned.append(job)
    
    jobs = cleaned
    
    return jobs

@router.get("", response_model=List[JobResponse])
async def list_all_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all jobs (for matching/browsing)"""
    # Cleanup expired jobs first
    await delete_expired_jobs(db)
    
    result = await db.execute(select(Job))
    jobs = result.scalars().all()
    
    # Filter out expired jobs for workers
    if current_user.role == UserRole.WORKER:
        jobs = [job for job in jobs if not is_job_expired(job)]
    
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific job by ID"""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    result = await db.execute(
        select(Job).where(Job.id == job_uuid)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job

@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a job (only owner)"""
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can update jobs"
        )
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Get job
    result = await db.execute(
        select(Job).where(Job.id == job_uuid)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check ownership
    if job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this job"
        )
    
    # Update fields
    update_data = job_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        # Map camelCase to snake_case for time fields
        if key == 'startAt':
            setattr(job, 'start_at', value)
        elif key == 'endAt':
            setattr(job, 'end_at', value)
        elif key == 'timeMode':
            setattr(job, 'time_mode', value)
        else:
            setattr(job, key, value)
    
    # Manually update timestamp
    job.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(job)
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a job (only owner)"""
    # Check if user is employer
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can delete jobs"
        )
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Get job
    result = await db.execute(
        select(Job).where(Job.id == job_uuid)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check ownership
    if job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this job"
        )
    
    await db.delete(job)
    await db.commit()
    return None
