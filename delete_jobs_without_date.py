#!/usr/bin/env python3
"""
Script to delete all jobs without proper date fields
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def delete_jobs_without_date():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Finde alle Jobs ohne date, start_at oder end_at
    jobs_to_delete = await db.jobs.find({
        "$or": [
            {"date": {"$exists": False}},
            {"date": None},
            {"date": "2025-12-01"}  # Auch die heute-reparierten Jobs
        ]
    }).to_list(length=None)
    
    print(f"📊 Gefundene Jobs ohne valide Zeitfelder: {len(jobs_to_delete)}")
    
    if not jobs_to_delete:
        print("✅ Keine Jobs zum Löschen gefunden")
        client.close()
        return
    
    # Liste die Jobs auf
    for i, job in enumerate(jobs_to_delete, 1):
        print(f"  {i}. {job.get('title', 'Kein Titel')} (ID: {job.get('id')}, date: {job.get('date')})")
    
    print(f"\n⚠️  WARNUNG: {len(jobs_to_delete)} Jobs werden gelöscht!")
    
    # Lösche die Jobs
    result = await db.jobs.delete_many({
        "$or": [
            {"date": {"$exists": False}},
            {"date": None},
            {"date": "2025-12-01"}
        ]
    })
    
    print(f"✅ {result.deleted_count} Jobs erfolgreich gelöscht")
    
    # Zähle verbleibende Jobs
    remaining = await db.jobs.count_documents({})
    print(f"📈 Verbleibende Jobs in der Datenbank: {remaining}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_jobs_without_date())
