# matches/schemas.py
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MatchCreate(BaseModel):
    application_id: UUID

class MatchResponse(BaseModel):
    id: UUID
    application_id: UUID
    job_id: UUID
    employer_id: UUID
    worker_id: UUID
    status: str
    employer_confirmed: bool
    worker_confirmed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MatchWithDetailsResponse(BaseModel):
    id: UUID
    application_id: UUID
    job_id: UUID
    employer_id: UUID
    worker_id: UUID
    status: str
    employer_confirmed: bool
    worker_confirmed: bool
    created_at: datetime
    updated_at: datetime
    job: Optional[dict] = None
    worker: Optional[dict] = None
    employer: Optional[dict] = None
    chat_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class LegalConfirmationRequest(BaseModel):
    confirmed: bool
