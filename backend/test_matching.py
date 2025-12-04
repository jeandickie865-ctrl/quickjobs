#!/usr/bin/env python3
"""
MATCHING TEST SUITE
Tests the complete matching logic with 3 workers and 4 jobs
Expected result matrix is hardcoded for validation
"""

import requests
import json
import time
from typing import Dict, List

BASE_URL = "https://shiftmatch-dark.preview.emergentagent.com/api"
TIMESTAMP = int(time.time())

# Expected Results Matrix
# Job    W1   W2   W3
# Job 1  ✔    ✔    ✘
# Job 2  ✘    ✔    ✘
# Job 3  ✘    ✔    ✘
# Job 4  ✘    ✘    ✔

EXPECTED_MATRIX = {
    "worker1": ["job1"],
    "worker2": ["job1", "job2", "job3"],
    "worker3": ["job4"],
}

def signup_user(email: str, password: str, role: str) -> Dict:
    """Sign up a new user"""
    response = requests.post(
        f"{BASE_URL}/auth/signup",
        json={"email": email, "password": password, "role": role}
    )
    response.raise_for_status()
    return response.json()

def create_worker_profile(token: str, profile_data: Dict) -> Dict:
    """Create worker profile"""
    response = requests.post(
        f"{BASE_URL}/profiles/worker",
        headers={"Authorization": f"Bearer {token}"},
        json=profile_data
    )
    response.raise_for_status()
    return response.json()

def create_employer_profile(token: str, profile_data: Dict) -> Dict:
    """Create employer profile"""
    response = requests.post(
        f"{BASE_URL}/profiles/employer",
        headers={"Authorization": f"Bearer {token}"},
        json=profile_data
    )
    response.raise_for_status()
    return response.json()

def create_job(token: str, job_data: Dict) -> Dict:
    """Create a job"""
    response = requests.post(
        f"{BASE_URL}/jobs",
        headers={"Authorization": f"Bearer {token}"},
        json=job_data
    )
    response.raise_for_status()
    return response.json()

def get_matched_jobs(token: str) -> List[Dict]:
    """Get matched jobs for worker"""
    response = requests.get(
        f"{BASE_URL}/jobs/matches/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()

def main():
    print("=" * 80)
    print("MATCHING TEST SUITE")
    print("=" * 80)
    
    # Store tokens and IDs
    workers = {}
    jobs = {}
    
    # ============================================================
    # STEP 1: Create Workers
    # ============================================================
    print("\n📋 STEP 1: Creating Workers")
    print("-" * 80)
    
    # Worker 1 - Sicherheitskraft Basis
    print("\n👤 Worker 1 - Sicherheitskraft Basis")
    w1_auth = signup_user(f"worker1_{TIMESTAMP}@test.de", "Test123!", "worker")
    workers["worker1"] = {"token": w1_auth["token"], "userId": w1_auth["userId"]}
    
    w1_profile = create_worker_profile(
        w1_auth["token"],
        {
            "firstName": "Max",
            "lastName": "Basis",
            "phone": "+491111111111",
            "email": "worker1@test.de",
            "homeAddress": {
                "street": "Teststraße",
                "houseNumber": "1",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "homeLat": 52.520008,
            "homeLon": 13.404954,
            "categories": ["sicherheit"],
            "selectedTags": ["unterrichtung-34a"],
            "radiusKm": 15
        }
    )
    print(f"✅ Worker 1 created: {w1_auth['userId']}")
    print(f"   Categories: {w1_profile['categories']}")
    print(f"   Tags: {w1_profile['selectedTags']}")
    print(f"   Radius: {w1_profile['radiusKm']} km")
    
    # Worker 2 - Sicherheit Pro
    print("\n👤 Worker 2 - Sicherheit Pro")
    w2_auth = signup_user(f"worker2_{TIMESTAMP}@test.de", "Test123!", "worker")
    workers["worker2"] = {"token": w2_auth["token"], "userId": w2_auth["userId"]}
    
    w2_profile = create_worker_profile(
        w2_auth["token"],
        {
            "firstName": "Anna",
            "lastName": "Pro",
            "phone": "+492222222222",
            "email": f"worker2_{TIMESTAMP}@test.de",
            "homeAddress": {
                "street": "Teststraße",
                "houseNumber": "2",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "homeLat": 52.520008,
            "homeLon": 13.404954,
            "categories": ["sicherheit"],
            "selectedTags": ["unterrichtung-34a", "bewacher-id", "nachtarbeit"],
            "radiusKm": 40
        }
    )
    print(f"✅ Worker 2 created: {w2_auth['userId']}")
    print(f"   Categories: {w2_profile['categories']}")
    print(f"   Tags: {w2_profile['selectedTags']}")
    print(f"   Radius: {w2_profile['radiusKm']} km")
    
    # Worker 3 - Gastronomie
    print("\n👤 Worker 3 - Gastronomie")
    w3_auth = signup_user("worker3@test.de", "Test123!", "worker")
    workers["worker3"] = {"token": w3_auth["token"], "userId": w3_auth["userId"]}
    
    w3_profile = create_worker_profile(
        w3_auth["token"],
        {
            "firstName": "Lisa",
            "lastName": "Gastro",
            "phone": "+493333333333",
            "email": "worker3@test.de",
            "homeAddress": {
                "street": "Teststraße",
                "houseNumber": "3",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "homeLat": 52.520008,
            "homeLon": 13.404954,
            "categories": ["gastronomie"],
            "selectedTags": ["service-erfahrung", "zapfen"],
            "radiusKm": 10
        }
    )
    print(f"✅ Worker 3 created: {w3_auth['userId']}")
    print(f"   Categories: {w3_profile['categories']}")
    print(f"   Tags: {w3_profile['selectedTags']}")
    print(f"   Radius: {w3_profile['radiusKm']} km")
    
    # ============================================================
    # STEP 2: Create Employer and Jobs
    # ============================================================
    print("\n\n📋 STEP 2: Creating Employer and Jobs")
    print("-" * 80)
    
    # Create employer
    print("\n👔 Creating Employer")
    emp_auth = signup_user("employer@test.de", "Test123!", "employer")
    employer_token = emp_auth["token"]
    
    emp_profile = create_employer_profile(
        employer_token,
        {
            "firstName": "Test",
            "lastName": "Employer",
            "email": "employer@test.de",
            "phone": "+494444444444",
            "companyName": "Test GmbH",
            "address": {
                "street": "Firmstraße",
                "houseNumber": "10",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "lat": 52.520008,
            "lon": 13.404954,
            "paymentMethod": "rechnung"
        }
    )
    print(f"✅ Employer created: {emp_auth['userId']}")
    
    # Job 1 - Sicherheitsjob Basis
    print("\n💼 Job 1 - Sicherheitsjob Basis")
    job1 = create_job(
        employer_token,
        {
            "title": "Job 1 - Sicherheitsjob Basis",
            "description": "Basis Sicherheitsjob",
            "category": "sicherheit",
            "required_all_tags": ["unterrichtung-34a"],
            "required_any_tags": [],
            "timeMode": "fixed_time",
            "startAt": "2025-12-01T08:00:00Z",
            "endAt": "2025-12-01T16:00:00Z",
            "address": {
                "street": "Jobstraße",
                "houseNumber": "1",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "lat": 52.520008,
            "lon": 13.404954,
            "workerAmountCents": 1500,
            "paymentToWorker": "bank"
        }
    )
    jobs["job1"] = job1["id"]
    print(f"✅ Job 1 created: {job1['id']}")
    print(f"   Category: {job1['category']}")
    print(f"   Required ALL: {job1['required_all_tags']}")
    print(f"   Required ANY: {job1['required_any_tags']}")
    
    # Job 2 - Sicherheitsjob Nachtarbeit
    print("\n💼 Job 2 - Sicherheitsjob Nachtarbeit")
    job2 = create_job(
        employer_token,
        {
            "title": "Job 2 - Sicherheitsjob Nachtarbeit",
            "description": "Nachtarbeit erforderlich",
            "category": "sicherheit",
            "required_all_tags": ["unterrichtung-34a"],
            "required_any_tags": ["nachtarbeit"],
            "timeMode": "fixed_time",
            "startAt": "2025-12-01T22:00:00Z",
            "endAt": "2025-12-02T06:00:00Z",
            "address": {
                "street": "Jobstraße",
                "houseNumber": "2",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "lat": 52.530008,
            "lon": 13.404954,
            "workerAmountCents": 2000,
            "paymentToWorker": "bank"
        }
    )
    jobs["job2"] = job2["id"]
    print(f"✅ Job 2 created: {job2['id']}")
    print(f"   Category: {job2['category']}")
    print(f"   Required ALL: {job2['required_all_tags']}")
    print(f"   Required ANY: {job2['required_any_tags']}")
    
    # Job 3 - Sicherheitsjob Spezial
    print("\n💼 Job 3 - Sicherheitsjob Spezial")
    job3 = create_job(
        employer_token,
        {
            "title": "Job 3 - Sicherheitsjob Spezial",
            "description": "Bewacher-ID erforderlich",
            "category": "sicherheit",
            "required_all_tags": ["unterrichtung-34a", "bewacher-id"],
            "required_any_tags": [],
            "timeMode": "fixed_time",
            "startAt": "2025-12-01T08:00:00Z",
            "endAt": "2025-12-01T16:00:00Z",
            "address": {
                "street": "Jobstraße",
                "houseNumber": "3",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "lat": 52.520008,
            "lon": 13.504954,
            "workerAmountCents": 2500,
            "paymentToWorker": "bank"
        }
    )
    jobs["job3"] = job3["id"]
    print(f"✅ Job 3 created: {job3['id']}")
    print(f"   Category: {job3['category']}")
    print(f"   Required ALL: {job3['required_all_tags']}")
    print(f"   Required ANY: {job3['required_any_tags']}")
    
    # Job 4 - Gastrojob
    print("\n💼 Job 4 - Gastrojob")
    job4 = create_job(
        employer_token,
        {
            "title": "Job 4 - Gastrojob",
            "description": "Service-Erfahrung erwünscht",
            "category": "gastronomie",
            "required_all_tags": [],
            "required_any_tags": ["service-erfahrung"],
            "timeMode": "fixed_time",
            "startAt": "2025-12-01T10:00:00Z",
            "endAt": "2025-12-01T22:00:00Z",
            "address": {
                "street": "Jobstraße",
                "houseNumber": "4",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "Deutschland"
            },
            "lat": 52.520008,
            "lon": 13.384954,
            "workerAmountCents": 1800,
            "paymentToWorker": "cash"
        }
    )
    jobs["job4"] = job4["id"]
    print(f"✅ Job 4 created: {job4['id']}")
    print(f"   Category: {job4['category']}")
    print(f"   Required ALL: {job4['required_all_tags']}")
    print(f"   Required ANY: {job4['required_any_tags']}")
    
    # ============================================================
    # STEP 3: Test Matching for Each Worker
    # ============================================================
    print("\n\n📋 STEP 3: Testing Matching")
    print("-" * 80)
    
    results = {}
    
    for worker_name, worker_data in workers.items():
        print(f"\n🔍 Testing {worker_name.upper()}")
        print(f"   Token: {worker_data['token'][:20]}...")
        
        matches = get_matched_jobs(worker_data["token"])
        matched_job_ids = [job["id"] for job in matches]
        
        # Map job IDs to job names
        matched_job_names = []
        for job_id in matched_job_ids:
            for job_name, stored_id in jobs.items():
                if stored_id == job_id:
                    matched_job_names.append(job_name)
                    break
        
        results[worker_name] = matched_job_names
        
        print(f"   Matched Jobs: {len(matches)}")
        for match in matches:
            print(f"      - {match['title']} ({match['id']})")
    
    # ============================================================
    # STEP 4: Validate Results
    # ============================================================
    print("\n\n📋 STEP 4: Validating Results")
    print("=" * 80)
    
    print("\n📊 EXPECTED MATRIX:")
    print("   Job    W1   W2   W3")
    print("   Job 1  ✔    ✔    ✘")
    print("   Job 2  ✘    ✔    ✘")
    print("   Job 3  ✘    ✔    ✘")
    print("   Job 4  ✘    ✘    ✔")
    
    print("\n📊 ACTUAL RESULTS:")
    all_passed = True
    
    for worker_name, expected_jobs in EXPECTED_MATRIX.items():
        actual_jobs = sorted(results.get(worker_name, []))
        expected_jobs_sorted = sorted(expected_jobs)
        
        status = "✅ PASS" if actual_jobs == expected_jobs_sorted else "❌ FAIL"
        print(f"\n{worker_name.upper()}: {status}")
        print(f"   Expected: {expected_jobs_sorted}")
        print(f"   Actual:   {actual_jobs}")
        
        if actual_jobs != expected_jobs_sorted:
            all_passed = False
            missing = set(expected_jobs_sorted) - set(actual_jobs)
            extra = set(actual_jobs) - set(expected_jobs_sorted)
            if missing:
                print(f"   Missing:  {list(missing)}")
            if extra:
                print(f"   Extra:    {list(extra)}")
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED!")
    print("=" * 80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    try:
        exit_code = main()
        exit(exit_code)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
