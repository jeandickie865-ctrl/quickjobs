# auth/schemas.py
from pydantic import BaseModel, field_validator
from users.schemas import UserResponse
import re

class RegisterRequest(BaseModel):
    email: str  # Changed from EmailStr to str to allow hyphens in domains
    password: str
    role: str  # 'worker' or 'employer'
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        # Custom email validation that allows hyphens in domain names
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email address')
        return v.lower().strip()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
