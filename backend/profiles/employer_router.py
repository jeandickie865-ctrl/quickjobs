# profiles/employer_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from core.database import get_db
from core.security import get_current_user
from users.models import User
from profiles.employer_models import EmployerProfile
from profiles.schemas import EmployerProfileCreate, EmployerProfileUpdate, EmployerProfileResponse

router = APIRouter()

@router.post("", response_model=EmployerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_employer_profile(
    profile_data: EmployerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if profile already exists
    result = await db.execute(
        select(EmployerProfile).where(EmployerProfile.user_id == current_user.id)
    )
    existing_profile = result.scalar_one_or_none()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employer profile already exists"
        )
    
    profile = EmployerProfile(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **profile_data.dict()
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return EmployerProfileResponse.from_orm(profile)

@router.get("/me", response_model=EmployerProfileResponse)
async def get_my_employer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EmployerProfile).where(EmployerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    return EmployerProfileResponse.from_orm(profile)

@router.patch("/me", response_model=EmployerProfileResponse)
async def update_employer_profile(
    profile_data: EmployerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EmployerProfile).where(EmployerProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    await db.commit()
    await db.refresh(profile)
    return EmployerProfileResponse.from_orm(profile)
