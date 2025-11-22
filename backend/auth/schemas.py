# auth/schemas.py
from pydantic import BaseModel, EmailStr
from users.schemas import UserResponse

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # 'worker' or 'employer'

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
