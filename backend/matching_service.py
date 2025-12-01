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
    Check if a worker matches a job based on NEW TAXONOMY STRUCTURE:
    1. Category (job.category must equal worker.categories[0])
    2. Subcategory (worker.subcategories must include job.subcategory)
    3. Qualifications (if job.qualifications exists, worker must have ALL of them)
    4. Radius (Haversine distance)
    
    Args:
        worker: Worker profile document with:
            - categories: List[str] (contains exactly ONE category)
            - subcategories: List[str]
            - qualifications: List[str]
            - homeLat: float
            - homeLon: float
            - radiusKm: int
        job: Job document with:
            - category: str
            - subcategory: str
            - qualifications: List[str] (optional)
            - lat: float
            - lon: float
    
    Returns:
        True if worker matches job, False otherwise
    """
    
    # 1. Category check - must match exactly
    worker_categories = worker.get("categories", [])
    if not worker_categories or job.get("category") != worker_categories[0]:
        return False
    
    # 2. Subcategory check - worker must have this subcategory
    worker_subcategories = worker.get("subcategories", [])
    job_subcategory = job.get("subcategory")
    if job_subcategory and job_subcategory not in worker_subcategories:
        return False
    
    # 3. Qualifications check - worker must have ALL job qualifications
    job_qualifications = job.get("qualifications", [])
    if job_qualifications:
        worker_qualifications = worker.get("qualifications", [])
        for qual in job_qualifications:
            if qual not in worker_qualifications:
                return False
    
    # 4. Radius check (unchanged)
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
    
    return True
