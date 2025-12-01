#!/usr/bin/env python3
"""
Script to check a specific job's time fields
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_job():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Hole den Job mit Erkrath Adresse
    job = await db.jobs.find_one({"address.city": "Erkrath"})
    
    if not job:
        print("❌ Job nicht gefunden")
        return
    
    print(f"🔹 Job: {job.get('title', 'Kein Titel')}")
    print(f"   ID: {job.get('id', 'Keine ID')}")
    print("\n📅 ZEITFELDER:")
    print(f"   date: {job.get('date')}")
    print(f"   start_at: {job.get('start_at')}")
    print(f"   end_at: {job.get('end_at')}")
    print(f"   startAt: {job.get('startAt')}")
    print(f"   endAt: {job.get('endAt')}")
    print(f"   timeMode: {job.get('timeMode')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_job())
