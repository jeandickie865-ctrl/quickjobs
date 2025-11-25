from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Worker Profile Models
class Address(BaseModel):
    street: Optional[str] = None
    postalCode: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "DE"

class WorkerDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    fileUri: str
    fileName: str
    uploadedAt: str
    mimeType: Optional[str] = None

class WorkerProfile(BaseModel):
    userId: str
    categories: List[str] = []
    selectedTags: List[str] = []
    radiusKm: int = 15
    homeAddress: Address
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    profilePhotoUri: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = []
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    shortBio: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    pushToken: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class WorkerProfileCreate(BaseModel):
    categories: List[str] = []
    selectedTags: List[str] = []
    radiusKm: int = 15
    homeAddress: Address
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    profilePhotoUri: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = []
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    shortBio: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    pushToken: Optional[str] = None

class WorkerProfileUpdate(BaseModel):
    categories: Optional[List[str]] = None
    selectedTags: Optional[List[str]] = None
    radiusKm: Optional[int] = None
    homeAddress: Optional[Address] = None
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    profilePhotoUri: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    shortBio: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    pushToken: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Helper: Get userId from Authorization header (simplified for MVP)
def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Simple token format: "Bearer {userId}"
    # In production, this should be a proper JWT token
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    return parts[1]

# Worker Profile Endpoints

@api_router.post("/profiles/worker", response_model=WorkerProfile)
async def create_worker_profile(
    profile_data: WorkerProfileCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new worker profile"""
    logger.info("Creating worker profile")
    
    userId = get_user_id_from_token(authorization)
    
    # Check if profile already exists
    existing = await db.worker_profiles.find_one({"userId": userId})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Create profile document
    now = datetime.utcnow().isoformat()
    profile_dict = profile_data.dict()
    profile_dict["userId"] = userId
    profile_dict["createdAt"] = now
    profile_dict["updatedAt"] = now
    
    # Convert nested Address to dict if needed
    if isinstance(profile_dict.get("homeAddress"), Address):
        profile_dict["homeAddress"] = profile_dict["homeAddress"].dict()
    
    # Insert into MongoDB
    result = await db.worker_profiles.insert_one(profile_dict)
    
    # Fetch and return created profile
    created_profile = await db.worker_profiles.find_one({"_id": result.inserted_id})
    created_profile["userId"] = created_profile.pop("userId", userId)
    
    logger.info(f"Worker profile created for user {userId}")
    return WorkerProfile(**created_profile)

@api_router.get("/profiles/worker/{user_id}", response_model=WorkerProfile)
async def get_worker_profile(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get worker profile by userId"""
    logger.info(f"Fetching worker profile for user {user_id}")
    
    # Verify token (optional: check if requester is the same user)
    requesting_user = get_user_id_from_token(authorization)
    
    # Find profile
    profile = await db.worker_profiles.find_one({"userId": user_id})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove MongoDB _id field
    profile.pop("_id", None)
    
    logger.info(f"Worker profile found for user {user_id}")
    return WorkerProfile(**profile)

@api_router.put("/profiles/worker/{user_id}", response_model=WorkerProfile)
async def update_worker_profile(
    user_id: str,
    profile_update: WorkerProfileUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update worker profile"""
    logger.info(f"Updating worker profile for user {user_id}")
    
    # Verify token - user can only update their own profile
    requesting_user = get_user_id_from_token(authorization)
    if requesting_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    
    # Check if profile exists
    existing = await db.worker_profiles.find_one({"userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Prepare update data (only include non-None fields)
    update_data = profile_update.dict(exclude_none=True)
    
    if not update_data:
        # No fields to update
        existing.pop("_id", None)
        return WorkerProfile(**existing)
    
    # Add updatedAt timestamp
    update_data["updatedAt"] = datetime.utcnow().isoformat()
    
    # Convert nested Address to dict if needed
    if "homeAddress" in update_data and isinstance(update_data["homeAddress"], Address):
        update_data["homeAddress"] = update_data["homeAddress"].dict()
    
    # Update in MongoDB
    await db.worker_profiles.update_one(
        {"userId": user_id},
        {"$set": update_data}
    )
    
    # Fetch and return updated profile
    updated_profile = await db.worker_profiles.find_one({"userId": user_id})
    updated_profile.pop("_id", None)
    
    logger.info(f"Worker profile updated for user {user_id}")
    return WorkerProfile(**updated_profile)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
