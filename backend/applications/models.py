# applications/models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import enum
from core.database import Base

class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    SELECTED = "selected"
    PENDING_PAYMENT = "pending_payment"
    ACTIVE = "active"

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False, index=True)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
