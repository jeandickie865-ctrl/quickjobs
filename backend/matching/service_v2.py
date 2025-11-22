# matching/service_v2.py
from typing import List, Tuple, Set
from math import radians, sin, cos, sqrt, atan2
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jobs.models import Job
from profiles.worker_models import WorkerProfile

# Pflichtqualifikationen aus der Taxonomie
# Diese MÜSSEN vom Worker erfüllt werden, wenn sie im Job gefordert sind
MANDATORY_QUALIFICATIONS = {
    # Lieferservice
    "Führerschein Klasse B",
    "Führerschein AM",
    "Führerschein A1",
    "eigener Pkw",
    "eigenes Fahrrad",
    "eigener Roller / Moped",
    "eigenes E-Bike",
    "eigener 125ccm",
    "eigener Transporter",
    
    # Lager & Logistik
    "Staplerschein",
    
    # Sicherheit
    "Sachkunde nach § 34a GewO",
    "Unterrichtung nach § 34a GewO",
    "Bewacher-ID",
    "Polizeiliches Führungszeugnis",
    
    # Gastronomie
    "Gesundheitsausweis / Hygieneschulung",
    
    # Kinderbetreuung
    "polizeiliches Führungszeugnis",
    "Erste Hilfe am Kind",
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two points using Haversine formula"""
    R = 6371  # Earth radius in km
    
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

def calculate_match_score(
    job_categories: List[str],
    job_qualifications: List[str],
    worker_categories: List[str],
    worker_qualifications: List[str],
    worker_activities: List[str],
    distance_km: float
) -> Tuple[float, dict]:
    """
    Calculate match score based on categories, qualifications, activities, and distance
    
    Scoring:
    - 50 points for qualification matches
    - 30 points for activity overlap
    - 20 points for category overlap
    - Subtract distance_km * 0.3
    
    Returns:
        Tuple[float, dict]: (total_score, breakdown)
    """
    score = 0.0
    breakdown = {
        "qualifications": 0,
        "activities": 0,
        "categories": 0,
        "distance_penalty": 0,
    }
    
    # Category overlap (20 points max)
    job_categories_set = set(job_categories or [])
    worker_categories_set = set(worker_categories or [])
    category_overlap = len(job_categories_set.intersection(worker_categories_set))
    
    if category_overlap > 0:
        # Normalize to 20 points max
        category_score = min(20, category_overlap * 10)
        score += category_score
        breakdown["categories"] = category_score
    
    # Qualification overlap (50 points max)
    job_qualifications_set = set(job_qualifications or [])
    worker_qualifications_set = set(worker_qualifications or [])
    qualification_overlap = len(job_qualifications_set.intersection(worker_qualifications_set))
    
    if qualification_overlap > 0:
        # Each matching qualification is worth ~10 points
        qualification_score = min(50, qualification_overlap * 10)
        score += qualification_score
        breakdown["qualifications"] = qualification_score
    
    # Activity overlap (30 points max)
    # Note: Activities are not stored in Job model, but could be added
    # For now, we use worker activities as a bonus
    if worker_activities:
        activity_score = min(30, len(worker_activities) * 3)
        score += activity_score
        breakdown["activities"] = activity_score
    
    # Distance penalty
    distance_penalty = distance_km * 0.3
    score -= distance_penalty
    breakdown["distance_penalty"] = distance_penalty
    
    return max(0, score), breakdown

def check_mandatory_qualifications(
    job_qualifications: List[str],
    worker_qualifications: List[str]
) -> Tuple[bool, List[str]]:
    """
    Check if worker has all mandatory qualifications required by the job
    
    Returns:
        Tuple[bool, List[str]]: (has_all_mandatory, missing_mandatory)
    """
    job_quals_set = set(job_qualifications or [])
    worker_quals_set = set(worker_qualifications or [])
    
    # Find which mandatory qualifications the job requires
    required_mandatory = job_quals_set.intersection(MANDATORY_QUALIFICATIONS)
    
    # Check if worker has all of them
    missing = required_mandatory - worker_quals_set
    
    return len(missing) == 0, list(missing)

async def find_matching_jobs_v2(
    db: AsyncSession,
    worker_lat: float,
    worker_lon: float,
    worker_categories: List[str],
    worker_qualifications: List[str],
    worker_activities: List[str],
    worker_radius_km: int
) -> List[Tuple[Job, float, dict]]:
    """
    Find jobs matching worker profile with improved scoring
    
    Filters:
    1. Distance <= worker_radius_km (MUST)
    2. Category overlap (MUST have at least 1)
    3. Mandatory qualifications (MUST have all)
    
    Returns:
        List of tuples: (Job, score, breakdown)
        Sorted by score descending
    """
    # Get all jobs
    result = await db.execute(select(Job))
    all_jobs = result.scalars().all()
    
    matching_jobs = []
    
    for job in all_jobs:
        # Skip jobs without location
        if not job.lat or not job.lon:
            continue
        
        # 1. Check distance
        distance = haversine_distance(worker_lat, worker_lon, job.lat, job.lon)
        if distance > worker_radius_km:
            continue
        
        # 2. Check category overlap (MUST)
        job_categories_set = set(job.categories or [])
        worker_categories_set = set(worker_categories or [])
        
        if not job_categories_set.intersection(worker_categories_set):
            continue
        
        # 3. Check mandatory qualifications (MUST)
        has_mandatory, missing = check_mandatory_qualifications(
            job.qualifications or [],
            worker_qualifications or []
        )
        
        if not has_mandatory:
            # Worker is missing mandatory qualifications
            continue
        
        # Calculate match score
        score, breakdown = calculate_match_score(
            job.categories or [],
            job.qualifications or [],
            worker_categories or [],
            worker_qualifications or [],
            worker_activities or [],
            distance
        )
        
        matching_jobs.append((job, score, breakdown))
    
    # Sort by score descending
    matching_jobs.sort(key=lambda x: x[1], reverse=True)
    
    return matching_jobs

async def find_matching_workers_for_job(
    db: AsyncSession,
    job: Job,
    employer_radius_km: int
) -> List[Tuple[WorkerProfile, float, dict]]:
    """
    Find workers matching a specific job
    
    Same filtering logic as find_matching_jobs_v2, but reversed
    """
    if not job.lat or not job.lon:
        return []
    
    # Get all worker profiles
    result = await db.execute(select(WorkerProfile))
    all_workers = result.scalars().all()
    
    matching_workers = []
    
    for worker in all_workers:
        # Skip workers without location
        if not worker.lat or not worker.lon:
            continue
        
        # 1. Check distance (use employer's radius)
        distance = haversine_distance(job.lat, job.lon, worker.lat, worker.lon)
        if distance > employer_radius_km:
            continue
        
        # 2. Check category overlap (MUST)
        job_categories_set = set(job.categories or [])
        worker_categories_set = set(worker.categories or [])
        
        if not job_categories_set.intersection(worker_categories_set):
            continue
        
        # 3. Check mandatory qualifications (MUST)
        has_mandatory, missing = check_mandatory_qualifications(
            job.qualifications or [],
            worker.qualifications or []
        )
        
        if not has_mandatory:
            continue
        
        # Calculate match score
        score, breakdown = calculate_match_score(
            job.categories or [],
            job.qualifications or [],
            worker.categories or [],
            worker.qualifications or [],
            worker.activities or [],
            distance
        )
        
        matching_workers.append((worker, score, breakdown))
    
    # Sort by score descending
    matching_workers.sort(key=lambda x: x[1], reverse=True)
    
    return matching_workers
