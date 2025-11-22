# profiles/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class EmployerProfileCreate(BaseModel):
    company_name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = []
    qualifications: List[str] = []
    activities: List[str] = []
    radius_km: int = 15

class EmployerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    radius_km: Optional[int] = None

class EmployerProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_name: Optional[str]
    street: Optional[str]
    postal_code: Optional[str]
    city: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    categories: List[str]
    qualifications: List[str]
    activities: List[str]
    radius_km: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WorkerProfileCreate(BaseModel):
    name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = []
    qualifications: List[str] = []
    activities: List[str] = []
    radius_km: int = 15

class WorkerProfileUpdate(BaseModel):
    name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    radius_km: Optional[int] = None

class WorkerProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: Optional[str]
    street: Optional[str]
    postal_code: Optional[str]
    city: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    categories: List[str]
    qualifications: List[str]
    activities: List[str]
    radius_km: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
