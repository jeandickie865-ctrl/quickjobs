# jobs/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = []
    qualifications: List[str] = []

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None

class JobResponse(BaseModel):
    id: UUID
    employer_id: UUID
    title: str
    description: Optional[str]
    street: Optional[str]
    postal_code: Optional[str]
    city: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    categories: List[str]
    qualifications: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
