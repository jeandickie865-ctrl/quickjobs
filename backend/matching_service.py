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
    1. Category (must be identical)
    2. Radius (Haversine distance)
    3. Required tags (all must be present)
    4. Optional tags (at least one must be present if specified)
    
    Args:
        worker: Worker profile document with:
            - category: str
            - lat: float
            - lon: float
            - radius: float (in km)
            - tags_required_all: List[str] (optional)
            - tags_required_any: List[str] (optional)
        job: Job document with:
            - category: str
            - lat: float
            - lon: float
            - tags: List[str] (optional)
    
    Returns:
        True if worker matches job, False otherwise
    """
    
    # 1. Category check (must be identical)
    if job.get("category") != worker.get("category"):
        return False
    
    # 2. Radius check (Haversine distance)
    try:
        worker_lat = float(worker.get("lat", 0))
        worker_lon = float(worker.get("lon", 0))
        job_lat = float(job.get("lat", 0))
        job_lon = float(job.get("lon", 0))
        worker_radius = float(worker.get("radius", 0))
        
        distance = haversine(worker_lat, worker_lon, job_lat, job_lon)
        
        if distance > worker_radius:
            return False
    except (ValueError, TypeError):
        # If coordinates are missing or invalid, no match
        return False
    
    # Normalize tags to lowercase
    job_tags = [t.lower() for t in job.get("tags", [])]
    req_all = [t.lower() for t in worker.get("tags_required_all", [])]
    req_any = [t.lower() for t in worker.get("tags_required_any", [])]
    
    # 3. Required all tags (all must be present in job)
    for tag in req_all:
        if tag not in job_tags:
            return False
    
    # 4. Required any tags (at least one must be present if specified)
    if len(req_any) > 0:
        if not any(tag in job_tags for tag in req_any):
            return False
    
    return True
