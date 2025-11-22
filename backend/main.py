# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base

from auth.router import router as auth_router
from users.router import router as users_router
from profiles.employer_router import router as employer_router
from profiles.worker_router import router as worker_router
from jobs.router import router as jobs_router
from matching.router import router as matching_router

app = FastAPI(
    title="BACKUP API",
    description="Backend API for BACKUP job matching platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(employer_router, prefix="/api/profiles/employer", tags=["employer-profiles"])
app.include_router(worker_router, prefix="/api/profiles/worker", tags=["worker-profiles"])
app.include_router(jobs_router, prefix="/api/jobs", tags=["jobs"])
app.include_router(matching_router, prefix="/api/matching", tags=["matching"])

@app.get("/")
async def root():
    return {"message": "BACKUP API v1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
