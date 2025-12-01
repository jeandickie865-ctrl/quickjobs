from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid
from datetime import datetime

# Import matching service
from matching_service import match_worker_with_job
import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# Configure logging BEFORE FastAPI is created
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("shiftmatch")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Load taxonomy.json for validation
TAXONOMY = json.loads((ROOT_DIR / "taxonomy.json").read_text())

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ===== JOB CLEANUP FUNCTION =====
async def cleanup_old_jobs():
    """
    Löscht alle Jobs, deren Datum in der Vergangenheit liegt.
    Löscht auch zugehörige Applications und ChatMessages.
    """
    try:
        now = datetime.utcnow()
        
        # Finde alle Jobs, deren startAt, endAt oder dueAt in der Vergangenheit liegen
        old_jobs = await db.jobs.find({
            "$or": [
                {"startAt": {"$lt": now.isoformat()}},
                {"endAt": {"$lt": now.isoformat()}},
                {"dueAt": {"$lt": now.isoformat()}}
            ]
        }).to_list(length=None)
        
        if not old_jobs:
            logger.info("🧹 Cleanup: Keine alten Jobs gefunden")
            return
        
        old_job_ids = [job["id"] for job in old_jobs]
        logger.info(f"🧹 Cleanup: {len(old_job_ids)} alte Jobs gefunden")
        
        # Lösche zugehörige Applications
        app_result = await db.applications.delete_many({"jobId": {"$in": old_job_ids}})
        logger.info(f"🧹 Cleanup: {app_result.deleted_count} Applications gelöscht")
        
        # Lösche zugehörige ChatMessages
        chat_result = await db.chat_messages.delete_many({"applicationId": {"$in": old_job_ids}})
        logger.info(f"🧹 Cleanup: {chat_result.deleted_count} ChatMessages gelöscht")
        
        # Lösche die Jobs selbst
        job_result = await db.jobs.delete_many({"id": {"$in": old_job_ids}})
        logger.info(f"🧹 Cleanup: {job_result.deleted_count} Jobs gelöscht")
        
    except Exception as e:
        logger.error(f"🧹 Cleanup Error: {e}")


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
    isSelfEmployed: bool = False  # NEU: Selbstständig / Gewerbe
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
    timeMode: str = "fixed_time"  # Nur fixed_time erlaubt
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
    
    @field_validator('timeMode')
    @classmethod
    def validate_timemode(cls, v):
        if v != 'fixed_time':
            raise ValueError('timeMode must be "fixed_time"')
        return v
    
    @field_validator('startAt')
    @classmethod
    def validate_startat(cls, v):
        if not v:
            raise ValueError('startAt is required')
        try:
            start_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            now = datetime.utcnow()
            if start_dt < now:
                raise ValueError('startAt must be in the future')
        except ValueError as e:
            if 'Invalid isoformat' in str(e):
                raise ValueError('startAt must be a valid ISO format datetime')
            raise
        return v
    
    @field_validator('endAt')
    @classmethod
    def validate_endat(cls, v, info):
        if not v:
            raise ValueError('endAt is required')
        start_at = info.data.get('startAt')
        if start_at:
            try:
                start_dt = datetime.fromisoformat(start_at.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                if end_dt <= start_dt:
                    raise ValueError('endAt must be after startAt')
            except ValueError as e:
                if 'Invalid isoformat' in str(e):
                    raise ValueError('endAt must be a valid ISO format datetime')
                raise
        return v

class JobUpdate(BaseModel):
    employerType: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    timeMode: Optional[str] = "fixed_time"  # Nur fixed_time erlaubt
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
    
    @field_validator('timeMode')
    @classmethod
    def validate_timemode(cls, v):
        if v is not None and v != 'fixed_time':
            raise ValueError('timeMode must be "fixed_time"')
        return v
    
    @field_validator('startAt')
    @classmethod
    def validate_startat(cls, v):
        if v is not None:
            try:
                start_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                now = datetime.utcnow()
                if start_dt < now:
                    raise ValueError('startAt must be in the future')
            except ValueError as e:
                if 'Invalid isoformat' in str(e):
                    raise ValueError('startAt must be a valid ISO format datetime')
                raise
        return v
    
    @field_validator('endAt')
    @classmethod
    def validate_endat(cls, v, info):
        if v is not None:
            start_at = info.data.get('startAt')
            if start_at:
                try:
                    start_dt = datetime.fromisoformat(start_at.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                    if end_dt <= start_dt:
                        raise ValueError('endAt must be after startAt')
                except ValueError as e:
                    if 'Invalid isoformat' in str(e):
                        raise ValueError('endAt must be a valid ISO format datetime')
                    raise
        return v

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
    isPaid: bool = False  # NEU: Bezahlt-Status
    chatUnlocked: bool = False  # NEU: Chat-Freischaltung
    paidAt: Optional[str] = None  # NEU: Zahlungszeitpunkt
    paymentStatus: str = "pending"  # NEU: "pending" | "paid"
    registrationType: str = "none"  # NEU: "none" | "official" | "informal"
    officialRegistrationStatus: str = "none"  # NEU: "none" | "requested" | "completed" | "denied"

class ApplicationCreate(BaseModel):
    jobId: str
    # workerId is set from token, not from request body
    # employerId is set from job, not from request body

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    respondedAt: Optional[str] = None
    employerConfirmedLegal: Optional[bool] = None
    workerConfirmedLegal: Optional[bool] = None


# Official Registration Models
class WorkerOfficialDataAddress(BaseModel):
    street: str
    houseNumber: str
    postalCode: str
    city: str
    country: str

class WorkerOfficialDataWorkPermit(BaseModel):
    required: bool
    fileUrl: Optional[str] = None

class WorkerOfficialData(BaseModel):
    id: str = Field(default_factory=lambda: f"wod_{uuid.uuid4().hex[:12]}")
    workerId: str
    applicationId: str
    birthDate: str
    address: WorkerOfficialDataAddress
    taxId: str
    healthInsurance: str
    iban: str
    nationality: str
    workPermit: WorkerOfficialDataWorkPermit
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class OfficialRegistrationRequest(BaseModel):
    decision: str  # "accept" | "deny"
    workerOfficialData: Optional[WorkerOfficialData] = None

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


# Official Registration Models
class OfficialRegistration(BaseModel):
    id: str = Field(default_factory=lambda: f"reg_{str(uuid.uuid4())}")
    applicationId: str
    employerId: str
    workerId: str
    registrationType: str  # 'kurzfristig' or 'minijob'
    status: str = "pending"  # 'pending' or 'completed'
    contractUrl: Optional[str] = None
    sofortmeldungUrl: Optional[str] = None
    steuerId: Optional[str] = None
    krankenkasse: Optional[str] = None
    geburtsdatum: Optional[str] = None
    sozialversicherungsnummer: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class OfficialRegistrationCreate(BaseModel):
    applicationId: str
    employerId: str
    workerId: str
    registrationType: str  # 'kurzfristig' or 'minijob'
    steuerId: Optional[str] = None
    krankenkasse: Optional[str] = None
    geburtsdatum: Optional[str] = None
    sozialversicherungsnummer: Optional[str] = None

class OfficialRegistrationUpdate(BaseModel):
    status: Optional[str] = None
    contractUrl: Optional[str] = None
    sofortmeldungUrl: Optional[str] = None
    steuerId: Optional[str] = None
    krankenkasse: Optional[str] = None
    geburtsdatum: Optional[str] = None
    sozialversicherungsnummer: Optional[str] = None
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# Chat Message Models
class ChatMessage(BaseModel):
    id: str | None = None
    applicationId: str
    senderId: str | None = None
    senderRole: str | None = None
    text: str | None = None
    createdAt: str | None = None
    timestamp: datetime | None = None
    read: bool = False
    
    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    applicationId: str
    text: str

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
    
    # Store token in database with userId mapping
    await db.tokens.update_one(
        {"token": token},
        {"$set": {"token": token, "userId": userId, "createdAt": datetime.utcnow().isoformat()}},
        upsert=True
    )
    
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
    
    # Store token in database with userId mapping
    await db.tokens.update_one(
        {"token": token},
        {"$set": {"token": token, "userId": user["userId"], "createdAt": datetime.utcnow().isoformat()}},
        upsert=True
    )
    
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
async def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Token format: "Bearer {token}"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = parts[1]
    
    # Look up token in database
    token_doc = await db.tokens.find_one({"token": token})
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return token_doc["userId"]

# ==========================
#   TAXONOMY VALIDATION
# ==========================

def validate_category(category: str):
    """Validate that a category exists in taxonomy.json"""
    if category not in TAXONOMY:
        raise HTTPException(status_code=422, detail=f"INVALID_CATEGORY: {category}")

def get_valid_tag_values(category: str) -> set:
    """Get all valid tag values (required + optional) for a category"""
    cat = TAXONOMY.get(category)
    if not cat:
        return set()
    
    required = [t["value"] for t in cat["required"]]
    optional = [t["value"] for t in cat["optional"]]
    
    return set(required + optional)

def validate_tags(category: str, tags: List[str]):
    """Validate that all tags are valid for the given category"""
    if not tags:
        return  # Empty tags are allowed
    
    valid = get_valid_tag_values(category)
    for tag in tags:
        if tag not in valid:
            raise HTTPException(status_code=422, detail=f"INVALID_TAG_FOR_CATEGORY: {tag}")

# ==========================
#   GET /auth/me
#   Validiert Token und gibt User-Daten zurück
# ==========================
@api_router.get("/auth/me")
async def auth_me(user_id: str = Depends(get_user_id_from_token)):
    """Get current user info from token"""
    # user_id kommt direkt aus token -> db.tokens
    
    # user-Datensatz holen
    user = await db.users.find_one({"userId": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"✅ /auth/me called for user: {user_id}")
    
    return {
        "userId": user_id,
        "email": user["email"],
        "role": user["role"]
    }

# Worker Profile Endpoints

@api_router.post("/profiles/worker", response_model=WorkerProfile)
async def create_worker_profile(
    profile_data: WorkerProfileCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new worker profile"""
    logger.info("Creating worker profile")
    
    userId = await get_user_id_from_token(authorization)
    
    # Check if profile already exists
    existing = await db.worker_profiles.find_one({"userId": userId})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Validate categories and tags against taxonomy
    if profile_data.categories:
        # Schritt 1: Jede Kategorie prüfen
        for cat in profile_data.categories:
            validate_category(cat)
    
    # Validate tags for worker (tags gelten für alle Kategorien kombiniert)
    if profile_data.selectedTags and profile_data.categories:
        # Schritt 2: erlaubte Tags aller Kategorien zusammenführen
        valid_tags = set()
        for cat in profile_data.categories:
            valid_tags |= get_valid_tag_values(cat)
        
        # Schritt 3: prüfen, ob selectedTags gültig sind
        for tag in profile_data.selectedTags:
            if tag not in valid_tags:
                raise HTTPException(status_code=422, detail=f"INVALID_WORKER_TAG: {tag}")
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
    if not requesting_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Find profile
    profile = await db.worker_profiles.find_one({"userId": user_id})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove MongoDB _id field
    profile.pop("_id", None)
    
    # Check if application is accepted AND paid
    is_accepted = False
    if application_id:
        application = await db.applications.find_one({"id": application_id})
        if application and application.get("status") == "accepted" and application.get("paymentStatus") == "paid":
            is_accepted = True
            logger.info(f"Application {application_id} is ACCEPTED and PAID - showing full profile")
        elif application and application.get("status") == "accepted":
            logger.warning(f"Application {application_id} is ACCEPTED but NOT PAID - showing limited profile")
        else:
            logger.info(f"Application {application_id} not accepted - showing limited profile")
    
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
    requesting_user = await get_user_id_from_token(authorization)
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
    
    # Validate categories and tags against taxonomy
    # Schritt 1: Jede Kategorie prüfen
    for cat in categories:
        validate_category(cat)
    
    # Schritt 2: erlaubte Tags aller Kategorien zusammenführen
    selected_tags = merged_data.get("selectedTags", [])
    if selected_tags:
        valid_tags = set()
        for cat in categories:
            valid_tags |= get_valid_tag_values(cat)
        
        # Schritt 3: prüfen, ob selectedTags gültig sind
        for tag in selected_tags:
            if tag not in valid_tags:
                raise HTTPException(status_code=422, detail=f"INVALID_WORKER_TAG: {tag}")
    
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


@api_router.get("/profiles/worker/{worker_id}/registration-status")
async def get_worker_registration_status(worker_id: str):
    """
    Prüft, ob ein Worker alle erforderlichen Registrierungsdaten ausgefüllt hat.
    
    Args:
        worker_id: Die userId des Workers
    
    Returns:
        JSON mit complete Status und ggf. Liste fehlender Felder
    """
    logger.info(f"Checking registration status for worker {worker_id}")
    
    # Worker-Profil laden
    profile = await db.worker_profiles.find_one({"userId": worker_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    
    # Erforderliche Felder prüfen
    required_fields = ["geburtsdatum", "steuerId", "sozialversicherungsnummer", "krankenkasse"]
    missing_fields = []
    
    for field in required_fields:
        value = profile.get(field)
        # Prüfen ob Feld leer, None oder leerer String ist
        if not value or value == "" or value is None:
            missing_fields.append(field)
    
    # Ergebnis zurückgeben
    if missing_fields:
        logger.info(f"Worker {worker_id} registration incomplete. Missing: {missing_fields}")
        return {
            "complete": False,
            "missing": missing_fields
        }
    else:
        logger.info(f"Worker {worker_id} registration complete")
        return {
            "complete": True
        }


# Request Body Model for registration data
class WorkerRegistrationData(BaseModel):
    steuerId: Optional[str] = None
    geburtsdatum: Optional[str] = None
    sozialversicherungsnummer: Optional[str] = None
    krankenkasse: Optional[str] = None

@api_router.put("/profiles/worker/me/registration-data", response_model=WorkerProfile)
async def update_worker_registration_data(
    data: WorkerRegistrationData,
    authorization: Optional[str] = Header(None)
):
    """
    Aktualisiert die Registrierungsdaten des eingeloggten Workers.
    
    Speichert die 4 Pflichtfelder dauerhaft im Worker-Profil für:
    - Alle zukünftigen Einsätze
    - Alle Arbeitgeber
    - Arbeitsvertrag, Sofortmeldung, Lohnabrechnung
    
    Args:
        data: JSON Body mit steuerId, geburtsdatum, sozialversicherungsnummer, krankenkasse
        authorization: Bearer Token aus dem Header
    
    Returns:
        Das aktualisierte Worker-Profil
    """
    # userId aus Token extrahieren
    worker_id = await get_user_id_from_token(authorization)
    logger.info(f"Updating registration data for worker {worker_id}")
    
    # Worker-Profil laden
    existing_profile = await db.worker_profiles.find_one({"userId": worker_id})
    if not existing_profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    
    # Update-Daten vorbereiten
    update_data = {}
    if data.steuerId is not None:
        update_data["steuerId"] = data.steuerId.strip() if data.steuerId else ""
    if data.geburtsdatum is not None:
        update_data["geburtsdatum"] = data.geburtsdatum.strip() if data.geburtsdatum else ""
    if data.sozialversicherungsnummer is not None:
        update_data["sozialversicherungsnummer"] = data.sozialversicherungsnummer.strip() if data.sozialversicherungsnummer else ""
    if data.krankenkasse is not None:
        update_data["krankenkasse"] = data.krankenkasse.strip() if data.krankenkasse else ""
    
    # Timestamp aktualisieren
    update_data["updatedAt"] = datetime.utcnow().isoformat()
    
    # In MongoDB aktualisieren
    await db.worker_profiles.update_one(
        {"userId": worker_id},
        {"$set": update_data}
    )
    
    # Aktualisiertes Profil laden und zurückgeben
    updated_profile = await db.worker_profiles.find_one({"userId": worker_id})
    updated_profile.pop("_id", None)
    
    logger.info(f"Registration data updated for worker {worker_id}")
    return WorkerProfile(**updated_profile)



# Job Endpoints

@api_router.post("/jobs", response_model=Job)
async def create_job(
    job_data: JobCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new job"""
    logger.info("Creating new job")
    
    # Get employerId from token (validates token and returns userId)
    employerId = await get_user_id_from_token(authorization)
    logger.info(f"✅ Token validated - employerId: {employerId}")
    
    # Verify user is an employer
    user = await db.users.find_one({"userId": employerId})
    if not user or user.get("role") != "employer":
        logger.error(f"❌ User {employerId} is not an employer (role: {user.get('role') if user else 'not found'})")
        raise HTTPException(status_code=403, detail="Only employers can create jobs")
    
    # Validate category and tags against taxonomy
    validate_category(job_data.category)
    if job_data.required_all_tags:
        validate_tags(job_data.category, job_data.required_all_tags)
    if job_data.required_any_tags:
        validate_tags(job_data.category, job_data.required_any_tags)
    
    # Create job document
    job_dict = job_data.dict()
    job_dict["id"] = f"job_{str(uuid.uuid4())}"
    job_dict["employerId"] = employerId  # Set employerId from token
    job_dict["createdAt"] = datetime.utcnow().isoformat()
    
    logger.info(f"📝 Creating job with employerId: {employerId}")
    
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

@api_router.get("/jobs/matches/me", response_model=List[Job])
async def get_matched_jobs_for_me(
    authorization: Optional[str] = Header(None)
):
    """
    Get all jobs that match the current worker's profile
    
    Matching is based on:
    - Category (must be identical)
    - Radius (Haversine distance)
    - Required tags (all must be present in job)
    - Optional tags (at least one must be present if specified)
    """
    # Cleanup old jobs before matching
    await cleanup_old_jobs()
    
    # Get workerId from token
    worker_id = await get_user_id_from_token(authorization)
    logger.info(f"✅ /jobs/matches/me called for worker: {worker_id}")
    
    # Load worker profile
    worker_profile = await db.worker_profiles.find_one({"userId": worker_id})
    if not worker_profile:
        logger.error(f"❌ Worker profile not found for user {worker_id}")
        raise HTTPException(status_code=404, detail="Worker profile not found")
    
    logger.info(f"📋 Worker profile loaded: category={worker_profile.get('category')}, radius={worker_profile.get('radius')}")
    
    # Load all active jobs (status = 'open')
    all_jobs = await db.jobs.find({"status": "open"}).to_list(9999)
    logger.info(f"📊 Found {len(all_jobs)} open jobs to match against")
    
    # Apply matching logic
    matched_jobs = []
    for job in all_jobs:
        if match_worker_with_job(worker_profile, job):
            job.pop("_id", None)
            matched_jobs.append(Job(**job))
    
    logger.info(f"✅ Found {len(matched_jobs)} matching jobs for worker {worker_id}")
    return matched_jobs

@api_router.get("/jobs/all", response_model=List[Job])
async def get_all_jobs(
    authorization: Optional[str] = Header(None)
):
    """Get ALL jobs (including completed/closed) - needed for worker matches"""
    logger.info("Fetching ALL jobs (including completed)")
    
    # Verify token (optional)
    await get_user_id_from_token(authorization)
    
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
    await get_user_id_from_token(authorization)
    
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
    # Cleanup old jobs before loading
    await cleanup_old_jobs()
    
    logger.info(f"🔍 GET /jobs/employer/{employer_id}")
    logger.info(f"📋 Authorization header: {authorization}")
    
    # Verify token - employer can only see their own jobs
    requesting_user = await get_user_id_from_token(authorization)
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
    await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    
    # Merge with existing for validation
    merged_data = {**existing, **update_data}
    
    # Validate category and tags if they are being updated
    if "category" in update_data:
        validate_category(update_data["category"])
    
    # Get category (from update or existing)
    category = merged_data.get("category")
    
    if "required_all_tags" in update_data and category:
        validate_tags(category, update_data["required_all_tags"])
    
    if "required_any_tags" in update_data and category:
        validate_tags(category, update_data["required_any_tags"])
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    logger.info(f"🔥 POST /applications called - raw data: {app_data}")
    logger.info(f"🔥 Authorization header: {authorization[:50] if authorization else 'None'}...")
    
    # Get workerId from token (validates token and returns userId)
    workerId = await get_user_id_from_token(authorization)
    logger.info(f"✅ Token validated - workerId: {workerId}")
    logger.info(f"Creating application: worker {workerId} -> job {app_data.jobId}")
    
    # Verify user is a worker
    user = await db.users.find_one({"userId": workerId})
    if not user or user.get("role") != "worker":
        logger.error(f"❌ User {workerId} is not a worker (role: {user.get('role') if user else 'not found'})")
        raise HTTPException(status_code=403, detail="Only workers can create applications")
    
    # Load job to get employerId
    job = await db.jobs.find_one({"id": app_data.jobId})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if application already exists
    existing = await db.applications.find_one({
        "jobId": app_data.jobId,
        "workerId": workerId
    })
    
    if existing:
        logger.info(f"Application already exists: {existing.get('id')}")
        existing.pop("_id", None)
        return JobApplication(**existing)
    
    # Create application document
    app_dict = app_data.dict()
    app_dict["id"] = f"app_{uuid.uuid4().hex[:12]}"  # Kurzes Format: app_xyz123
    app_dict["workerId"] = workerId  # Set workerId from token
    app_dict["employerId"] = job["employerId"]  # Set employerId from job
    app_dict["createdAt"] = datetime.utcnow().isoformat()
    app_dict["status"] = "pending"
    app_dict["isPaid"] = False  # NEU: Chat muss freigeschaltet werden
    app_dict["chatUnlocked"] = False  # NEU: Chat ist gesperrt bis bezahlt
    app_dict["paymentStatus"] = "pending"  # NEU: Payment-Status
    app_dict["registrationType"] = "none"  # NEU: Offizielles Anmeldung-Status
    app_dict["officialRegistrationStatus"] = "none"  # NEU: Registrierungsanfrage-Status
    
    logger.info(f"📝 Creating application for employer {job['employerId']} by worker {workerId}")
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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

@api_router.get("/applications/worker/me", response_model=List[JobApplication])
async def get_my_worker_applications(user_id: str = Depends(get_user_id_from_token)):
    """Get all applications for the current worker (from token)"""
    logger.info(f"✅ /applications/worker/me called for: {user_id}")
    
    # Find all applications for this worker
    applications = await db.applications.find({"workerId": user_id}).to_list(9999)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for worker {user_id}")
    return applications

@api_router.get("/applications/worker/{worker_id}", response_model=List[JobApplication])
async def get_applications_for_worker(
    worker_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all applications for a specific worker"""
    logger.info(f"Fetching applications for worker {worker_id}")
    
    # Verify token - worker can only see their own applications
    requesting_user = await get_user_id_from_token(authorization)
    if requesting_user != worker_id:
        raise HTTPException(status_code=403, detail="Cannot view another worker's applications")
    
    # Find all applications for this worker
    applications = await db.applications.find({"workerId": worker_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for worker {worker_id}")
    return [JobApplication(**app) for app in applications]

@api_router.get("/applications/employer/me", response_model=List[JobApplication])
async def get_my_employer_applications(user_id: str = Depends(get_user_id_from_token)):
    """Get all applications for all jobs of the current employer (from token)"""
    logger.info(f"✅ /applications/employer/me called for: {user_id}")
    
    # Find all applications for this employer
    applications = await db.applications.find({"employerId": user_id}).to_list(9999)
    
    # Remove MongoDB _id field
    for app in applications:
        app.pop("_id", None)
    
    logger.info(f"Found {len(applications)} applications for employer {user_id}")
    return [JobApplication(**app) for app in applications]

@api_router.get("/applications/employer/{employer_id}", response_model=List[JobApplication])
async def get_applications_for_employer(
    employer_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all applications for all jobs of a specific employer"""
    logger.info(f"Fetching applications for employer {employer_id}")
    
    # Verify token - employer can only see their own applications
    requesting_user = await get_user_id_from_token(authorization)
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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

@api_router.post("/applications/{application_id}/pay", response_model=JobApplication)
async def pay_for_application(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Employer zahlt für eine Application und schaltet den Chat frei
    """
    logger.info(f"💳 Processing payment for application {application_id}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer
    if requesting_user != application.get("employerId"):
        raise HTTPException(status_code=403, detail="Only the employer can pay for applications")
    
    # Mark as paid and accepted (unlock chat)
    now = datetime.utcnow().isoformat()
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": "accepted",
            "isPaid": True,
            "chatUnlocked": True,
            "paymentStatus": "paid",
            "paidAt": now
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
    
    logger.info(f"✅ Payment processed, chat unlocked, job {job_id} matched to worker {application.get('workerId')}")
    return JobApplication(**updated_app)

@api_router.post("/applications/{application_id}/confirm-payment", response_model=JobApplication)
async def confirm_payment(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Bestätigt Zahlung für Application (Alias für /pay)
    """
    return await pay_for_application(application_id, authorization)


# ==================== OFFICIAL REGISTRATION ENDPOINTS ====================

@api_router.post("/applications/{application_id}/request-official-registration", response_model=JobApplication)
async def request_official_registration(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Employer fordert offizielle Anmeldung an
    """
    logger.info(f"📋 Employer requesting official registration for application {application_id}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer
    if requesting_user != application.get("employerId"):
        raise HTTPException(status_code=403, detail="Only the employer can request official registration")
    
    # Check if payment is completed
    if application.get("paymentStatus") != "paid":
        raise HTTPException(status_code=402, detail="Payment required before requesting official registration")
    
    # Update application
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "officialRegistrationStatus": "requested"
        }}
    )
    
    # Fetch and return updated application
    updated_app = await db.applications.find_one({"id": application_id})
    updated_app.pop("_id", None)
    
    logger.info(f"✅ Official registration requested for application {application_id}")
    return JobApplication(**updated_app)

@api_router.post("/applications/{application_id}/respond-official-registration", response_model=JobApplication)
async def respond_official_registration(
    application_id: str,
    request: OfficialRegistrationRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Worker antwortet auf offizielle Anmeldungsanfrage
    """
    logger.info(f"📝 Worker responding to official registration for application {application_id}: {request.decision}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the worker
    if requesting_user != application.get("workerId"):
        raise HTTPException(status_code=403, detail="Only the worker can respond to registration request")
    
    # Check if request was made
    if application.get("officialRegistrationStatus") != "requested":
        raise HTTPException(status_code=400, detail="No official registration request found")
    
    if request.decision == "accept":
        if not request.workerOfficialData:
            raise HTTPException(status_code=400, detail="Worker official data required")
        
        # Save worker official data
        worker_data_dict = request.workerOfficialData.dict()
        worker_data_dict["workerId"] = requesting_user
        worker_data_dict["applicationId"] = application_id
        worker_data_dict["updatedAt"] = datetime.utcnow().isoformat()
        
        await db.worker_official_data.insert_one(worker_data_dict)
        
        # Update application
        await db.applications.update_one(
            {"id": application_id},
            {"$set": {
                "registrationType": "official",
                "officialRegistrationStatus": "completed"
            }}
        )
        
        logger.info(f"✅ Official registration completed for application {application_id}")
        
    elif request.decision == "deny":
        # Update application
        await db.applications.update_one(
            {"id": application_id},
            {"$set": {
                "registrationType": "informal",
                "officialRegistrationStatus": "denied"
            }}
        )
        
        logger.info(f"❌ Official registration denied for application {application_id}")
    else:
        raise HTTPException(status_code=400, detail="Invalid decision. Must be 'accept' or 'deny'")
    
    # Fetch and return updated application
    updated_app = await db.applications.find_one({"id": application_id})
    updated_app.pop("_id", None)
    
    return JobApplication(**updated_app)

@api_router.get("/official/worker-data/{application_id}")
async def get_worker_official_data(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Employer ruft offizielle Worker-Daten ab (nur bei completed)
    """
    logger.info(f"🔍 Fetching worker official data for application {application_id}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer
    if requesting_user != application.get("employerId"):
        raise HTTPException(status_code=403, detail="Only the employer can view worker official data")
    
    # Check if payment is completed
    if application.get("paymentStatus") != "paid":
        raise HTTPException(status_code=402, detail="Payment required")
    
    # Check if registration is completed
    if application.get("officialRegistrationStatus") != "completed":
        raise HTTPException(status_code=403, detail="Official registration not completed")
    
    # Fetch worker official data
    worker_data = await db.worker_official_data.find_one({"applicationId": application_id})
    
    if not worker_data:
        raise HTTPException(status_code=404, detail="Worker official data not found")
    
    worker_data.pop("_id", None)
    
    logger.info(f"✅ Worker official data retrieved for application {application_id}")
    return worker_data

@api_router.post("/official/create-contract-pdf")
async def create_contract_pdf(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Erstellt Mini-Arbeitsvertrag als PDF
    """
    logger.info(f"📄 Creating contract PDF for application {application_id}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Find application
    application = await db.applications.find_one({"id": application_id})
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if user is the employer
    if requesting_user != application.get("employerId"):
        raise HTTPException(status_code=403, detail="Only the employer can create contract")
    
    # Check if registration is completed
    if application.get("officialRegistrationStatus") != "completed":
        raise HTTPException(status_code=400, detail="Official registration not completed")
    
    # Fetch worker official data
    worker_data = await db.worker_official_data.find_one({"applicationId": application_id})
    if not worker_data:
        raise HTTPException(status_code=404, detail="Worker official data not found")
    
    # Fetch job data
    job = await db.jobs.find_one({"id": application.get("jobId")})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Fetch employer profile
    employer_profile = await db.employer_profiles.find_one({"userId": application.get("employerId")})
    if not employer_profile:
        raise HTTPException(status_code=404, detail="Employer profile not found")
    
    # TODO: PDF generation logic here
    # For now, return mock URL
    pdf_url = f"https://example.com/contracts/{application_id}.pdf"
    
    logger.info(f"✅ Contract PDF created: {pdf_url}")
    
    return {
        "pdfUrl": pdf_url,
        "applicationId": application_id,
        "createdAt": datetime.utcnow().isoformat()
    }


# Employer Profile Endpoints

@api_router.post("/profiles/employer", response_model=EmployerProfile)
async def create_employer_profile(
    profile_data: EmployerProfileCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new employer profile"""
    logger.info("Creating employer profile")
    
    userId = await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    requesting_user = await get_user_id_from_token(authorization)
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
    requesting_user = await get_user_id_from_token(authorization)
    
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
    await get_user_id_from_token(authorization)
    
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
    await get_user_id_from_token(authorization)
    
    # Find all reviews for this employer
    reviews = await db.reviews.find({"employerId": employer_id}).to_list(1000)
    
    # Remove MongoDB _id field
    for review in reviews:
        review.pop("_id", None)
    
    logger.info(f"Found {len(reviews)} reviews for employer {employer_id}")
    return [Review(**review) for review in reviews]

@api_router.get("/reviews/job/{jobId}", response_model=List[Review])
async def get_reviews_for_job(jobId: str):
    """Get all reviews linked to a specific job."""
    
    reviews = await db.reviews.find({"jobId": jobId}).to_list(9999)
    
    for r in reviews:
        r.pop("_id", None)
    
    return [Review(**r) for r in reviews]

# Chat Message Endpoints

@api_router.post("/chat/messages")
async def send_message(
    payload: dict,
    authorization: Optional[str] = Header(None)
):
    """Send a chat message"""
    user_id = await get_user_id_from_token(authorization)
    
    # Get application
    app = await db.applications.find_one({"id": payload["applicationId"]})
    if not app:
        raise HTTPException(status_code=404, detail="APPLICATION_NOT_FOUND")
    
    # Check if chat is unlocked (NEU: Default ist False, Chat muss bezahlt werden)
    if not app.get("chatUnlocked", False) or app.get("paymentStatus") != "paid":
        raise HTTPException(status_code=402, detail="PAYMENT_REQUIRED")
    
    # Determine receiver
    if user_id == app["employerId"]:
        receiver_id = app["workerId"]
    elif user_id == app["workerId"]:
        receiver_id = app["employerId"]
    else:
        raise HTTPException(status_code=403, detail="NOT_AUTHORIZED")
    
    # Create message document
    doc = {
        "applicationId": payload["applicationId"],
        "senderId": user_id,
        "receiverId": receiver_id,
        "text": payload["text"],
        "read": False,
        "createdAt": datetime.utcnow().isoformat(),
    }
    
    await db.chat_messages.insert_one(doc)
    return {"success": True}

@api_router.get("/chat/messages/{application_id}", response_model=List[ChatMessage])
async def get_messages(
    application_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get all messages for an application"""
    logger.info(f"Fetching messages for application {application_id}")
    
    # Verify token
    requesting_user = await get_user_id_from_token(authorization)
    
    # Get application to verify user is part of it
    application = await db.applications.find_one({"id": application_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # User must be either the worker or employer
    if requesting_user not in [application.get("workerId"), application.get("employerId")]:
        raise HTTPException(status_code=403, detail="Cannot view messages for this application")
    
    # Check if chat is unlocked (NEU: Chat muss bezahlt sein)
    if not application.get("chatUnlocked", False) or application.get("paymentStatus") != "paid":
        raise HTTPException(status_code=402, detail="PAYMENT_REQUIRED")
    
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
    
    # Remove MongoDB _id field and prepare for ChatMessage model
    result_messages = []
    for msg in messages:
        msg.pop("_id", None)
        # Transform DB field names to match model
        if "text" in msg and "message" not in msg:
            msg["message"] = msg.get("text")
        result_messages.append(ChatMessage(**msg))
    
    logger.info(f"Found {len(messages)} messages for application {application_id}")
    return result_messages


# Request Body Model for creating official registration
class CreateRegistrationRequest(BaseModel):
    applicationId: str
    registrationType: str
    steuerId: Optional[str] = None
    krankenkasse: Optional[str] = None
    geburtsdatum: Optional[str] = None
    sozialversicherungsnummer: Optional[str] = None


# PDF Generation Utility Function
def generate_contract_pdf(
    registration_id: str,
    job_data: dict,
    employer_data: dict,
    worker_data: dict,
    registration_type: str,
    created_at: str
) -> str:
    """
    Generiert ein PDF für den Arbeitsvertrag.
    
    Args:
        registration_id: ID der Registration
        job_data: Job-Daten (title, description, address, workerAmountCents, etc.)
        employer_data: Employer-Daten (firstName, lastName, companyName, homeAddress, etc.)
        worker_data: Worker-Daten (firstName, lastName, homeAddress, etc.)
        registration_type: Art der Beschäftigung (kurzfristig oder minijob)
        created_at: Erstellungsdatum
    
    Returns:
        Relativer Pfad zur generierten PDF-Datei
    """
    # Ordner erstellen falls nicht vorhanden
    contracts_dir = Path("/app/backend/generated_contracts")
    contracts_dir.mkdir(exist_ok=True)
    
    # Dateiname
    filename = f"contract_{registration_id}.pdf"
    filepath = contracts_dir / filename
    
    # PDF erstellen mit Flowables
    doc = SimpleDocTemplate(str(filepath), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Titel
    story.append(Paragraph("Arbeitsvertrag – einfacher Einsatzvertrag", styles["Heading1"]))
    story.append(Spacer(1, 12))
    
    # 1. Arbeitgeber
    story.append(Paragraph("1. Arbeitgeber", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    employer_name = f"{employer_data.get('firstName', '')} {employer_data.get('lastName', '')}"
    employer_lines = [employer_name]
    
    if employer_data.get('companyName'):
        employer_lines.append(employer_data['companyName'])
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    emp_addr = employer_data.get('homeAddress', {})
    if emp_addr:
        # Neue Struktur: homeAddress Object
        employer_address = f"{emp_addr.get('street', '')} {emp_addr.get('houseNumber', '')}, {emp_addr.get('postalCode', '')} {emp_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        employer_address = f"{employer_data.get('street', '')} {employer_data.get('houseNumber', '')}, {employer_data.get('postalCode', '')} {employer_data.get('city', '')}"
    employer_lines.append(employer_address)
    
    story.append(Paragraph("<br/>".join(employer_lines), styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 2. Arbeitnehmer (OHNE sensible Daten)
    story.append(Paragraph("2. Arbeitnehmer", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    worker_name = f"{worker_data.get('firstName', '')} {worker_data.get('lastName', '')}"
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    work_addr = worker_data.get('homeAddress', {})
    if work_addr:
        # Neue Struktur: homeAddress Object
        worker_address = f"{work_addr.get('street', '')} {work_addr.get('houseNumber', '')}, {work_addr.get('postalCode', '')} {work_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        worker_address = f"{worker_data.get('street', '')} {worker_data.get('houseNumber', '')}, {worker_data.get('postalCode', '')} {worker_data.get('city', '')}"
    
    worker_text = f"{worker_name}<br/>{worker_address}"
    story.append(Paragraph(worker_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 3. Art der Beschäftigung
    story.append(Paragraph("3. Art der Beschäftigung", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    registration_type_de = "Kurzfristige Beschäftigung" if registration_type == "kurzfristig" else "Minijob"
    story.append(Paragraph(registration_type_de, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 4. Einsatzdetails
    story.append(Paragraph("4. Einsatzdetails", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    job_addr = job_data.get('address', {})
    job_address = f"{job_addr.get('street', '')} {job_addr.get('houseNumber', '')}, {job_addr.get('postalCode', '')} {job_addr.get('city', '')}"
    worker_amount = job_data.get('workerAmountCents', 0) / 100
    
    job_details = f"""
    Tätigkeit: {job_data.get('title', 'Nicht angegeben')}<br/>
    Beschreibung: {job_data.get('description', 'Nicht angegeben')}<br/>
    Ort: {job_address}<br/>
    Gesamtlohn: {worker_amount:.2f} EUR
    """
    story.append(Paragraph(job_details, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 5. Dauer und Umfang
    story.append(Paragraph("5. Dauer und Umfang", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    duration_text = """
    Die Vereinbarung gilt ausschließlich für diesen einmaligen Einsatz.<br/>
    Es entsteht kein dauerhaftes Arbeitsverhältnis.
    """
    story.append(Paragraph(duration_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 6. Vertragsabschluss
    story.append(Paragraph("6. Vertragsabschluss", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    conclusion_text = """
    Mit Annahme des Einsatzes durch den Arbeitnehmer und der Bezahlung durch den Arbeitgeber 
    gilt dieser Vertrag als geschlossen.<br/>
    Eine schriftliche Unterschrift ist nicht erforderlich.
    """
    story.append(Paragraph(conclusion_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # Datum
    story.append(Paragraph(f"<i>Erstellt am: {created_at}</i>", styles["Normal"]))
    
    # PDF erstellen
    doc.build(story)
    
    logger.info(f"Generated contract PDF: {filename}")
    
    # Relativen Pfad zurückgeben
    return f"/api/generated_contracts/{filename}"


def generate_sofortmeldung_pdf(
    registration_id: str,
    job_data: dict,
    employer_data: dict,
    worker_data: dict,
    registration_type: str,
    created_at: str,
    additional_data: dict
) -> str:
    """
    Generiert ein PDF für die Sofortmeldung.
    
    Args:
        registration_id: ID der Registration
        job_data: Job-Daten
        employer_data: Employer-Daten
        worker_data: Worker-Daten
        registration_type: Art der Beschäftigung
        created_at: Erstellungsdatum
        additional_data: Zusätzliche Daten (geburtsdatum, steuerId, krankenkasse, svNummer)
    
    Returns:
        Relativer Pfad zur generierten PDF-Datei
    """
    # Ordner erstellen falls nicht vorhanden
    contracts_dir = Path("/app/backend/generated_contracts")
    contracts_dir.mkdir(exist_ok=True)
    
    # Dateiname
    filename = f"sofortmeldung_{registration_id}.pdf"
    filepath = contracts_dir / filename
    
    # PDF erstellen mit Flowables
    doc = SimpleDocTemplate(str(filepath), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Titel
    registration_type_title = "kurzfristigen Beschäftigung" if registration_type == "kurzfristig" else "Minijob"
    story.append(Paragraph(f"Sofortmeldung zur {registration_type_title}", styles["Heading1"]))
    story.append(Spacer(1, 12))
    
    # 1. Arbeitgeber
    story.append(Paragraph("1. Arbeitgeber", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    employer_name = f"{employer_data.get('firstName', '')} {employer_data.get('lastName', '')}"
    employer_lines = [employer_name]
    
    if employer_data.get('companyName'):
        employer_lines.append(employer_data['companyName'])
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    emp_addr = employer_data.get('homeAddress', {})
    if emp_addr:
        # Neue Struktur: homeAddress Object
        employer_address = f"{emp_addr.get('street', '')} {emp_addr.get('houseNumber', '')}, {emp_addr.get('postalCode', '')} {emp_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        employer_address = f"{employer_data.get('street', '')} {employer_data.get('houseNumber', '')}, {employer_data.get('postalCode', '')} {employer_data.get('city', '')}"
    employer_lines.append(employer_address)
    
    story.append(Paragraph("<br/>".join(employer_lines), styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 2. Arbeitnehmer
    story.append(Paragraph("2. Arbeitnehmer", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    worker_name = f"{worker_data.get('firstName', '')} {worker_data.get('lastName', '')}"
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    work_addr = worker_data.get('homeAddress', {})
    if work_addr:
        # Neue Struktur: homeAddress Object
        worker_address = f"{work_addr.get('street', '')} {work_addr.get('houseNumber', '')}, {work_addr.get('postalCode', '')} {work_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        worker_address = f"{worker_data.get('street', '')} {worker_data.get('houseNumber', '')}, {worker_data.get('postalCode', '')} {worker_data.get('city', '')}"
    
    # Zusätzliche Worker-Daten - Prüfe beide Quellen
    geburtsdatum = worker_data.get('geburtsdatum') or additional_data.get('geburtsdatum', 'Nicht angegeben')
    steuer_id = worker_data.get('steuerId') or additional_data.get('steuerId', 'Nicht angegeben')
    sv_nummer = worker_data.get('sozialversicherungsnummer') or additional_data.get('sozialversicherungsnummer', 'Nicht angegeben')
    krankenkasse = worker_data.get('krankenkasse') or additional_data.get('krankenkasse', 'Nicht angegeben')
    
    worker_text = f"""
    {worker_name}<br/>
    {worker_address}<br/>
    Geburtsdatum: {geburtsdatum}<br/>
    Steuer-ID: {steuer_id}<br/>
    Sozialversicherungsnummer: {sv_nummer}<br/>
    Krankenkasse: {krankenkasse}
    """
    story.append(Paragraph(worker_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 3. Einsatzdetails
    story.append(Paragraph("3. Einsatzdetails", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    job_addr = job_data.get('address', {})
    job_address = f"{job_addr.get('street', '')} {job_addr.get('houseNumber', '')}, {job_addr.get('postalCode', '')} {job_addr.get('city', '')}"
    worker_amount = job_data.get('workerAmountCents', 0) / 100
    
    job_details = f"""
    Tätigkeit: {job_data.get('title', 'Nicht angegeben')}<br/>
    Beschreibung: {job_data.get('description', 'Nicht angegeben')}<br/>
    Ort: {job_address}<br/>
    Gesamtlohn: {worker_amount:.2f} EUR
    """
    story.append(Paragraph(job_details, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 4. Beschäftigungsart
    story.append(Paragraph("4. Beschäftigungsart", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    registration_type_de = "Kurzfristige Beschäftigung" if registration_type == "kurzfristig" else "Minijob"
    story.append(Paragraph(registration_type_de, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 5. Hinweis
    story.append(Paragraph("5. Hinweis", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    notice_text = """
    Dieses Dokument dient der Weitergabe an Steuerberatung, Lohnbüro 
    oder Minijob-Zentrale zur Vorbereitung der erforderlichen Meldungen.
    """
    story.append(Paragraph(notice_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # Datum
    story.append(Paragraph(f"<i>Erstellt am: {created_at}</i>", styles["Normal"]))
    
    # PDF erstellen
    doc.build(story)
    
    logger.info(f"Generated Sofortmeldung PDF: {filename}")
    
    # Relativen Pfad zurückgeben
    return f"/api/generated_contracts/{filename}"


def generate_payroll_pdf(
    registration_id: str,
    job_data: dict,
    employer_data: dict,
    worker_data: dict,
    registration_type: str,
    created_at: str,
    additional_data: dict
) -> str:
    """
    Generiert ein PDF für die Lohnabrechnung.
    
    Args:
        registration_id: ID der Registration
        job_data: Job-Daten
        employer_data: Employer-Daten
        worker_data: Worker-Daten
        registration_type: Art der Beschäftigung
        created_at: Erstellungsdatum
        additional_data: Zusätzliche Daten (geburtsdatum)
    
    Returns:
        Relativer Pfad zur generierten PDF-Datei
    """
    # Ordner erstellen falls nicht vorhanden
    contracts_dir = Path("/app/backend/generated_contracts")
    contracts_dir.mkdir(exist_ok=True)
    
    # Dateiname
    filename = f"payroll_{registration_id}.pdf"
    filepath = contracts_dir / filename
    
    # PDF erstellen mit Flowables
    doc = SimpleDocTemplate(str(filepath), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Titel
    story.append(Paragraph("Lohnabrechnung – Einmaliger Einsatz", styles["Heading1"]))
    story.append(Spacer(1, 12))
    
    # 1. Arbeitgeber
    story.append(Paragraph("1. Arbeitgeber", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    employer_name = f"{employer_data.get('firstName', '')} {employer_data.get('lastName', '')}"
    employer_lines = [employer_name]
    
    if employer_data.get('companyName'):
        employer_lines.append(employer_data['companyName'])
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    emp_addr = employer_data.get('homeAddress', {})
    if emp_addr:
        # Neue Struktur: homeAddress Object
        employer_address = f"{emp_addr.get('street', '')} {emp_addr.get('houseNumber', '')}, {emp_addr.get('postalCode', '')} {emp_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        employer_address = f"{employer_data.get('street', '')} {employer_data.get('houseNumber', '')}, {employer_data.get('postalCode', '')} {employer_data.get('city', '')}"
    employer_lines.append(employer_address)
    
    story.append(Paragraph("<br/>".join(employer_lines), styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 2. Arbeitnehmer
    story.append(Paragraph("2. Arbeitnehmer", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    worker_name = f"{worker_data.get('firstName', '')} {worker_data.get('lastName', '')}"
    
    # Unterstütze beide Datenstrukturen: homeAddress Object oder Root-Level
    work_addr = worker_data.get('homeAddress', {})
    if work_addr:
        # Neue Struktur: homeAddress Object
        worker_address = f"{work_addr.get('street', '')} {work_addr.get('houseNumber', '')}, {work_addr.get('postalCode', '')} {work_addr.get('city', '')}"
    else:
        # Alte Struktur: Root-Level Felder
        worker_address = f"{worker_data.get('street', '')} {worker_data.get('houseNumber', '')}, {worker_data.get('postalCode', '')} {worker_data.get('city', '')}"
    
    # Zusätzliche Worker-Daten - Prüfe beide Quellen
    geburtsdatum = worker_data.get('geburtsdatum') or additional_data.get('geburtsdatum', 'Nicht angegeben')
    steuer_id = worker_data.get('steuerId') or additional_data.get('steuerId', 'Nicht angegeben')
    sv_nummer = worker_data.get('sozialversicherungsnummer') or additional_data.get('sozialversicherungsnummer', 'Nicht angegeben')
    krankenkasse = worker_data.get('krankenkasse') or additional_data.get('krankenkasse', 'Nicht angegeben')
    
    worker_text = f"""
    {worker_name}<br/>
    {worker_address}<br/>
    Geburtsdatum: {geburtsdatum}<br/>
    Steuer-ID: {steuer_id}<br/>
    Sozialversicherungsnummer: {sv_nummer}<br/>
    Krankenkasse: {krankenkasse}
    """
    story.append(Paragraph(worker_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 3. Einsatzdetails
    story.append(Paragraph("3. Einsatzdetails", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    job_addr = job_data.get('address', {})
    job_address = f"{job_addr.get('street', '')} {job_addr.get('houseNumber', '')}, {job_addr.get('postalCode', '')} {job_addr.get('city', '')}"
    
    job_details = f"""
    Tätigkeit: {job_data.get('title', 'Nicht angegeben')}<br/>
    Beschreibung: {job_data.get('description', 'Nicht angegeben')}<br/>
    Ort: {job_address}
    """
    story.append(Paragraph(job_details, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 4. Vergütung
    story.append(Paragraph("4. Vergütung", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    worker_amount = job_data.get('workerAmountCents', 0) / 100
    
    # Stunden berechnen (einfache Schätzung: 8 Stunden pro Tag als Standard)
    hours = 8.0
    hourly_rate = worker_amount / hours if hours > 0 else worker_amount
    
    payment_text = f"""
    Stundenlohn: {hourly_rate:.2f} EUR<br/>
    Gearbeitete Stunden: {hours:.1f}<br/>
    Gesamtlohn: {worker_amount:.2f} EUR
    """
    story.append(Paragraph(payment_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # 5. Hinweis
    story.append(Paragraph("5. Hinweis", styles["Heading2"]))
    story.append(Spacer(1, 6))
    
    notice_text = """
    Diese Abrechnung bezieht sich ausschließlich auf den oben genannten Einsatz.<br/>
    Sie dient der Übergabe an Arbeitnehmer, Steuerberatung oder Lohnbüro.
    """
    story.append(Paragraph(notice_text, styles["Normal"]))
    story.append(Spacer(1, 12))
    
    # Datum
    story.append(Paragraph(f"<i>Erstellt am: {created_at}</i>", styles["Normal"]))
    
    # PDF erstellen
    doc.build(story)
    
    logger.info(f"Generated payroll PDF: {filename}")
    
    # Relativen Pfad zurückgeben
    return f"/api/generated_contracts/{filename}"

# Official Registration Endpoints
@api_router.post("/registrations/create", response_model=OfficialRegistration)
async def create_official_registration(request: CreateRegistrationRequest):
    """
    Erstellt eine neue offizielle Anmeldung basierend auf einer Application.
    
    Args:
        request: JSON Body mit applicationId und registrationType
    
    Returns:
        Die erstellte OfficialRegistration
    """
    logger.info(f"Creating official registration for application {request.applicationId}, type: {request.registrationType}")
    
    # Application aus der Datenbank laden
    application = await db.applications.find_one({"id": request.applicationId})
    if not application:
        logger.error(f"Application {request.applicationId} not found")
        raise HTTPException(status_code=404, detail="Application nicht gefunden")
    
    # employerId und workerId aus der Application übernehmen
    employer_id = application.get("employerId")
    worker_id = application.get("workerId")
    
    if not employer_id or not worker_id:
        logger.error(f"Application {request.applicationId} missing employerId or workerId")
        raise HTTPException(
            status_code=400, 
            detail="Application hat keine gültige employerId oder workerId"
        )
    
    # Worker-Daten laden und Pflichtfelder prüfen
    worker = await db.worker_profiles.find_one({"userId": worker_id})
    if not worker:
        logger.error(f"Worker profile {worker_id} not found")
        raise HTTPException(status_code=404, detail="Worker-Profil nicht gefunden")
    
    required_fields = ["geburtsdatum", "steuerId", "sozialversicherungsnummer", "krankenkasse"]
    missing = [f for f in required_fields if not worker.get(f)]
    
    if missing:
        logger.error(f"Worker {worker_id} missing required fields: {missing}")
        raise HTTPException(
            status_code=400,
            detail="worker_data_incomplete"
        )
    
    # Neuen Eintrag erstellen
    new_registration = OfficialRegistration(
        applicationId=request.applicationId,
        employerId=employer_id,
        workerId=worker_id,
        registrationType=request.registrationType,
        status="pending",
        contractUrl=None,
        sofortmeldungUrl=None,
        steuerId=request.steuerId,
        krankenkasse=request.krankenkasse,
        geburtsdatum=request.geburtsdatum,
        sozialversicherungsnummer=request.sozialversicherungsnummer,
        createdAt=datetime.utcnow().isoformat(),
        updatedAt=datetime.utcnow().isoformat()
    )
    
    # In die Datenbank einfügen
    registration_dict = new_registration.dict()
    await db.official_registrations.insert_one(registration_dict)
    
    logger.info(f"Created official registration with id {new_registration.id}")
    
    return new_registration


# Request Body Model for completing official registration
class CompleteRegistrationRequest(BaseModel):
    applicationId: str

@api_router.post("/registrations/complete", response_model=OfficialRegistration)
async def complete_official_registration(request: CompleteRegistrationRequest):
    """
    Schließt eine offizielle Anmeldung ab.
    
    Setzt status='completed' in official_registrations Collection
    und officialRegistrationStatus='completed' in applications Collection.
    
    Args:
        request: JSON Body mit applicationId
    
    Returns:
        Das aktualisierte OfficialRegistration Dokument
    """
    logger.info(f"Completing official registration for application {request.applicationId}")
    
    # Registrierung aus der Datenbank laden
    registration = await db.official_registrations.find_one({"applicationId": request.applicationId})
    if not registration:
        logger.error(f"Official registration for application {request.applicationId} not found")
        raise HTTPException(
            status_code=404, 
            detail="Keine offizielle Anmeldung für diese Application gefunden"
        )
    
    # Status auf "completed" setzen
    updated_at = datetime.utcnow().isoformat()
    update_result = await db.official_registrations.update_one(
        {"applicationId": request.applicationId},
        {"$set": {
            "status": "completed",
            "updatedAt": updated_at
        }}
    )
    
    if update_result.modified_count == 0:
        logger.warning(f"No documents updated for application {request.applicationId}")
    
    # Auch in applications Collection den Status setzen
    app_update_result = await db.applications.update_one(
        {"id": request.applicationId},
        {"$set": {
            "officialRegistrationStatus": "completed"
        }}
    )
    
    if app_update_result.matched_count == 0:
        logger.warning(f"Application {request.applicationId} not found for status update")
    
    # Aktualisiertes Dokument laden
    updated_registration = await db.official_registrations.find_one({"applicationId": request.applicationId})
    
    # MongoDB _id entfernen
    updated_registration.pop("_id", None)
    
    logger.info(f"Completed official registration for application {request.applicationId}")
    
    return OfficialRegistration(**updated_registration)


# Request Body Model for generating contract
class GenerateContractRequest(BaseModel):
    applicationId: str

@api_router.post("/registrations/generate-contract")
async def generate_contract(request: GenerateContractRequest):
    """
    Generiert einen PDF-Vertrag für eine offizielle Anmeldung.
    
    Args:
        request: JSON Body mit applicationId
    
    Returns:
        JSON mit contractUrl
    """
    logger.info(f"Generating contract for application {request.applicationId}")
    
    # Official Registration laden
    registration = await db.official_registrations.find_one({"applicationId": request.applicationId})
    if not registration:
        logger.error(f"Official registration for application {request.applicationId} not found")
        raise HTTPException(
            status_code=404,
            detail="Keine offizielle Anmeldung für diese Application gefunden"
        )
    
    registration_id = registration.get("id")
    registration_type = registration.get("registrationType")
    created_at = registration.get("createdAt")
    
    # Application laden
    application = await db.applications.find_one({"id": request.applicationId})
    if not application:
        logger.error(f"Application {request.applicationId} not found")
        raise HTTPException(status_code=404, detail="Application nicht gefunden")
    
    job_id = application.get("jobId")
    worker_id = application.get("workerId")
    employer_id = application.get("employerId")
    
    # Job laden
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        logger.error(f"Job {job_id} not found")
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    
    job.pop("_id", None)
    
    # Worker laden
    worker = await db.worker_profiles.find_one({"userId": worker_id})
    if not worker:
        logger.error(f"Worker {worker_id} not found")
        raise HTTPException(status_code=404, detail="Worker nicht gefunden")
    
    worker.pop("_id", None)
    
    # Pflichtfelder prüfen
    required_fields = ["geburtsdatum", "steuerId", "sozialversicherungsnummer", "krankenkasse"]
    missing = [f for f in required_fields if not worker.get(f)]
    
    if missing:
        logger.error(f"Worker {worker_id} missing required fields: {missing}")
        raise HTTPException(
            status_code=400,
            detail="worker_data_incomplete"
        )
    
    # Employer laden
    employer = await db.employer_profiles.find_one({"userId": employer_id})
    if not employer:
        logger.error(f"Employer {employer_id} not found")
        raise HTTPException(status_code=404, detail="Employer nicht gefunden")
    
    employer.pop("_id", None)
    
    # PDF generieren
    contract_url = generate_contract_pdf(
        registration_id=registration_id,
        job_data=job,
        employer_data=employer,
        worker_data=worker,
        registration_type=registration_type,
        created_at=created_at
    )
    
    # contractUrl in official_registrations speichern
    await db.official_registrations.update_one(
        {"id": registration_id},
        {"$set": {
            "contractUrl": contract_url,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )
    
    logger.info(f"Contract generated and saved: {contract_url}")
    
    return {"contractUrl": contract_url}


# Request Body Model for generating Sofortmeldung
class GenerateSofortmeldungRequest(BaseModel):
    applicationId: str

@api_router.post("/registrations/generate-sofortmeldung")
async def generate_sofortmeldung(request: GenerateSofortmeldungRequest):
    """
    Generiert eine PDF-Sofortmeldung für eine offizielle Anmeldung.
    
    Args:
        request: JSON Body mit applicationId
    
    Returns:
        JSON mit sofortmeldungUrl
    """
    logger.info(f"Generating Sofortmeldung for application {request.applicationId}")
    
    # Official Registration laden
    registration = await db.official_registrations.find_one({"applicationId": request.applicationId})
    if not registration:
        logger.error(f"Official registration for application {request.applicationId} not found")
        raise HTTPException(
            status_code=404,
            detail="Keine offizielle Anmeldung für diese Application gefunden"
        )
    
    registration_id = registration.get("id")
    registration_type = registration.get("registrationType")
    created_at = registration.get("createdAt")
    
    # Zusätzliche Daten aus Registration
    additional_data = {
        "geburtsdatum": registration.get("geburtsdatum"),
        "steuerId": registration.get("steuerId"),
        "sozialversicherungsnummer": registration.get("sozialversicherungsnummer"),
        "krankenkasse": registration.get("krankenkasse")
    }
    
    # Application laden
    application = await db.applications.find_one({"id": request.applicationId})
    if not application:
        logger.error(f"Application {request.applicationId} not found")
        raise HTTPException(status_code=404, detail="Application nicht gefunden")
    
    job_id = application.get("jobId")
    worker_id = application.get("workerId")
    employer_id = application.get("employerId")
    
    # Job laden
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        logger.error(f"Job {job_id} not found")
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    
    job.pop("_id", None)
    
    # Worker laden
    worker = await db.worker_profiles.find_one({"userId": worker_id})
    if not worker:
        logger.error(f"Worker {worker_id} not found")
        raise HTTPException(status_code=404, detail="Worker nicht gefunden")
    
    worker.pop("_id", None)
    
    # Pflichtfelder prüfen
    required_fields = ["geburtsdatum", "steuerId", "sozialversicherungsnummer", "krankenkasse"]
    missing = [f for f in required_fields if not worker.get(f)]
    
    if missing:
        logger.error(f"Worker {worker_id} missing required fields: {missing}")
        raise HTTPException(
            status_code=400,
            detail="worker_data_incomplete"
        )
    
    # Employer laden
    employer = await db.employer_profiles.find_one({"userId": employer_id})
    if not employer:
        logger.error(f"Employer {employer_id} not found")
        raise HTTPException(status_code=404, detail="Employer nicht gefunden")
    
    employer.pop("_id", None)
    
    # PDF generieren
    sofortmeldung_url = generate_sofortmeldung_pdf(
        registration_id=registration_id,
        job_data=job,
        employer_data=employer,
        worker_data=worker,
        registration_type=registration_type,
        created_at=created_at,
        additional_data=additional_data
    )
    
    # sofortmeldungUrl in official_registrations speichern
    await db.official_registrations.update_one(
        {"id": registration_id},
        {"$set": {
            "sofortmeldungUrl": sofortmeldung_url,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )
    
    logger.info(f"Sofortmeldung generated and saved: {sofortmeldung_url}")
    
    return {"sofortmeldungUrl": sofortmeldung_url}


# Request Body Model for generating Payroll
class GeneratePayrollRequest(BaseModel):
    applicationId: str

@api_router.post("/registrations/generate-payroll")
async def generate_payroll(request: GeneratePayrollRequest):
    """
    Generiert eine PDF-Lohnabrechnung für eine offizielle Anmeldung.
    
    Args:
        request: JSON Body mit applicationId
    
    Returns:
        JSON mit payrollUrl
    """
    logger.info(f"Generating payroll for application {request.applicationId}")
    
    # Official Registration laden
    registration = await db.official_registrations.find_one({"applicationId": request.applicationId})
    if not registration:
        logger.error(f"Official registration for application {request.applicationId} not found")
        raise HTTPException(
            status_code=404,
            detail="Keine offizielle Anmeldung für diese Application gefunden"
        )
    
    registration_id = registration.get("id")
    registration_type = registration.get("registrationType")
    created_at = registration.get("createdAt")
    
    # Zusätzliche Daten aus Registration
    additional_data = {
        "geburtsdatum": registration.get("geburtsdatum")
    }
    
    # Application laden
    application = await db.applications.find_one({"id": request.applicationId})
    if not application:
        logger.error(f"Application {request.applicationId} not found")
        raise HTTPException(status_code=404, detail="Application nicht gefunden")
    
    job_id = application.get("jobId")
    worker_id = application.get("workerId")
    employer_id = application.get("employerId")
    
    # Job laden
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        logger.error(f"Job {job_id} not found")
        raise HTTPException(status_code=404, detail="Job nicht gefunden")
    
    job.pop("_id", None)
    
    # Worker laden
    worker = await db.worker_profiles.find_one({"userId": worker_id})
    if not worker:
        logger.error(f"Worker {worker_id} not found")
        raise HTTPException(status_code=404, detail="Worker nicht gefunden")
    
    worker.pop("_id", None)
    
    # Pflichtfelder prüfen
    required_fields = ["geburtsdatum", "steuerId", "sozialversicherungsnummer", "krankenkasse"]
    missing = [f for f in required_fields if not worker.get(f)]
    
    if missing:
        logger.error(f"Worker {worker_id} missing required fields: {missing}")
        raise HTTPException(
            status_code=400,
            detail="worker_data_incomplete"
        )
    
    # Employer laden
    employer = await db.employer_profiles.find_one({"userId": employer_id})
    if not employer:
        logger.error(f"Employer {employer_id} not found")
        raise HTTPException(status_code=404, detail="Employer nicht gefunden")
    
    employer.pop("_id", None)
    
    # PDF generieren
    payroll_url = generate_payroll_pdf(
        registration_id=registration_id,
        job_data=job,
        employer_data=employer,
        worker_data=worker,
        registration_type=registration_type,
        created_at=created_at,
        additional_data=additional_data
    )
    
    # payrollUrl in official_registrations speichern
    await db.official_registrations.update_one(
        {"id": registration_id},
        {"$set": {
            "payrollUrl": payroll_url,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )
    
    logger.info(f"Payroll generated and saved: {payroll_url}")
    
    return {"payrollUrl": payroll_url}


# Include the router in the main app
app.include_router(api_router)

# Mount static files for generated contracts (must be after router)
app.mount(
    "/api/generated_contracts",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "generated_contracts")),
    name="generated_contracts"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://matchworker.preview.emergentagent.com",
        "http://localhost:19006",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
