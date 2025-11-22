# applications/schemas.py
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: UUID

class ApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    worker_id: UUID
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
