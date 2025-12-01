#!/usr/bin/env python3
"""
Script to check how jobs are stored in MongoDB
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
    
    # Hole alle Jobs
    jobs = await db.jobs.find({}).to_list(length=10)
    
    print(f"📊 Gefundene Jobs: {len(jobs)}")
    print("=" * 80)
    
    if not jobs:
        print("❌ Keine Jobs in der Datenbank gefunden")
        return
    
    for i, job in enumerate(jobs, 1):
        print(f"\n🔹 Job {i}: {job.get('title', 'Kein Titel')}")
        print(f"   ID: {job.get('id', 'Keine ID')}")
        
        address = job.get('address', {})
        print(f"   Adresse-Objekt: {address}")
        
        # Prüfe beide Formate
        if isinstance(address, dict):
            street = address.get('street')
            house_camel = address.get('houseNumber')  # camelCase
            house_snake = address.get('house_number')  # snake_case
            postal_camel = address.get('postalCode')
            postal_snake = address.get('postal_code')
            city = address.get('city')
            
            print(f"   📍 Straße: {street}")
            print(f"   🏠 Hausnummer (camelCase): {house_camel}")
            print(f"   🏠 Hausnummer (snake_case): {house_snake}")
            print(f"   📮 PLZ (camelCase): {postal_camel}")
            print(f"   📮 PLZ (snake_case): {postal_snake}")
            print(f"   🏙️  Stadt: {city}")
            
            if not house_camel and not house_snake:
                print("   ⚠️  KEINE Hausnummer gefunden!")
        else:
            print(f"   ⚠️  Adresse ist kein Objekt: {type(address)}")
    
    print("\n" + "=" * 80)
    
    # Statistik
    jobs_with_house_camel = 0
    jobs_with_house_snake = 0
    jobs_without_house = 0
    
    all_jobs = await db.jobs.find({}).to_list(length=None)
    
    for job in all_jobs:
        address = job.get('address', {})
        if isinstance(address, dict):
            if address.get('houseNumber'):
                jobs_with_house_camel += 1
            elif address.get('house_number'):
                jobs_with_house_snake += 1
            else:
                jobs_without_house += 1
    
    print("\n📈 STATISTIK:")
    print(f"   Total Jobs: {len(all_jobs)}")
    print(f"   ✅ Mit houseNumber (camelCase): {jobs_with_house_camel}")
    print(f"   ✅ Mit house_number (snake_case): {jobs_with_house_snake}")
    print(f"   ❌ OHNE Hausnummer: {jobs_without_house}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_jobs())
