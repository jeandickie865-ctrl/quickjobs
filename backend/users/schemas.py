# users/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True
