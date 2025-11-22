# profiles/worker_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime
from core.database import get_db
from core.security import get_current_user
from users.models import User, UserRole
from profiles.worker_models import WorkerProfile
from profiles.schemas import WorkerProfileCreate, WorkerProfileUpdate, WorkerProfileResponse

router = APIRouter()

@router.post("", response_model=WorkerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_worker_profile(
    profile_data: WorkerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new worker profile for the current user"""
    # Check user role
    if current_user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workers can create worker profiles"
        )
    
    # Check if profile already exists
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == current_user.id)
    )
    existing_profile = result.scalar_one_or_none()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker profile already exists"
        )
    
    # Create profile
    profile = WorkerProfile(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=profile_data.name,
        street=profile_data.street,
        postal_code=profile_data.postal_code,
        city=profile_data.city,
        lat=profile_data.lat,
        lon=profile_data.lon,
        categories=profile_data.categories,
        qualifications=profile_data.qualifications,
        activities=profile_data.activities,
        radius_km=profile_data.radius_km,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/me", response_model=WorkerProfileResponse)
async def get_my_worker_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's worker profile"""
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found"
        )
    return profile

@router.put("/me", response_model=WorkerProfileResponse)
async def update_worker_profile(
    profile_data: WorkerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's worker profile"""
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found"
        )
    
    # Update fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    # Manually update timestamp
    profile.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(profile)
    return profile

@router.patch("/me", response_model=WorkerProfileResponse)
async def patch_worker_profile(
    profile_data: WorkerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Partially update the current user's worker profile"""
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found"
        )
    
    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    # Manually update timestamp
    profile.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(profile)
    return profile
