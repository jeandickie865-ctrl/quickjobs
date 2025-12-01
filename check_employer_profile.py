#!/usr/bin/env python3
"""
Check employer profile data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_employer():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Lade Employer-Profil für user_mia_web_de
    employer = await db.employer_profiles.find_one({"userId": "user_mia_web_de"})
    
    if not employer:
        print("❌ Employer-Profil nicht gefunden")
        return
    
    print("📊 Employer-Profil:")
    print(f"   userId: {employer.get('userId')}")
    print(f"   firstName: {employer.get('firstName')}")
    print(f"   lastName: {employer.get('lastName')}")
    print(f"   company: {employer.get('company')}")
    print(f"   companyName: {employer.get('companyName')}")
    print(f"\n🏠 homeAddress:")
    
    home_addr = employer.get('homeAddress')
    if home_addr:
        print(f"   Type: {type(home_addr)}")
        print(f"   Content: {home_addr}")
    else:
        print(f"   ❌ homeAddress fehlt!")
    
    print(f"\n📍 Root-Level Adressfelder:")
    print(f"   street: {employer.get('street')}")
    print(f"   houseNumber: {employer.get('houseNumber')}")
    print(f"   house_number: {employer.get('house_number')}")
    print(f"   postalCode: {employer.get('postalCode')}")
    print(f"   postal_code: {employer.get('postal_code')}")
    print(f"   city: {employer.get('city')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_employer())
