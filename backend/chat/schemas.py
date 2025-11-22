# chat/schemas.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class MessageCreate(BaseModel):
    text: str

class MessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: UUID
    match_id: UUID
    created_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True
