"""
Job Matching Service
Implements worker-to-job matching logic with Haversine distance calculation
"""

from math import radians, sin, cos, asin, sqrt
from typing import Dict, Any


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    
    Args:
        lat1, lon1: Latitude and longitude of point 1
        lat2, lon2: Latitude and longitude of point 2
    
    Returns:
        Distance in kilometers
    """
    # Convert to float and radians
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    
    # Earth radius in kilometers
    r = 6371
    
    # Differences
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    
    # Haversine formula
    a = sin(d_lat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon/2)**2
    c = 2 * asin(sqrt(a))
    
    return r * c


def match_worker_with_job(worker: Dict[str, Any], job: Dict[str, Any]) -> bool:
    """
    Check if a worker matches a job based on:
    1. Category (must be in worker's categories list)
    2. Radius (Haversine distance)
    3. Tags (if job has tags, worker must have at least one matching tag)
    
    Args:
        worker: Worker profile document with:
            - categories: List[str]
            - homeLat: float
            - homeLon: float
            - radiusKm: int
            - selectedTags: List[str]
        job: Job document with:
            - category: str
            - lat: float
            - lon: float
            - tags: List[str] (optional)
    
    Returns:
        True if worker matches job, False otherwise
    """
    
    # 1. Category check
    # Worker hat: categories: List[str]
    worker_categories = worker.get("categories", [])
    if job.get("category") not in worker_categories:
        return False
    
    # 2. Radius check
    # Worker hat: homeLat, homeLon, radiusKm
    try:
        worker_lat = float(worker.get("homeLat", 0))
        worker_lon = float(worker.get("homeLon", 0))
        job_lat = float(job.get("lat", 0))
        job_lon = float(job.get("lon", 0))
        worker_radius = float(worker.get("radiusKm", 0))
        
        distance = haversine(worker_lat, worker_lon, job_lat, job_lon)
        
        if distance > worker_radius:
            return False
    except (ValueError, TypeError):
        # If coordinates are missing or invalid, no match
        return False
    
    # 3. Tags check
    # Worker hat: selectedTags
    # Jobs haben: job["tags"]
    job_tags = [t.lower() for t in job.get("tags", [])]
    worker_tags = [t.lower() for t in worker.get("selectedTags", [])]
    
    # Wenn Job Tags hat, muss Worker mindestens einen davon besitzen
    if len(job_tags) > 0:
        if not any(tag in job_tags for tag in worker_tags):
            return False
    
    return True
