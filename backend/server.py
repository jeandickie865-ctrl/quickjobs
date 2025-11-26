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
    houseNumber: Optional[str] = None  # Added for house number support
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
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    categories: List[str] = []
    selectedTags: List[str] = []
    activities: List[str] = []
    qualifications: List[str] = []
    radiusKm: int = 15
    homeAddress: Address
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    photoUrl: Optional[str] = None
    profilePhotoUri: Optional[str] = None
    shortBio: Optional[str] = None
    # Deprecated fields for backward compatibility
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = []
    pushToken: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class WorkerProfileCreate(BaseModel):
    firstName: str  # Required
    lastName: str   # Required
    phone: str      # Required
    categories: List[str] = []
    selectedTags: List[str] = []
    radiusKm: int = 15
    homeAddress: Optional[Address] = None
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    photoUrl: Optional[str] = None
    profilePhotoUri: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = []
    shortBio: Optional[str] = None
    email: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    pushToken: Optional[str] = None

class WorkerProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    categories: Optional[List[str]] = None
    selectedTags: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    radiusKm: Optional[int] = None
    homeAddress: Optional[Address] = None
    homeLat: Optional[float] = None
    homeLon: Optional[float] = None
    photoUrl: Optional[str] = None
    profilePhotoUri: Optional[str] = None
    shortBio: Optional[str] = None
    # Deprecated fields for backward compatibility
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None
    documents: Optional[List[WorkerDocument]] = None
    pushToken: Optional[str] = None

# Job Models
class Job(BaseModel):
    id: str = Field(default_factory=lambda: f"job_{str(uuid.uuid4())}")
    employerId: str
    employerType: str = "private"  # 'private' or 'business'
    title: str
    description: Optional[str] = None
    category: str
    timeMode: str  # 'fixed_time', 'hour_package', 'project'
    startAt: Optional[str] = None
    endAt: Optional[str] = None
    hours: Optional[float] = None
    dueAt: Optional[str] = None
    address: Address
    lat: Optional[float] = None
    lon: Optional[float] = None
    workerAmountCents: int
    paymentToWorker: str = "cash"  # 'cash', 'bank', 'paypal'
    required_all_tags: List[str] = []
    required_any_tags: List[str] = []
    status: str = "open"  # 'draft', 'open', 'matched', 'done', 'canceled'
    matchedWorkerId: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class JobCreate(BaseModel):
    employerType: str = "private"
    title: str
    description: Optional[str] = None
    category: str
    timeMode: str
    startAt: Optional[str] = None
    endAt: Optional[str] = None
    hours: Optional[float] = None
    dueAt: Optional[str] = None
    address: Address
    lat: Optional[float] = None
    lon: Optional[float] = None
    workerAmountCents: int
    paymentToWorker: str = "cash"
    required_all_tags: List[str] = []
    required_any_tags: List[str] = []
    status: str = "open"

class JobUpdate(BaseModel):
    employerType: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    timeMode: Optional[str] = None
    startAt: Optional[str] = None
    endAt: Optional[str] = None
    hours: Optional[float] = None
    dueAt: Optional[str] = None
    address: Optional[Address] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    workerAmountCents: Optional[int] = None
    paymentToWorker: Optional[str] = None
    required_all_tags: Optional[List[str]] = None
    required_any_tags: Optional[List[str]] = None
    status: Optional[str] = None
    matchedWorkerId: Optional[str] = None

# Application Models
class JobApplication(BaseModel):
    id: str = Field(default_factory=lambda: f"app_{str(uuid.uuid4())}")
    jobId: str
    workerId: str
    employerId: str
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    respondedAt: Optional[str] = None
    status: str = "pending"  # 'pending', 'accepted', 'rejected', 'canceled'
    employerConfirmedLegal: Optional[bool] = None
    workerConfirmedLegal: Optional[bool] = None

class ApplicationCreate(BaseModel):
    jobId: str
    workerId: str
    employerId: str

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    respondedAt: Optional[str] = None
    employerConfirmedLegal: Optional[bool] = None
    workerConfirmedLegal: Optional[bool] = None

# Employer Profile Models
class EmployerProfile(BaseModel):
    userId: str
    firstName: str
    lastName: str
    company: Optional[str] = None
    phone: str
    email: str
    street: str
    houseNumber: Optional[str] = None  # Added for house number support
    postalCode: str
    city: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    paymentMethod: Optional[str] = None  # 'card', 'paypal', None
    shortBio: Optional[str] = None
    profilePhotoUri: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class EmployerProfileCreate(BaseModel):
    firstName: str
    lastName: str
    company: Optional[str] = None
    phone: str
    email: str
    street: str
    houseNumber: Optional[str] = None  # Added for house number support
    postalCode: str
    city: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    paymentMethod: Optional[str] = None
    shortBio: Optional[str] = None
    profilePhotoUri: Optional[str] = None

class EmployerProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    street: Optional[str] = None
    houseNumber: Optional[str] = None  # Added for house number support
    postalCode: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    paymentMethod: Optional[str] = None
    shortBio: Optional[str] = None
    profilePhotoUri: Optional[str] = None

# Review/Rating Models
class Review(BaseModel):
    id: str = Field(default_factory=lambda: f"review_{str(uuid.uuid4())}")
    jobId: str
    workerId: str
    employerId: str
    rating: int  # 1-5
    comment: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ReviewCreate(BaseModel):
    jobId: str
    workerId: str
    employerId: str
    rating: int  # 1-5
    comment: Optional[str] = None

# Chat Message Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: f"msg_{str(uuid.uuid4())}")
    applicationId: str
    senderId: str
    senderRole: str  # 'worker' or 'employer'
    message: str
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    read: bool = False

class ChatMessageCreate(BaseModel):
    applicationId: str
    message: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}

@api_router.get("/geocode")
async def geocode_address(query: str):
    """Proxy for Nominatim/OSM geocoding to avoid CORS issues"""
    import httpx
    
    logger.info(f"Geocoding query: {query}")
    
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={query}&limit=5&addressdetails=1&countrycodes=de"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={'User-Agent': 'ShiftMatchApp/1.0'},
                timeout=10.0
            )
            
            if response.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Found {len(data)} results")
            return data
            
    except httpx.HTTPError as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail="Geocoding service unavailable")

# User Authentication Endpoints
class SignUpRequest(BaseModel):
    email: str
    password: str
    role: str  # 'worker' or 'employer'

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    userId: str
    email: str
    role: str
    token: str

@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """User registration"""
    import hashlib
    
    email = request.email.lower().strip()
    
    # Check if user exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Diese E-Mail-Adresse ist bereits registriert")
    
    # Validate
    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Bitte gültige E-Mail-Adresse eingeben")
    if not request.password or len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen lang sein")
    if request.role not in ['worker', 'employer']:
        raise HTTPException(status_code=400, detail="Rolle muss 'worker' oder 'employer' sein")
    
    # Create userId
    userId = f"user_{email.replace('@', '_').replace('.', '_')}"
    
    # Hash password (simple SHA256 for now)
    password_hash = hashlib.sha256(request.password.encode()).hexdigest()
    
    # Create user
    user_doc = {
        "userId": userId,
        "email": email,
        "password": password_hash,
        "role": request.role,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = f"token_{datetime.utcnow().timestamp()}_{hashlib.md5(email.encode()).hexdigest()[:8]}"
    
    logger.info(f"✅ User registered: {email} as {request.role}")
    
    return AuthResponse(
        userId=userId,
        email=email,
        role=request.role,
        token=token
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """User login"""
    import hashlib
    
    email = request.email.lower().strip()
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Kein Account mit dieser E-Mail gefunden")
    
    # Check password
    password_hash = hashlib.sha256(request.password.encode()).hexdigest()
    if user.get("password") != password_hash:
        raise HTTPException(status_code=401, detail="Falsches Passwort")
    
    # Create token
    token = f"token_{datetime.utcnow().timestamp()}_{hashlib.md5(email.encode()).hexdigest()[:8]}"
    
    logger.info(f"✅ User logged in: {email}")
    
    return AuthResponse(
        userId=user["userId"],
        email=user["email"],
        role=user["role"],
        token=token
    )

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

@api_router.get("/profiles/worker/{user_id}/employer-view")
async def get_worker_profile_for_employer(
    user_id: str,
    application_id: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    Get worker profile with privacy controls for employer view.
    Returns limited data if application is not accepted.
    Returns full data if application is accepted.
    """
    logger.info(f"Fetching worker profile for employer view: {user_id}, application: {application_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    if not requesting_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Find profile
    profile = await db.worker_profiles.find_one({"userId": user_id})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove MongoDB _id field
    profile.pop("_id", None)
    
    # Check if application is accepted
    is_accepted = False
    if application_id:
        application = await db.applications.find_one({"id": application_id})
        if application and application.get("status") == "accepted":
            is_accepted = True
    
    # Return full or limited profile based on acceptance status
    if is_accepted:
        # PHASE B: Full data access for accepted matches
        logger.info(f"Returning full worker profile (accepted match) for {user_id}")
        return {
            "userId": profile.get("userId"),
            "firstName": profile.get("firstName"),
            "lastName": profile.get("lastName"),  # Full last name
            "email": profile.get("email"),  # Visible
            "phone": profile.get("phone"),  # Visible
            "homeAddress": profile.get("homeAddress"),  # Full address visible
            "homeLat": profile.get("homeLat"),
            "homeLon": profile.get("homeLon"),
            "radiusKm": profile.get("radiusKm"),
            "categories": profile.get("categories", []),
            "selectedTags": profile.get("selectedTags", []),
            "activities": profile.get("activities", []),
            "qualifications": profile.get("qualifications", []),
            "shortBio": profile.get("shortBio"),
            "photoUrl": profile.get("photoUrl"),
            "profilePhotoUri": profile.get("profilePhotoUri"),
            "isAcceptedMatch": True
        }
    else:
        # PHASE A: Limited data for non-accepted applications
        logger.info(f"Returning limited worker profile (not accepted) for {user_id}")
        
        # Mask last name (only first letter)
        first_name = profile.get("firstName", "")
        last_name = profile.get("lastName", "")
        masked_last_name = last_name[0] + "." if last_name else ""
        
        return {
            "userId": profile.get("userId"),
            "firstName": first_name,
            "lastName": masked_last_name,  # Only first letter
            "email": None,  # Hidden
            "phone": None,  # Hidden
            "homeAddress": None,  # Hidden
            "homeLat": None,
            "homeLon": None,
            "radiusKm": profile.get("radiusKm"),  # Can be shown (general info)
            "categories": profile.get("categories", []),
            "selectedTags": profile.get("selectedTags", []),
            "activities": profile.get("activities", []),
            "qualifications": profile.get("qualifications", []),
            "shortBio": profile.get("shortBio"),
            "photoUrl": profile.get("photoUrl"),
            "profilePhotoUri": profile.get("profilePhotoUri"),
            "isAcceptedMatch": False
        }

@api_router.put("/profiles/worker/{user_id}", response_model=WorkerProfile)
async def update_worker_profile(
    user_id: str,
    profile_update: WorkerProfileUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update worker profile with validation"""
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
    
    # VALIDATION: Check required fields
    # Merge with existing data for validation
    merged_data = {**existing, **update_data}
    
    # firstName validation
    if not merged_data.get("firstName") or not merged_data["firstName"].strip():
        raise HTTPException(status_code=400, detail="Vorname ist erforderlich")
    
    # lastName validation
    if not merged_data.get("lastName") or not merged_data["lastName"].strip():
        raise HTTPException(status_code=400, detail="Nachname ist erforderlich")
    
    # phone validation
    if not merged_data.get("phone") or not merged_data["phone"].strip():
        raise HTTPException(status_code=400, detail="Telefonnummer ist erforderlich")
    
    # email validation
    if not merged_data.get("email") or not merged_data["email"].strip():
        raise HTTPException(status_code=400, detail="E-Mail ist erforderlich")
    
    # categories validation
    categories = merged_data.get("categories", [])
    if not categories or len(categories) == 0:
        raise HTTPException(status_code=400, detail="Mindestens eine Kategorie muss ausgewählt werden")
    
    # radiusKm validation
    radius = merged_data.get("radiusKm", 0)
    if radius < 1 or radius > 200:
        raise HTTPException(status_code=400, detail="Arbeitsradius muss zwischen 1 und 200 km liegen")
    
    # homeAddress validation
    address = merged_data.get("homeAddress")
    if not address:
        raise HTTPException(status_code=400, detail="Adresse ist erforderlich")
    
    if isinstance(address, dict):
        if not address.get("street") or not address["street"].strip():
            raise HTTPException(status_code=400, detail="Straße ist erforderlich")
        if not address.get("postalCode") or not address["postalCode"].strip():
            raise HTTPException(status_code=400, detail="Postleitzahl ist erforderlich")
        if not address.get("city") or not address["city"].strip():
            raise HTTPException(status_code=400, detail="Stadt ist erforderlich")
        if not address.get("country") or not address["country"].strip():
            raise HTTPException(status_code=400, detail="Land ist erforderlich")
    
    # Add updatedAt timestamp
    update_data["updatedAt"] = datetime.utcnow().isoformat()
    
    # Convert nested Address to dict if needed
    if "homeAddress" in update_data and isinstance(update_data["homeAddress"], Address):
        update_data["homeAddress"] = update_data["homeAddress"].dict()
    
    # Sanitize string fields (trim whitespace)
    if "firstName" in update_data:
        update_data["firstName"] = update_data["firstName"].strip()
    if "lastName" in update_data:
        update_data["lastName"] = update_data["lastName"].strip()
    if "phone" in update_data:
        update_data["phone"] = update_data["phone"].strip()
    if "email" in update_data:
        update_data["email"] = update_data["email"].strip()
    if "shortBio" in update_data and update_data["shortBio"]:
        update_data["shortBio"] = update_data["shortBio"].strip()
    
    # Update in MongoDB
    await db.worker_profiles.update_one(
        {"userId": user_id},
        {"$set": update_data}
    )
    
    # Fetch and return updated profile
    updated_profile = await db.worker_profiles.find_one({"userId": user_id})
    updated_profile.pop("_id", None)
    
    logger.info(f"Worker profile updated successfully for user {user_id}")
    return WorkerProfile(**updated_profile)

# Job Endpoints

@api_router.post("/jobs", response_model=Job)
async def create_job(
    job_data: JobCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new job"""
    logger.info("Creating new job")
    
    employerId = get_user_id_from_token(authorization)
    
    # Create job document
    job_dict = job_data.dict()
    job_dict["id"] = f"job_{str(uuid.uuid4())}"
    job_dict["employerId"] = employerId
    job_dict["createdAt"] = datetime.utcnow().isoformat()
    
    # Convert nested Address to dict if needed
    if isinstance(job_dict.get("address"), Address):
        job_dict["address"] = job_dict["address"].dict()
    
    # Insert into MongoDB
    result = await db.jobs.insert_one(job_dict)
    
    # Fetch and return created job
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    created_job.pop("_id", None)
    
    logger.info(f"Job created: {job_dict['id']} by employer {employerId}")
    return Job(**created_job)

@api_router.get("/jobs/all", response_model=List[Job])
async def get_all_jobs(
    authorization: Optional[str] = Header(None)
):
    """Get ALL jobs (including completed/closed) - needed for worker matches"""
    logger.info("Fetching ALL jobs (including completed)")
    
    # Verify token (optional)
    get_user_id_from_token(authorization)
    
    # Find ALL jobs (no status filter)
    jobs = await db.jobs.find({}).to_list(1000)
    
    # Remove MongoDB _id field
    for job in jobs:
        job.pop("_id", None)
    
    logger.info(f"Found {len(jobs)} total jobs")
    return [Job(**job) for job in jobs]

@api_router.get("/jobs", response_model=List[Job])
async def get_all_open_jobs(
    authorization: Optional[str] = Header(None)
):
    """Get all open jobs"""
    logger.info("Fetching all open jobs")
    
    # Verify token (optional)
    get_user_id_from_token(authorization)
    
    # Find all open jobs
    jobs = await db.jobs.find({"status": "open"}).to_list(1000)
    
    # Remove MongoDB _id field
    for job in jobs:
        job.pop("_id", None)
    
    logger.info(f"Found {len(jobs)} open jobs")
    return [Job(**job) for job in jobs]

@api_router.get("/jobs/employer/{employer_id}", response_model=List[Job])
async def get_employer_jobs(
    employer_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all jobs for a specific employer"""
    logger.info(f"🔍 GET /jobs/employer/{employer_id}")
    logger.info(f"📋 Authorization header: {authorization}")
    
    # Verify token - employer can only see their own jobs
    requesting_user = get_user_id_from_token(authorization)
    logger.info(f"👤 Requesting user from token: '{requesting_user}'")
    logger.info(f"🎯 Employer ID from URL: '{employer_id}'")
    logger.info(f"✅ Match: {requesting_user == employer_id}")
    
    if requesting_user != employer_id:
        logger.error(f"❌ 403 FORBIDDEN: User '{requesting_user}' tried to access jobs of employer '{employer_id}'")
        raise HTTPException(status_code=403, detail="Cannot view another employer's jobs")
    
    # Find all jobs for this employer
    jobs = await db.jobs.find({"employerId": employer_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for job in jobs:
        job.pop("_id", None)
    
    logger.info(f"Found {len(jobs)} jobs for employer {employer_id}")
    return [Job(**job) for job in jobs]

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(
    job_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get a specific job by ID"""
    logger.info(f"Fetching job {job_id}")
    
    # Verify token (optional)
    get_user_id_from_token(authorization)
    
    # Find job
    job = await db.jobs.find_one({"id": job_id})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.pop("_id", None)
    
    logger.info(f"Job {job_id} found")
    return Job(**job)

@api_router.put("/jobs/{job_id}", response_model=Job)
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update a job"""
    logger.info(f"Updating job {job_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Check if job exists and user is the owner
    existing = await db.jobs.find_one({"id": job_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if existing.get("employerId") != requesting_user:
        raise HTTPException(status_code=403, detail="Cannot update another employer's job")
    
    # Prepare update data (only include non-None fields)
    update_data = job_update.dict(exclude_none=True)
    
    if not update_data:
        # No fields to update
        existing.pop("_id", None)
        return Job(**existing)
    
    # Convert nested Address to dict if needed
    if "address" in update_data and isinstance(update_data["address"], Address):
        update_data["address"] = update_data["address"].dict()
    
    # Update in MongoDB
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": update_data}
    )
    
    # Fetch and return updated job
    updated_job = await db.jobs.find_one({"id": job_id})
    updated_job.pop("_id", None)
    
    logger.info(f"Job {job_id} updated")
    return Job(**updated_job)

@api_router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    authorization: Optional[str] = Header(None)
):
    """Delete a job"""
    logger.info(f"Deleting job {job_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Check if job exists and user is the owner
    existing = await db.jobs.find_one({"id": job_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if existing.get("employerId") != requesting_user:
        raise HTTPException(status_code=403, detail="Cannot delete another employer's job")
    
    # Delete from MongoDB
    await db.jobs.delete_one({"id": job_id})
    
    logger.info(f"Job {job_id} deleted")
    return {"message": "Job deleted successfully"}

# Application Endpoints

@api_router.post("/applications", response_model=JobApplication)
async def create_application(
    app_data: ApplicationCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new job application"""
    logger.info(f"Creating application: worker {app_data.workerId} -> job {app_data.jobId}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Worker can only apply for themselves
    if requesting_user != app_data.workerId:
        raise HTTPException(status_code=403, detail="Cannot apply on behalf of another worker")
    
    # Check if application already exists
    existing = await db.applications.find_one({
        "jobId": app_data.jobId,
        "workerId": app_data.workerId
    })
    
    if existing:
        logger.info(f"Application already exists: {existing.get('id')}")
        existing.pop("_id", None)
        return JobApplication(**existing)
    
    # Create application document
    app_dict = app_data.dict()
    app_dict["id"] = f"app_{str(uuid.uuid4())}"
    app_dict["createdAt"] = datetime.utcnow().isoformat()
    app_dict["status"] = "pending"
    
    # Insert into MongoDB
    result = await db.applications.insert_one(app_dict)
    
    # Fetch and return created application
    created_app = await db.applications.find_one({"_id": result.inserted_id})
    created_app.pop("_id", None)
    
    logger.info(f"Application created: {app_dict['id']}")
    return JobApplication(**created_app)

@api_router.get("/applications/job/{job_id}", response_model=List[JobApplication])
async def get_applications_for_job(
    job_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all applications for a specific job"""
    logger.info(f"Fetching applications for job {job_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Check if job exists and user is the employer
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.get("employerId") != requesting_user:
        raise HTTPException(status_code=403, detail="Cannot view applications for another employer's job")
    
    # Find all applications for this job
    applications = await db.applications.find({"jobId": job_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for job {job_id}")
    return [JobApplication(**app) for app in applications]

@api_router.get("/applications/worker/{worker_id}", response_model=List[JobApplication])
async def get_applications_for_worker(
    worker_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all applications for a specific worker"""
    logger.info(f"Fetching applications for worker {worker_id}")
    
    # Verify token - worker can only see their own applications
    requesting_user = get_user_id_from_token(authorization)
    if requesting_user != worker_id:
        raise HTTPException(status_code=403, detail="Cannot view another worker's applications")
    
    # Find all applications for this worker
    applications = await db.applications.find({"workerId": worker_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for worker {worker_id}")
    return [JobApplication(**app) for app in applications]

@api_router.get("/applications/employer/{employer_id}", response_model=List[JobApplication])
async def get_applications_for_employer(
    employer_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all applications for all jobs of a specific employer"""
    logger.info(f"Fetching applications for employer {employer_id}")
    
    # Verify token - employer can only see their own applications
    requesting_user = get_user_id_from_token(authorization)
    if requesting_user != employer_id:
        raise HTTPException(status_code=403, detail="Cannot view another employer's applications")
    
    # Find all applications for this employer
    applications = await db.applications.find({"employerId": employer_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for employer {employer_id}")
    return [JobApplication(**app) for app in applications]

@api_router.get("/applications/{application_id}", response_model=JobApplication)
async def get_application(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get a specific application by ID"""
    logger.info(f"Fetching application {application_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the worker or employer
    if requesting_user not in [application.get("workerId"), application.get("employerId")]:
        raise HTTPException(status_code=403, detail="Cannot view this application")
    
    application.pop("_id", None)
    
    logger.info(f"Application {application_id} found")
    return JobApplication(**application)

@api_router.put("/applications/{application_id}/accept", response_model=JobApplication)
async def accept_application(
    application_id: str,
    employer_confirmed_legal: bool = True,
    authorization: Optional[str] = Header(None)
):
    """Accept an application and reject all other pending applications for the same job"""
    logger.info(f"Accepting application {application_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer
    if requesting_user != application.get("employerId"):
        raise HTTPException(status_code=403, detail="Only the employer can accept applications")
    
    # Update this application to accepted
    now = datetime.utcnow().isoformat()
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": "accepted",
            "respondedAt": now,
            "employerConfirmedLegal": employer_confirmed_legal,
            "workerConfirmedLegal": False
        }}
    )
    
    # Reject all other pending applications for the same job
    job_id = application.get("jobId")
    await db.applications.update_many(
        {
            "jobId": job_id,
            "id": {"$ne": application_id},
            "status": "pending"
        },
        {"$set": {"status": "rejected"}}
    )
    
    # Update job status to matched
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {
            "status": "matched",
            "matchedWorkerId": application.get("workerId")
        }}
    )
    
    # Fetch and return updated application
    updated_app = await db.applications.find_one({"id": application_id})
    updated_app.pop("_id", None)
    
    logger.info(f"Application {application_id} accepted, job {job_id} matched")
    return JobApplication(**updated_app)

@api_router.put("/applications/{application_id}", response_model=JobApplication)
async def update_application(
    application_id: str,
    app_update: ApplicationUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update an application (e.g., set legal confirmations)"""
    logger.info(f"Updating application {application_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Find application
    existing = await db.applications.find_one({"id": application_id})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the worker or employer
    if requesting_user not in [existing.get("workerId"), existing.get("employerId")]:
        raise HTTPException(status_code=403, detail="Cannot update this application")
    
    # Prepare update data (only include non-None fields)
    update_data = app_update.dict(exclude_none=True)
    
    if not update_data:
        # No fields to update
        existing.pop("_id", None)
        return JobApplication(**existing)
    
    # Update in MongoDB
    await db.applications.update_one(
        {"id": application_id},
        {"$set": update_data}
    )
    
    # Fetch and return updated application
    updated_app = await db.applications.find_one({"id": application_id})
    updated_app.pop("_id", None)
    
    logger.info(f"Application {application_id} updated")
    return JobApplication(**updated_app)

# Employer Profile Endpoints

@api_router.post("/profiles/employer", response_model=EmployerProfile)
async def create_employer_profile(
    profile_data: EmployerProfileCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new employer profile"""
    logger.info("Creating employer profile")
    
    userId = get_user_id_from_token(authorization)
    
    # Check if profile already exists
    existing = await db.employer_profiles.find_one({"userId": userId})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Create profile document
    now = datetime.utcnow().isoformat()
    profile_dict = profile_data.dict()
    profile_dict["userId"] = userId
    profile_dict["createdAt"] = now
    profile_dict["updatedAt"] = now
    
    # Insert into MongoDB
    result = await db.employer_profiles.insert_one(profile_dict)
    
    # Fetch and return created profile
    created_profile = await db.employer_profiles.find_one({"_id": result.inserted_id})
    created_profile.pop("_id", None)
    
    logger.info(f"Employer profile created for user {userId}")
    return EmployerProfile(**created_profile)

@api_router.get("/profiles/employer/{user_id}", response_model=EmployerProfile)
async def get_employer_profile(
    user_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get employer profile by userId"""
    logger.info(f"Fetching employer profile for user {user_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # SECURITY FIX: Only allow access to own profile
    if requesting_user != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only access your own profile")
    
    # Find profile
    profile = await db.employer_profiles.find_one({"userId": user_id})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove MongoDB _id field
    profile.pop("_id", None)
    
    logger.info(f"Employer profile found for user {user_id}")
    return EmployerProfile(**profile)

@api_router.put("/profiles/employer/{user_id}", response_model=EmployerProfile)
async def update_employer_profile(
    user_id: str,
    profile_update: EmployerProfileUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update employer profile"""
    logger.info(f"Updating employer profile for user {user_id}")
    
    # Verify token - user can only update their own profile
    requesting_user = get_user_id_from_token(authorization)
    if requesting_user != user_id:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    
    # Check if profile exists
    existing = await db.employer_profiles.find_one({"userId": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Prepare update data (only include non-None fields)
    update_data = profile_update.dict(exclude_none=True)
    
    if not update_data:
        # No fields to update
        existing.pop("_id", None)
        return EmployerProfile(**existing)
    
    # Add updatedAt timestamp
    update_data["updatedAt"] = datetime.utcnow().isoformat()
    
    # Update in MongoDB
    await db.employer_profiles.update_one(
        {"userId": user_id},
        {"$set": update_data}
    )
    
    # Fetch and return updated profile
    updated_profile = await db.employer_profiles.find_one({"userId": user_id})
    updated_profile.pop("_id", None)
    
    logger.info(f"Employer profile updated for user {user_id}")
    return EmployerProfile(**updated_profile)

# Review/Rating Endpoints

@api_router.post("/reviews", response_model=Review)
async def create_review(
    review_data: ReviewCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new review/rating"""
    logger.info(f"Creating review for job {review_data.jobId}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # User must be either the worker or employer to create a review
    if requesting_user not in [review_data.workerId, review_data.employerId]:
        raise HTTPException(status_code=403, detail="Cannot create review for another user")
    
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if review already exists for this combination
    existing = await db.reviews.find_one({
        "jobId": review_data.jobId,
        "workerId": review_data.workerId,
        "employerId": review_data.employerId
    })
    
    if existing:
        # Update existing review
        logger.info(f"Review already exists, updating: {existing.get('id')}")
        await db.reviews.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "rating": review_data.rating,
                "comment": review_data.comment,
                "createdAt": datetime.utcnow().isoformat()
            }}
        )
        updated_review = await db.reviews.find_one({"_id": existing["_id"]})
        updated_review.pop("_id", None)
        return Review(**updated_review)
    
    # Create new review
    review_dict = review_data.dict()
    review_dict["id"] = f"review_{str(uuid.uuid4())}"
    review_dict["createdAt"] = datetime.utcnow().isoformat()
    
    # Insert into MongoDB
    result = await db.reviews.insert_one(review_dict)
    
    # Fetch and return created review
    created_review = await db.reviews.find_one({"_id": result.inserted_id})
    created_review.pop("_id", None)
    
    logger.info(f"Review created: {review_dict['id']}")
    return Review(**created_review)

@api_router.get("/reviews/worker/{worker_id}", response_model=List[Review])
async def get_reviews_for_worker(
    worker_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all reviews for a specific worker"""
    logger.info(f"Fetching reviews for worker {worker_id}")
    
    # Verify token (optional - reviews are semi-public)
    get_user_id_from_token(authorization)
    
    # Find all reviews for this worker
    reviews = await db.reviews.find({"workerId": worker_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for review in reviews:
        review.pop("_id", None)
    
    logger.info(f"Found {len(reviews)} reviews for worker {worker_id}")
    return [Review(**review) for review in reviews]

@api_router.get("/reviews/employer/{employer_id}", response_model=List[Review])
async def get_reviews_for_employer(
    employer_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all reviews for a specific employer"""
    logger.info(f"Fetching reviews for employer {employer_id}")
    
    # Verify token (optional - reviews are semi-public)
    get_user_id_from_token(authorization)
    
    # Find all reviews for this employer
    reviews = await db.reviews.find({"employerId": employer_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for review in reviews:
        review.pop("_id", None)
    
    logger.info(f"Found {len(reviews)} reviews for employer {employer_id}")
    return [Review(**review) for review in reviews]

# Chat Message Endpoints

@api_router.post("/chat/messages", response_model=ChatMessage)
async def send_message(
    message_data: ChatMessageCreate,
    authorization: Optional[str] = Header(None)
):
    """Send a chat message"""
    logger.info(f"Sending message for application {message_data.applicationId}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Get application to verify user is part of it
    application = await db.applications.find_one({"id": message_data.applicationId})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # User must be either the worker or employer
    if requesting_user not in [application.get("workerId"), application.get("employerId")]:
        raise HTTPException(status_code=403, detail="Cannot send message for this application")
    
    # Determine sender role
    sender_role = "worker" if requesting_user == application.get("workerId") else "employer"
    
    # Create message
    message_dict = {
        "id": f"msg_{str(uuid.uuid4())}",
        "applicationId": message_data.applicationId,
        "senderId": requesting_user,
        "senderRole": sender_role,
        "message": message_data.message,
        "createdAt": datetime.utcnow().isoformat(),
        "read": False
    }
    
    # Insert into MongoDB
    result = await db.chat_messages.insert_one(message_dict)
    
    # Fetch and return created message
    created_message = await db.chat_messages.find_one({"_id": result.inserted_id})
    created_message.pop("_id", None)
    
    logger.info(f"Message sent: {message_dict['id']}")
    return ChatMessage(**created_message)

@api_router.get("/chat/messages/{application_id}", response_model=List[ChatMessage])
async def get_messages(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all messages for an application"""
    logger.info(f"Fetching messages for application {application_id}")
    
    # Verify token
    requesting_user = get_user_id_from_token(authorization)
    
    # Get application to verify user is part of it
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # User must be either the worker or employer
    if requesting_user not in [application.get("workerId"), application.get("employerId")]:
        raise HTTPException(status_code=403, detail="Cannot view messages for this application")
    
    # Find all messages for this application, sorted by createdAt
    messages = await db.chat_messages.find({"applicationId": application_id}).sort("createdAt", 1).to_list(1000)
    
    # Mark messages as read if they are from the other person
    sender_role = "worker" if requesting_user == application.get("workerId") else "employer"
    other_role = "employer" if sender_role == "worker" else "worker"
    
    for msg in messages:
        if msg.get("senderRole") == other_role and not msg.get("read"):
            await db.chat_messages.update_one(
                {"_id": msg["_id"]},
                {"$set": {"read": True}}
            )
            msg["read"] = True
    
    # Remove MongoDB _id field
    for msg in messages:
        msg.pop("_id", None)
    
    logger.info(f"Found {len(messages)} messages for application {application_id}")
    return [ChatMessage(**msg) for msg in messages]

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
