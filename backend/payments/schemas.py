# payments/schemas.py
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class PaymentIntentCreate(BaseModel):
    match_id: UUID
    amount_cents: int

class PaymentIntentResponse(BaseModel):
    payment_id: UUID
    client_secret: str
    amount_cents: int
    
class PaymentResponse(BaseModel):
    id: UUID
    match_id: UUID
    amount_cents: int
    method: str
    status: str
    stripe_payment_intent_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StripeWebhookEvent(BaseModel):
    type: str
    data: dict
