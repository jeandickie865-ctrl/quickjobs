#!/usr/bin/env python3
"""
Setup test data for WorkerMatch app
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid

load_dotenv('/app/backend/.env')
mongo_url = os.getenv('MONGO_URL')

client = MongoClient(mongo_url)
db = client['shiftmatch']

# Clear existing data
print("🗑️  Clearing existing data...")
db.worker_profiles.delete_many({})
db.employer_profiles.delete_many({})
db.jobs.delete_many({})
db.applications.delete_many({})

# Create Worker Profile for John Dickie
print("👤 Creating worker profile...")
worker_profile = {
    'userId': 'user_john_dickies_helden_de',
    'firstName': 'John',
    'lastName': 'Dickie',
    'email': 'john@dickies-helden.de',
    'phone': '01622572545',
    'categories': ['sicherheit'],
    'selectedTags': ['sachkunde', 'event_security'],
    'activities': ['security_guard', 'event_security'],
    'qualifications': ['sachkunde'],
    'homeLat': 52.520008,
    'homeLon': 13.404954,
    'radiusKm': 20,
    'photoUrl': None,
    'createdAt': datetime.utcnow().isoformat(),
    'updatedAt': datetime.utcnow().isoformat()
}
db.worker_profiles.insert_one(worker_profile)
print(f"✅ Worker profile created: {worker_profile['userId']}")

# Create Employer Profile
print("👔 Creating employer profile...")
employer_id = 'user_test_employer_de'
employer_profile = {
    'userId': employer_id,
    'firstName': 'Test',
    'lastName': 'Employer',
    'companyName': 'Test Company GmbH',
    'email': 'employer@test.de',
    'phone': '030123456',
    'street': 'Teststraße',
    'houseNumber': '123',
    'postalCode': '10115',
    'city': 'Berlin',
    'country': 'Deutschland',
    'lat': 52.525,
    'lon': 13.405,
    'paymentMethod': 'rechnung',
    'createdAt': datetime.utcnow().isoformat(),
    'updatedAt': datetime.utcnow().isoformat()
}
db.employer_profiles.insert_one(employer_profile)
print(f"✅ Employer profile created: {employer_id}")

# Create 3 Test Jobs
print("💼 Creating test jobs...")
jobs = []

# Job 1: Security Job (matches worker profile)
job1_id = f"job_{uuid.uuid4().hex[:12]}"
job1 = {
    'id': job1_id,
    'employerId': employer_id,
    'employerName': 'Test Company GmbH',
    'title': 'Sicherheitskraft für Event',
    'description': 'Suchen erfahrene Sicherheitskraft für großes Event',
    'category': 'sicherheit',
    'timeMode': 'time_exact',
    'startAt': (datetime.utcnow() + timedelta(days=7)).isoformat(),
    'endAt': (datetime.utcnow() + timedelta(days=7, hours=8)).isoformat(),
    'hours': None,
    'dueAt': None,
    'location': {
        'street': 'Eventstraße',
        'houseNumber': '1',
        'postalCode': '10115',
        'city': 'Berlin',
        'country': 'Deutschland',
        'lat': 52.520008,
        'lon': 13.404954
    },
    'requiredAllTags': ['sachkunde'],
    'requiredAnyTags': [],
    'workerAmountCents': 2000,
    'platformFeeCents': 400,
    'totalAmountCents': 2400,
    'status': 'open',
    'matchedWorkerId': None,
    'createdAt': datetime.utcnow().isoformat(),
    'updatedAt': datetime.utcnow().isoformat()
}
jobs.append(job1)

# Job 2: Another Security Job
job2_id = f"job_{uuid.uuid4().hex[:12]}"
job2 = {
    'id': job2_id,
    'employerId': employer_id,
    'employerName': 'Test Company GmbH',
    'title': 'Nachtwächter gesucht',
    'description': 'Nachtwächter für Baustelle',
    'category': 'sicherheit',
    'timeMode': 'time_exact',
    'startAt': (datetime.utcnow() + timedelta(days=3)).isoformat(),
    'endAt': (datetime.utcnow() + timedelta(days=3, hours=12)).isoformat(),
    'hours': None,
    'dueAt': None,
    'location': {
        'street': 'Baustraße',
        'houseNumber': '5',
        'postalCode': '10117',
        'city': 'Berlin',
        'country': 'Deutschland',
        'lat': 52.523,
        'lon': 13.408
    },
    'requiredAllTags': [],
    'requiredAnyTags': [],
    'workerAmountCents': 1800,
    'platformFeeCents': 360,
    'totalAmountCents': 2160,
    'status': 'open',
    'matchedWorkerId': None,
    'createdAt': datetime.utcnow().isoformat(),
    'updatedAt': datetime.utcnow().isoformat()
}
jobs.append(job2)

# Job 3: Gastronomie Job (doesn't match worker)
job3_id = f"job_{uuid.uuid4().hex[:12]}"
job3 = {
    'id': job3_id,
    'employerId': employer_id,
    'employerName': 'Test Company GmbH',
    'title': 'Kellner für Hochzeit',
    'description': 'Freundlicher Kellner gesucht',
    'category': 'gastronomie',
    'timeMode': 'time_exact',
    'startAt': (datetime.utcnow() + timedelta(days=14)).isoformat(),
    'endAt': (datetime.utcnow() + timedelta(days=14, hours=6)).isoformat(),
    'hours': None,
    'dueAt': None,
    'location': {
        'street': 'Feststraße',
        'houseNumber': '10',
        'postalCode': '10115',
        'city': 'Berlin',
        'country': 'Deutschland',
        'lat': 52.518,
        'lon': 13.402
    },
    'requiredAllTags': [],
    'requiredAnyTags': [],
    'workerAmountCents': 1500,
    'platformFeeCents': 300,
    'totalAmountCents': 1800,
    'status': 'open',
    'matchedWorkerId': None,
    'createdAt': datetime.utcnow().isoformat(),
    'updatedAt': datetime.utcnow().isoformat()
}
jobs.append(job3)

db.jobs.insert_many(jobs)
print(f"✅ Created {len(jobs)} test jobs")

print("\n" + "="*50)
print("✅ TEST DATA SETUP COMPLETE!")
print("="*50)
print(f"\n👤 Worker Login:")
print(f"   Email: john@dickies-helden.de")
print(f"   Password: (your password)")
print(f"\n👔 Employer Login:")
print(f"   Email: employer@test.de")
print(f"   Password: (your password)")
print(f"\n💼 Jobs created: {len(jobs)}")
print(f"   - {jobs[0]['title']} (Sicherheit, matches worker)")
print(f"   - {jobs[1]['title']} (Sicherheit, matches worker)")
print(f"   - {jobs[2]['title']} (Gastronomie, doesn't match)")
