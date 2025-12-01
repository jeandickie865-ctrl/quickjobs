#!/usr/bin/env python3
"""
Check worker applications and their job status
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_applications():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Lade alle Applications für user_john_web_de
    apps = await db.applications.find({"workerId": "user_john_web_de"}).to_list(length=None)
    
    print(f"📊 Anzahl Applications für user_john_web_de: {len(apps)}\n")
    
    for i, app in enumerate(apps, 1):
        print(f"🔹 Application {i}:")
        print(f"   ID: {app.get('id')}")
        print(f"   Job ID: {app.get('jobId')}")
        print(f"   Status: {app.get('status')}")
        print(f"   Created: {app.get('createdAt')}")
        
        # Prüfe ob Job noch existiert
        job = await db.jobs.find_one({"id": app.get('jobId')})
        if job:
            print(f"   ✅ Job existiert: {job.get('title')}")
        else:
            print(f"   ❌ Job NICHT gefunden!")
        print()
    
    # Zähle Status
    pending = sum(1 for a in apps if a.get('status') == 'pending')
    accepted = sum(1 for a in apps if a.get('status') == 'accepted')
    rejected = sum(1 for a in apps if a.get('status') == 'rejected')
    
    print(f"\n📈 STATISTIK:")
    print(f"   Pending: {pending}")
    print(f"   Accepted: {accepted}")
    print(f"   Rejected: {rejected}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_applications())
