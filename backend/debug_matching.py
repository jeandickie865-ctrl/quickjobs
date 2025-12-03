#!/usr/bin/env python3
"""Debug script to check why john@web.de doesn't see elisa@web.de's job"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from matching_service import match_worker_with_job
import json

async def debug_matching():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.backup
    
    # Get Elisa's latest job
    elisa_jobs = await db.jobs.find({"employerId": "user_elisa_web_de"}).sort("createdAt", -1).limit(1).to_list(1)
    
    if not elisa_jobs:
        print("❌ No jobs found for elisa@web.de")
        return
    
    elisa_job = elisa_jobs[0]
    print("=" * 80)
    print("📋 ELISA'S JOB:")
    print("=" * 80)
    print(f"ID: {elisa_job.get('id')}")
    print(f"Title: {elisa_job.get('title')}")
    print(f"Category: {elisa_job.get('category')}")
    print(f"Subcategory: {elisa_job.get('subcategory')}")
    print(f"Qualifications: {elisa_job.get('qualifications')}")
    print(f"Status: {elisa_job.get('status')}")
    print(f"Date: {elisa_job.get('date')}")
    print(f"Location: lat={elisa_job.get('lat')}, lon={elisa_job.get('lon')}")
    print(f"MatchedWorkerId: {elisa_job.get('matchedWorkerId')}")
    
    # Get John's profile
    john_profile = await db.worker_profiles.find_one({"userId": "user_john_web_de"})
    
    if not john_profile:
        print("\n❌ No profile found for john@web.de")
        return
    
    print("\n" + "=" * 80)
    print("👤 JOHN'S PROFILE:")
    print("=" * 80)
    print(f"Categories: {john_profile.get('categories')}")
    print(f"Subcategories: {john_profile.get('subcategories')}")
    print(f"Qualifications: {john_profile.get('qualifications')}")
    print(f"Location: lat={john_profile.get('homeLat')}, lon={john_profile.get('homeLon')}")
    print(f"Radius: {john_profile.get('radiusKm')} km")
    
    # Check if John has applied to this job
    application = await db.applications.find_one({"workerId": "user_john_web_de", "jobId": elisa_job.get('id')})
    print(f"\nHas applied: {application is not None}")
    if application:
        print(f"Application ID: {application.get('id')}")
        print(f"Application Status: {application.get('status')}")
    
    # Run matching logic
    print("\n" + "=" * 80)
    print("🔍 MATCHING RESULT:")
    print("=" * 80)
    
    match_result = match_worker_with_job(john_profile, elisa_job)
    print(f"Match: {match_result}")
    
    # Detailed matching checks
    print("\n📊 DETAILED CHECKS:")
    
    # 1. Category
    worker_categories = john_profile.get("categories", [])
    job_category = elisa_job.get("category")
    category_match = job_category in worker_categories if worker_categories else False
    print(f"✓ Category: {category_match} (Job: {job_category}, Worker: {worker_categories})")
    
    # 2. Subcategory
    job_subcategory = elisa_job.get("subcategory")
    if job_subcategory:
        worker_subcategories = john_profile.get("subcategories", [])
        subcategory_match = job_subcategory in worker_subcategories
        print(f"✓ Subcategory: {subcategory_match} (Job: {job_subcategory}, Worker: {worker_subcategories})")
    else:
        print(f"✓ Subcategory: N/A (Job has no subcategory)")
    
    # 3. Qualifications
    job_qualifications = elisa_job.get("qualifications", [])
    if job_qualifications:
        worker_qualifications = john_profile.get("qualifications", [])
        missing_quals = [q for q in job_qualifications if q not in worker_qualifications]
        qual_match = len(missing_quals) == 0
        print(f"✓ Qualifications: {qual_match} (Job requires: {job_qualifications}, Worker has: {worker_qualifications})")
        if missing_quals:
            print(f"  ❌ Missing: {missing_quals}")
    else:
        print(f"✓ Qualifications: N/A (Job has no requirements)")
    
    # 4. Radius
    from matching_service import haversine
    try:
        worker_lat = float(john_profile.get("homeLat", 0))
        worker_lon = float(john_profile.get("homeLon", 0))
        job_lat = float(elisa_job.get("lat", 0))
        job_lon = float(elisa_job.get("lon", 0))
        worker_radius = float(john_profile.get("radiusKm", 0))
        
        distance = haversine(worker_lat, worker_lon, job_lat, job_lon)
        radius_match = distance <= worker_radius
        print(f"✓ Radius: {radius_match} (Distance: {distance:.2f} km, Limit: {worker_radius} km)")
    except (ValueError, TypeError) as e:
        print(f"✗ Radius: ERROR - {e}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_matching())
