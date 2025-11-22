# profiles/employer_models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, ARRAY, Integer
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base

class EmployerProfile(Base):
    __tablename__ = "employer_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String, nullable=True)
    street = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    categories = Column(ARRAY(String), default=[])
    qualifications = Column(ARRAY(String), default=[])
    activities = Column(ARRAY(String), default=[])
    radius_km = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
