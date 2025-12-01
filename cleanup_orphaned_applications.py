#!/usr/bin/env python3
"""
Delete applications that reference non-existent jobs
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def cleanup_orphaned_applications():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Lade alle Applications
    all_apps = await db.applications.find({}).to_list(length=None)
    
    print(f"📊 Total Applications in DB: {len(all_apps)}\n")
    
    orphaned = []
    
    for app in all_apps:
        job_id = app.get('jobId')
        job = await db.jobs.find_one({"id": job_id})
        
        if not job:
            orphaned.append(app)
            print(f"❌ Orphaned: {app.get('id')} → Job {job_id} nicht gefunden")
    
    print(f"\n📈 ERGEBNIS:")
    print(f"   Verwaiste Applications: {len(orphaned)}")
    
    if orphaned:
        print(f"\n⚠️  Lösche {len(orphaned)} verwaiste Applications...")
        
        orphaned_ids = [app["_id"] for app in orphaned]
        result = await db.applications.delete_many({"_id": {"$in": orphaned_ids}})
        
        print(f"✅ {result.deleted_count} Applications gelöscht")
    else:
        print(f"✅ Keine verwaisten Applications gefunden")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_orphaned_applications())
