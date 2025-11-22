# matches/models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import enum
from core.database import Base

class MatchStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False, unique=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False, index=True)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.PENDING_PAYMENT, nullable=False)
    
    # Legal confirmations
    employer_confirmed = Column(Boolean, default=False, nullable=False)
    worker_confirmed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
