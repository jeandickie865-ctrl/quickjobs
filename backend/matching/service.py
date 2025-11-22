# matching/service.py
import math
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jobs.models import Job
from profiles.worker_models import WorkerProfile

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

async def find_matching_jobs(
    db: AsyncSession,
    worker_profile: WorkerProfile
) -> List[Job]:
    """
    Find jobs that match the worker's profile based on:
    - Distance (within worker's radius)
    - Categories (overlap)
    - Qualifications (overlap)
    """
    # Get all jobs
    result = await db.execute(select(Job))
    all_jobs = result.scalars().all()
    
    matching_jobs = []
    
    for job in all_jobs:
        # Skip jobs without location data
        if not (job.lat and job.lon and worker_profile.lat and worker_profile.lon):
            continue
        
        # Calculate distance
        distance = haversine_distance(
            worker_profile.lat,
            worker_profile.lon,
            job.lat,
            job.lon
        )
        
        # Check if within radius
        if distance > worker_profile.radius_km:
            continue
        
        # Check category overlap
        if job.categories and worker_profile.categories:
            category_match = bool(set(job.categories) & set(worker_profile.categories))
            if not category_match:
                continue
        
        # Check qualification overlap (optional, adds to score)
        qualification_match = True
        if job.qualifications and worker_profile.qualifications:
            qualification_match = bool(set(job.qualifications) & set(worker_profile.qualifications))
        
        # Add job to results with distance info
        matching_jobs.append(job)
    
    # Sort by distance (closest first)
    matching_jobs.sort(
        key=lambda j: haversine_distance(
            worker_profile.lat,
            worker_profile.lon,
            j.lat,
            j.lon
        )
    )
    
    return matching_jobs
