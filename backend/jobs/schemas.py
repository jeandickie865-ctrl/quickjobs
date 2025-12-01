# jobs/schemas.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class JobCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('title must not be empty')
        return v.strip()
    
    @field_validator('lon')
    @classmethod
    def validate_coordinates(cls, v, info):
        lat = info.data.get('lat')
        # Both must be set or both must be None
        if (lat is None and v is not None) or (lat is not None and v is None):
            raise ValueError('lat and lon must both be set or both be None')
        return v

class JobUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    categories: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError('title must not be empty')
        return v.strip() if v else None

class JobResponse(BaseModel):
    id: UUID
    employer_id: UUID
    title: str
    description: Optional[str]
    street: Optional[str]
    house_number: Optional[str]
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
