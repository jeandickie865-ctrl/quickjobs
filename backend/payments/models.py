# payments/models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import enum
from core.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    STRIPE = "stripe"
    CARD = "card"
    PAYPAL = "paypal"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False, index=True)
    
    # Amount in cents (20% commission)
    amount_cents = Column(Integer, nullable=False)
    
    method = Column(SQLEnum(PaymentMethod), default=PaymentMethod.STRIPE, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Stripe specific
    stripe_payment_intent_id = Column(String, nullable=True)
    stripe_client_secret = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
