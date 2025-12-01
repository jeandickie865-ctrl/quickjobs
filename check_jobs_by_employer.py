#!/usr/bin/env python3
"""
Check jobs grouped by employer
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
    
    print(f"📊 Anzahl Jobs gesamt: {len(jobs)}\n")
    
    # Nach Employer gruppieren
    employers = {}
    for job in jobs:
        emp_id = job.get('employerId', 'UNBEKANNT')
        if emp_id not in employers:
            employers[emp_id] = []
        employers[emp_id].append(job)
    
    for emp_id, emp_jobs in employers.items():
        print(f"👤 Employer: {emp_id}")
        print(f"   Anzahl Jobs: {len(emp_jobs)}")
        for job in emp_jobs:
            print(f"   - {job.get('title')} (ID: {job.get('id')}, date: {job.get('date')})")
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_jobs())
