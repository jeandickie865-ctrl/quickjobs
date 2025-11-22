# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from dotenv import load_dotenv

load_dotenv()

# Import routers
from auth.router import router as auth_router
from users.router import router as users_router
from profiles.employer_router import router as employer_router
from profiles.worker_router import router as worker_router
from jobs.router import router as jobs_router
from matching.router import router as matching_router
from upload.router import router as upload_router

# Create FastAPI app
app = FastAPI(
    title="BACKUP API",
    description="Backend API for BACKUP job matching platform (Auftraggeber & Jobstarter)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with /api prefix
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(employer_router, prefix="/api/profiles/employer", tags=["Employer Profiles"])
app.include_router(worker_router, prefix="/api/profiles/worker", tags=["Worker Profiles"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(matching_router, prefix="/api/matching", tags=["Matching"])

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "BACKUP API v1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }

# Health check endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "backup-api",
        "version": "1.0.0"
    }