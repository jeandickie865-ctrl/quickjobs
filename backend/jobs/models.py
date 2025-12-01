# jobs/models.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from core.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Job details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Address fields
    street = Column(String, nullable=True)
    house_number = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    # Geolocation for matching
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    
    # Matching criteria (String IDs like "CATEGORY_1", "QUAL_2")
    categories = Column(ARRAY(String), server_default="{}")
    qualifications = Column(ARRAY(String), server_default="{}")
    
    # Time fields
    date = Column(String, nullable=True)
    start_at = Column(String, nullable=True)
    end_at = Column(String, nullable=True)
    time_mode = Column(String, nullable=True, default='fixed_time')
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
