# profiles/employer_models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from core.database import Base

class EmployerProfile(Base):
    __tablename__ = "employer_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    # Employer-specific field
    company_name = Column(String, nullable=True)
    
    # Address fields
    street = Column(String, nullable=True)
    house_number = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    # Geolocation for matching
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
    # Matching criteria (String IDs like "CATEGORY_1", "QUAL_2", "ACT_5")
    categories = Column(ARRAY(String), server_default="{}")
    qualifications = Column(ARRAY(String), server_default="{}")
    activities = Column(ARRAY(String), server_default="{}")
    
    # Search radius in km (1-200)
    radius_km = Column(Integer, default=15, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
