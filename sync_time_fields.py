#!/usr/bin/env python3
"""
Script to sync time fields in existing jobs:
- Copy startAt → start_at
- Copy endAt → end_at
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def sync_time_fields():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Alle Jobs laden
    jobs = await db.jobs.find({}).to_list(length=None)
    
    print(f"📊 Anzahl Jobs: {len(jobs)}")
    
    updated_count = 0
    
    for job in jobs:
        updates = {}
        
        # Copy startAt → start_at (wenn start_at fehlt)
        if job.get("startAt") and not job.get("start_at"):
            updates["start_at"] = job["startAt"]
        
        # Copy endAt → end_at (wenn end_at fehlt)
        if job.get("endAt") and not job.get("end_at"):
            updates["end_at"] = job["endAt"]
        
        # Copy start_at → startAt (wenn startAt fehlt)
        if job.get("start_at") and not job.get("startAt"):
            updates["startAt"] = job["start_at"]
        
        # Copy end_at → endAt (wenn endAt fehlt)
        if job.get("end_at") and not job.get("endAt"):
            updates["endAt"] = job["end_at"]
        
        if updates:
            await db.jobs.update_one(
                {"_id": job["_id"]},
                {"$set": updates}
            )
            updated_count += 1
            print(f"✅ Updated job {job.get('id')}: {updates}")
    
    print(f"\n📈 FERTIG: {updated_count} von {len(jobs)} Jobs aktualisiert")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(sync_time_fields())
