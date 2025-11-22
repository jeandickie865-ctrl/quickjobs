# profiles/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# =====================
# EMPLOYER PROFILE SCHEMAS
# =====================

class EmployerProfileCreate(BaseModel):
    company_name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    activities: List[str] = Field(default_factory=list)
    radius_km: int = Field(default=15, ge=1, le=200)
    
    @field_validator('radius_km')
    @classmethod
    def validate_radius(cls, v):
        if v < 1 or v > 200:
            raise ValueError('radius_km must be between 1 and 200')
        return v

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
    radius_km: Optional[int] = Field(default=None, ge=1, le=200)
    
    @field_validator('radius_km')
    @classmethod
    def validate_radius(cls, v):
        if v is not None and (v < 1 or v > 200):
            raise ValueError('radius_km must be between 1 and 200')
        return v

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
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# =====================
# WORKER PROFILE SCHEMAS
# =====================

class WorkerProfileCreate(BaseModel):
    name: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    activities: List[str] = Field(default_factory=list)
    radius_km: int = Field(default=15, ge=1, le=200)
    photo_url: Optional[str] = None
    
    @field_validator('radius_km')
    @classmethod
    def validate_radius(cls, v):
        if v < 1 or v > 200:
            raise ValueError('radius_km must be between 1 and 200')
        return v

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
    radius_km: Optional[int] = Field(default=None, ge=1, le=200)
    photo_url: Optional[str] = None
    
    @field_validator('radius_km')
    @classmethod
    def validate_radius(cls, v):
        if v is not None and (v < 1 or v > 200):
            raise ValueError('radius_km must be between 1 and 200')
        return v

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
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
