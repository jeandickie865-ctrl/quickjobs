#!/usr/bin/env python3
"""
Check current jobs in database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_jobs():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Alle Jobs laden
    jobs = await db.jobs.find({}).to_list(length=None)
    
    print(f"📊 Anzahl Jobs in DB: {len(jobs)}")
    
    for i, job in enumerate(jobs, 1):
        print(f"\n🔹 Job {i}: {job.get('title', 'Kein Titel')}")
        print(f"   ID: {job.get('id')}")
        print(f"   📅 date: {job.get('date')}")
        print(f"   ⏰ start_at: {job.get('start_at')}")
        print(f"   ⏰ end_at: {job.get('end_at')}")
        print(f"   ⏰ startAt: {job.get('startAt')}")
        print(f"   ⏰ endAt: {job.get('endAt')}")
        print(f"   🕒 timeMode: {job.get('timeMode')}")
        print(f"   📍 Adresse: {job.get('address', {}).get('street')}, {job.get('address', {}).get('city')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_jobs())
