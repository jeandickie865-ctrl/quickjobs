# auth/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from core.security import verify_password, get_password_hash, create_access_token
from users.models import User, UserRole
import uuid

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

async def create_user(db: AsyncSession, email: str, password: str, role: str) -> User:
    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=get_password_hash(password),
        role=UserRole(role)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

def create_token(user_id: uuid.UUID) -> str:
    return create_access_token(data={"sub": str(user_id)})
