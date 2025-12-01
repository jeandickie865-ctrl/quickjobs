#!/usr/bin/env python3
"""
B1 Backend Testing Suite - Job Cleanup & Konsistenz
Tests all B1 implementation features as requested in German review.
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import uuid
import sys

# Backend URL from frontend .env
BACKEND_URL = "https://workermatch-dev.preview.emergentagent.com/api"

class B1BackendTester:
    def __init__(self):
        self.session = None
        self.test_users = {}
        self.test_jobs = {}
        self.test_results = []
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    async def create_test_user(self, role="worker", suffix=""):
        """Create a test user and return auth token"""
        email = f"test{role}{suffix}_{int(datetime.now().timestamp())}@test.de"
        password = "Test123!"
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/signup", json={
                "email": email,
                "password": password,
                "role": role
            }) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    user_info = {
                        "userId": data["userId"],
                        "email": email,
                        "token": data["token"],
                        "role": role
                    }
                    self.test_users[f"{role}{suffix}"] = user_info
                    return user_info
                else:
                    error = await resp.text()
                    print(f"❌ Failed to create {role} user: {error}")
                    return None
        except Exception as e:
            print(f"❌ Error creating {role} user: {e}")
            return None
            
    async def create_test_job(self, employer_token, job_data):
        """Create a test job"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        
        try:
            async with self.session.post(f"{BACKEND_URL}/jobs", 
                                       json=job_data, 
                                       headers=headers) as resp:
                if resp.status == 200:
                    job = await resp.json()
                    return job
                else:
                    error = await resp.text()
                    print(f"❌ Failed to create job: {error}")
                    return None
        except Exception as e:
            print(f"❌ Error creating job: {e}")
            return None
            
    async def test_1_cleanup_function(self):
        """Test 1: B1 Cleanup-Funktion mit verschiedenen Test-Jobs"""
        print("\n🧹 TEST 1: B1 Cleanup-Funktion")
        
        # Create test employer
        employer = await self.create_test_user("employer", "_cleanup")
        if not employer:
            self.log_test("1.1 Create Test Employer", False, "Could not create employer")
            return
            
        self.log_test("1.1 Create Test Employer", True, f"Created {employer['email']}")
        
        # Prepare test dates
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        past_date = today - timedelta(days=2)  # 2025-11-29 equivalent
        future_date = today + timedelta(days=4)  # 2025-12-05 equivalent
        
        # Create test jobs with different dates and statuses
        test_jobs_data = [
            {
                "title": "Job A - Past Open",
                "description": "Should be deleted (past + open)",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": past_date.strftime("%Y-%m-%d"),
                "start_at": "09:00",
                "end_at": "17:00",
                "address": {
                    "street": "Teststraße 1",
                    "postalCode": "10115",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 1500,
                "status": "open"
            },
            {
                "title": "Job B - Yesterday Matched",
                "description": "Should be deleted (yesterday + matched)",
                "category": "sicherheit", 
                "timeMode": "fixed_time",
                "date": yesterday.strftime("%Y-%m-%d"),
                "start_at": "10:00",
                "end_at": "18:00",
                "address": {
                    "street": "Teststraße 2",
                    "postalCode": "10115", 
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 1600,
                "status": "matched",
                "matchedWorkerId": "test_worker_123"
            },
            {
                "title": "Job C - Today Open",
                "description": "Should remain (today + open)",
                "category": "sicherheit",
                "timeMode": "fixed_time", 
                "date": today.strftime("%Y-%m-%d"),
                "start_at": "11:00",
                "end_at": "19:00",
                "address": {
                    "street": "Teststraße 3",
                    "postalCode": "10115",
                    "city": "Berlin", 
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 1700,
                "status": "open"
            },
            {
                "title": "Job D - Future Open", 
                "description": "Should remain (future + open)",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": future_date.strftime("%Y-%m-%d"),
                "start_at": "12:00",
                "end_at": "20:00",
                "address": {
                    "street": "Teststraße 4",
                    "postalCode": "10115",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 1800,
                "status": "open"
            }
        ]
        
        # Create all test jobs
        created_jobs = []
        for i, job_data in enumerate(test_jobs_data):
            job = await self.create_test_job(employer["token"], job_data)
            if job:
                created_jobs.append(job)
                self.log_test(f"1.{i+2} Create Test Job {chr(65+i)}", True, f"Created job with date {job_data['date']}")
            else:
                self.log_test(f"1.{i+2} Create Test Job {chr(65+i)}", False, "Failed to create job")
                
        if len(created_jobs) != 4:
            self.log_test("1.6 All Test Jobs Created", False, f"Only {len(created_jobs)}/4 jobs created")
            return
            
        self.log_test("1.6 All Test Jobs Created", True, "All 4 test jobs created successfully")
        
        # Trigger cleanup by calling GET /api/jobs (which calls cleanup)
        try:
            headers = {"Authorization": f"Bearer {employer['token']}"}
            async with self.session.get(f"{BACKEND_URL}/jobs", headers=headers) as resp:
                if resp.status == 200:
                    remaining_jobs = await resp.json()
                    self.log_test("1.7 Trigger Cleanup", True, f"Cleanup triggered, {len(remaining_jobs)} jobs remain")
                    
                    # Verify cleanup results
                    remaining_titles = [job["title"] for job in remaining_jobs if job["employerId"] == employer["userId"]]
                    
                    # Should have Job C (today) and Job D (future), not Job A (past) or Job B (yesterday)
                    expected_remaining = ["Job C - Today Open", "Job D - Future Open"]
                    should_be_deleted = ["Job A - Past Open", "Job B - Yesterday Matched"]
                    
                    cleanup_success = True
                    cleanup_details = []
                    
                    for expected in expected_remaining:
                        if expected in remaining_titles:
                            cleanup_details.append(f"✅ {expected} correctly preserved")
                        else:
                            cleanup_details.append(f"❌ {expected} incorrectly deleted")
                            cleanup_success = False
                            
                    for deleted in should_be_deleted:
                        if deleted not in remaining_titles:
                            cleanup_details.append(f"✅ {deleted} correctly deleted")
                        else:
                            cleanup_details.append(f"❌ {deleted} incorrectly preserved")
                            cleanup_success = False
                            
                    self.log_test("1.8 Verify Cleanup Results", cleanup_success, "; ".join(cleanup_details))
                    
                else:
                    error = await resp.text()
                    self.log_test("1.7 Trigger Cleanup", False, f"Failed to trigger cleanup: {error}")
                    
        except Exception as e:
            self.log_test("1.7 Trigger Cleanup", False, f"Error triggering cleanup: {e}")
            
    async def test_2_matching_api_filter(self):
        """Test 2: Matching API Filter (GET /api/jobs/matches/me)"""
        print("\n🎯 TEST 2: Matching API Filter")
        
        # Create test worker
        worker = await self.create_test_user("worker", "_matching")
        if not worker:
            self.log_test("2.1 Create Test Worker", False, "Could not create worker")
            return
            
        self.log_test("2.1 Create Test Worker", True, f"Created {worker['email']}")
        
        # Create worker profile
        profile_data = {
            "firstName": "Test",
            "lastName": "Worker",
            "phone": "+49123456789",
            "email": worker["email"],
            "categories": ["sicherheit"],
            "selectedTags": ["bewachung"],
            "radiusKm": 25,
            "homeAddress": {
                "street": "Arbeiterstraße 1",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "homeLat": 52.5200,
            "homeLon": 13.4050
        }
        
        try:
            headers = {"Authorization": f"Bearer {worker['token']}"}
            async with self.session.post(f"{BACKEND_URL}/profiles/worker", 
                                       json=profile_data, 
                                       headers=headers) as resp:
                if resp.status == 200:
                    self.log_test("2.2 Create Worker Profile", True, "Worker profile created")
                else:
                    error = await resp.text()
                    self.log_test("2.2 Create Worker Profile", False, f"Failed: {error}")
                    return
        except Exception as e:
            self.log_test("2.2 Create Worker Profile", False, f"Error: {e}")
            return
            
        # Create test employer for jobs
        employer = await self.create_test_user("employer", "_matching")
        if not employer:
            self.log_test("2.3 Create Test Employer", False, "Could not create employer")
            return
            
        self.log_test("2.3 Create Test Employer", True, f"Created {employer['email']}")
        
        # Prepare test dates
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        future_date = today + timedelta(days=2)
        
        # Create jobs with different filter criteria
        filter_test_jobs = [
            {
                "title": "Job 1 - Past Open (should be filtered out)",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": yesterday.strftime("%Y-%m-%d"),
                "start_at": "09:00", 
                "end_at": "17:00",
                "address": {"street": "Test 1", "postalCode": "10115", "city": "Berlin", "country": "DE"},
                "lat": 52.5200, "lon": 13.4050,
                "workerAmountCents": 1500,
                "status": "open"
            },
            {
                "title": "Job 2 - Today Open Unmatched (should appear)",
                "category": "sicherheit", 
                "timeMode": "fixed_time",
                "date": today.strftime("%Y-%m-%d"),
                "start_at": "10:00",
                "end_at": "18:00", 
                "address": {"street": "Test 2", "postalCode": "10115", "city": "Berlin", "country": "DE"},
                "lat": 52.5200, "lon": 13.4050,
                "workerAmountCents": 1600,
                "status": "open"
            },
            {
                "title": "Job 3 - Future Matched (should be filtered out)",
                "category": "sicherheit",
                "timeMode": "fixed_time", 
                "date": future_date.strftime("%Y-%m-%d"),
                "start_at": "11:00",
                "end_at": "19:00",
                "address": {"street": "Test 3", "postalCode": "10115", "city": "Berlin", "country": "DE"},
                "lat": 52.5200, "lon": 13.4050,
                "workerAmountCents": 1700,
                "status": "matched",
                "matchedWorkerId": "other_worker_123"
            },
            {
                "title": "Job 4 - Future Open Unmatched (should appear)",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": future_date.strftime("%Y-%m-%d"), 
                "start_at": "12:00",
                "end_at": "20:00",
                "address": {"street": "Test 4", "postalCode": "10115", "city": "Berlin", "country": "DE"},
                "lat": 52.5200, "lon": 13.4050,
                "workerAmountCents": 1800,
                "status": "open"
            }
        ]
        
        # Create filter test jobs
        created_filter_jobs = []
        for i, job_data in enumerate(filter_test_jobs):
            job = await self.create_test_job(employer["token"], job_data)
            if job:
                created_filter_jobs.append(job)
                self.log_test(f"2.{i+4} Create Filter Test Job {i+1}", True, f"Created {job_data['title']}")
            else:
                self.log_test(f"2.{i+4} Create Filter Test Job {i+1}", False, "Failed to create job")
                
        # Test matching API filter
        try:
            headers = {"Authorization": f"Bearer {worker['token']}"}
            async with self.session.get(f"{BACKEND_URL}/jobs/matches/me", headers=headers) as resp:
                if resp.status == 200:
                    matched_jobs = await resp.json()
                    self.log_test("2.8 Call Matching API", True, f"API returned {len(matched_jobs)} matched jobs")
                    
                    # Verify filter criteria
                    filter_success = True
                    filter_details = []
                    
                    expected_jobs = ["Job 2 - Today Open Unmatched (should appear)", "Job 4 - Future Open Unmatched (should appear)"]
                    filtered_jobs = ["Job 1 - Past Open (should be filtered out)", "Job 3 - Future Matched (should be filtered out)"]
                    
                    matched_titles = [job["title"] for job in matched_jobs]
                    
                    for expected in expected_jobs:
                        if expected in matched_titles:
                            filter_details.append(f"✅ {expected}")
                        else:
                            filter_details.append(f"❌ Missing: {expected}")
                            filter_success = False
                            
                    for filtered in filtered_jobs:
                        if filtered not in matched_titles:
                            filter_details.append(f"✅ Correctly filtered: {filtered}")
                        else:
                            filter_details.append(f"❌ Should be filtered: {filtered}")
                            filter_success = False
                            
                    # Verify all returned jobs meet criteria
                    for job in matched_jobs:
                        criteria_met = True
                        criteria_details = []
                        
                        if job.get("status") != "open":
                            criteria_met = False
                            criteria_details.append(f"status={job.get('status')} (should be open)")
                            
                        if job.get("date", "") < today.strftime("%Y-%m-%d"):
                            criteria_met = False
                            criteria_details.append(f"date={job.get('date')} (should be >= today)")
                            
                        if job.get("matchedWorkerId") is not None:
                            criteria_met = False
                            criteria_details.append(f"matchedWorkerId={job.get('matchedWorkerId')} (should be None)")
                            
                        if not criteria_met:
                            filter_success = False
                            filter_details.append(f"❌ {job['title']}: {', '.join(criteria_details)}")
                            
                    self.log_test("2.9 Verify Filter Criteria", filter_success, "; ".join(filter_details))
                    
                else:
                    error = await resp.text()
                    self.log_test("2.8 Call Matching API", False, f"API error: {error}")
                    
        except Exception as e:
            self.log_test("2.8 Call Matching API", False, f"Error: {e}")
            
    async def test_3_job_get_endpoints(self):
        """Test 3: Job GET Endpoints mit Filtering"""
        print("\n📋 TEST 3: Job GET Endpoints")
        
        # Use existing employer or create new one
        if "employer_matching" in self.test_users:
            employer = self.test_users["employer_matching"]
        else:
            employer = await self.create_test_user("employer", "_endpoints")
            if not employer:
                self.log_test("3.1 Get Test Employer", False, "Could not get/create employer")
                return
                
        self.log_test("3.1 Get Test Employer", True, f"Using {employer['email']}")
        
        # Test GET /api/jobs (should only show open + future/today)
        try:
            headers = {"Authorization": f"Bearer {employer['token']}"}
            async with self.session.get(f"{BACKEND_URL}/jobs", headers=headers) as resp:
                if resp.status == 200:
                    all_jobs = await resp.json()
                    self.log_test("3.2 GET /api/jobs", True, f"Returned {len(all_jobs)} jobs")
                    
                    # Verify all jobs are open and future/today
                    today = datetime.now().strftime("%Y-%m-%d")
                    filter_success = True
                    filter_details = []
                    
                    for job in all_jobs:
                        if job.get("status") != "open":
                            filter_success = False
                            filter_details.append(f"❌ {job['title']}: status={job.get('status')} (should be open)")
                            
                        if job.get("date", "") < today:
                            filter_success = False
                            filter_details.append(f"❌ {job['title']}: date={job.get('date')} (should be >= {today})")
                            
                    if filter_success:
                        filter_details.append("✅ All jobs meet criteria (open + future/today)")
                        
                    self.log_test("3.3 Verify /api/jobs Filter", filter_success, "; ".join(filter_details))
                    
                else:
                    error = await resp.text()
                    self.log_test("3.2 GET /api/jobs", False, f"API error: {error}")
                    
        except Exception as e:
            self.log_test("3.2 GET /api/jobs", False, f"Error: {e}")
            
        # Test GET /api/jobs/employer/{id} (should only show future/today for specific employer)
        try:
            headers = {"Authorization": f"Bearer {employer['token']}"}
            async with self.session.get(f"{BACKEND_URL}/jobs/employer/{employer['userId']}", headers=headers) as resp:
                if resp.status == 200:
                    employer_jobs = await resp.json()
                    self.log_test("3.4 GET /api/jobs/employer/{id}", True, f"Returned {len(employer_jobs)} jobs for employer")
                    
                    # Verify all jobs belong to this employer and are future/today
                    today = datetime.now().strftime("%Y-%m-%d")
                    employer_filter_success = True
                    employer_filter_details = []
                    
                    for job in employer_jobs:
                        if job.get("employerId") != employer["userId"]:
                            employer_filter_success = False
                            employer_filter_details.append(f"❌ {job['title']}: wrong employerId")
                            
                        if job.get("date", "") < today:
                            employer_filter_success = False
                            employer_filter_details.append(f"❌ {job['title']}: date={job.get('date')} (should be >= {today})")
                            
                    if employer_filter_success:
                        employer_filter_details.append("✅ All jobs belong to employer and are future/today")
                        
                    self.log_test("3.5 Verify Employer Jobs Filter", employer_filter_success, "; ".join(employer_filter_details))
                    
                else:
                    error = await resp.text()
                    self.log_test("3.4 GET /api/jobs/employer/{id}", False, f"API error: {error}")
                    
        except Exception as e:
            self.log_test("3.4 GET /api/jobs/employer/{id}", False, f"Error: {e}")
            
    async def test_4_scheduler_verification(self):
        """Test 4: Scheduler Verifizierung"""
        print("\n⏰ TEST 4: Scheduler Verification")
        
        # Check backend logs for scheduler startup message
        try:
            # Since we can't directly access logs, we'll test the scheduler indirectly
            # by verifying that cleanup happens automatically when we call job endpoints
            
            # Create a test job in the past
            if "employer_endpoints" in self.test_users:
                employer = self.test_users["employer_endpoints"]
            else:
                employer = await self.create_test_user("employer", "_scheduler")
                if not employer:
                    self.log_test("4.1 Get Test Employer", False, "Could not get/create employer")
                    return
                    
            self.log_test("4.1 Get Test Employer", True, f"Using {employer['email']}")
            
            # Create a job in the past that should be cleaned up
            past_date = (datetime.now().date() - timedelta(days=1)).strftime("%Y-%m-%d")
            past_job_data = {
                "title": "Scheduler Test Job - Past",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": past_date,
                "start_at": "09:00",
                "end_at": "17:00",
                "address": {
                    "street": "Scheduler Test",
                    "postalCode": "10115",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 1500,
                "status": "open"
            }
            
            past_job = await self.create_test_job(employer["token"], past_job_data)
            if past_job:
                self.log_test("4.2 Create Past Job for Cleanup Test", True, f"Created job with date {past_date}")
                
                # Wait a moment then call an endpoint that triggers cleanup
                await asyncio.sleep(1)
                
                headers = {"Authorization": f"Bearer {employer['token']}"}
                async with self.session.get(f"{BACKEND_URL}/jobs", headers=headers) as resp:
                    if resp.status == 200:
                        remaining_jobs = await resp.json()
                        
                        # Check if the past job was cleaned up
                        past_job_found = any(job["id"] == past_job["id"] for job in remaining_jobs)
                        
                        if not past_job_found:
                            self.log_test("4.3 Verify Automatic Cleanup", True, "Past job was automatically cleaned up")
                        else:
                            self.log_test("4.3 Verify Automatic Cleanup", False, "Past job was not cleaned up")
                            
                        # This indirectly confirms the scheduler/cleanup is working
                        self.log_test("4.4 Scheduler Functionality", not past_job_found, 
                                    "Cleanup function is working (scheduler likely active)")
                    else:
                        self.log_test("4.3 Verify Automatic Cleanup", False, "Could not fetch jobs to verify cleanup")
                        
            else:
                self.log_test("4.2 Create Past Job for Cleanup Test", False, "Could not create test job")
                
        except Exception as e:
            self.log_test("4.1 Scheduler Test", False, f"Error: {e}")
            
    async def test_5_job_models(self):
        """Test 5: Job Models mit neuen Feldern (date, start_at, end_at)"""
        print("\n📝 TEST 5: Job Models with New Fields")
        
        # Get or create test employer
        if "employer_scheduler" in self.test_users:
            employer = self.test_users["employer_scheduler"]
        else:
            employer = await self.create_test_user("employer", "_models")
            if not employer:
                self.log_test("5.1 Get Test Employer", False, "Could not get/create employer")
                return
                
        self.log_test("5.1 Get Test Employer", True, f"Using {employer['email']}")
        
        # Test job creation with new B1 fields
        future_date = (datetime.now().date() + timedelta(days=3)).strftime("%Y-%m-%d")
        new_fields_job_data = {
            "title": "B1 Model Test Job",
            "description": "Testing new B1 fields: date, start_at, end_at",
            "category": "sicherheit",
            "timeMode": "fixed_time",  # B1: only fixed_time allowed
            "date": future_date,  # B1: new field
            "start_at": "14:30",  # B1: new field
            "end_at": "22:15",    # B1: new field
            "address": {
                "street": "B1 Test Straße 123",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 2000,
            "paymentToWorker": "cash",
            "required_all_tags": ["objektschutz"],
            "required_any_tags": ["nachtdienst"],
            "status": "open"
        }
        
        # Create job with new fields
        new_job = await self.create_test_job(employer["token"], new_fields_job_data)
        if new_job:
            self.log_test("5.2 Create Job with B1 Fields", True, "Job created successfully")
            
            # Verify new fields are stored correctly
            field_verification = []
            fields_correct = True
            
            if new_job.get("date") == future_date:
                field_verification.append("✅ date field correct")
            else:
                field_verification.append(f"❌ date field: got {new_job.get('date')}, expected {future_date}")
                fields_correct = False
                
            if new_job.get("start_at") == "14:30":
                field_verification.append("✅ start_at field correct")
            else:
                field_verification.append(f"❌ start_at field: got {new_job.get('start_at')}, expected 14:30")
                fields_correct = False
                
            if new_job.get("end_at") == "22:15":
                field_verification.append("✅ end_at field correct")
            else:
                field_verification.append(f"❌ end_at field: got {new_job.get('end_at')}, expected 22:15")
                fields_correct = False
                
            if new_job.get("timeMode") == "fixed_time":
                field_verification.append("✅ timeMode field correct")
            else:
                field_verification.append(f"❌ timeMode field: got {new_job.get('timeMode')}, expected fixed_time")
                fields_correct = False
                
            self.log_test("5.3 Verify B1 Fields Storage", fields_correct, "; ".join(field_verification))
            
            # Test retrieval of job with new fields
            try:
                headers = {"Authorization": f"Bearer {employer['token']}"}
                async with self.session.get(f"{BACKEND_URL}/jobs/{new_job['id']}", headers=headers) as resp:
                    if resp.status == 200:
                        retrieved_job = await resp.json()
                        self.log_test("5.4 Retrieve Job with B1 Fields", True, "Job retrieved successfully")
                        
                        # Verify fields are preserved in retrieval
                        retrieval_verification = []
                        retrieval_correct = True
                        
                        for field in ["date", "start_at", "end_at", "timeMode"]:
                            if retrieved_job.get(field) == new_job.get(field):
                                retrieval_verification.append(f"✅ {field} preserved")
                            else:
                                retrieval_verification.append(f"❌ {field} changed: {retrieved_job.get(field)} != {new_job.get(field)}")
                                retrieval_correct = False
                                
                        self.log_test("5.5 Verify B1 Fields Retrieval", retrieval_correct, "; ".join(retrieval_verification))
                        
                    else:
                        error = await resp.text()
                        self.log_test("5.4 Retrieve Job with B1 Fields", False, f"Retrieval failed: {error}")
                        
            except Exception as e:
                self.log_test("5.4 Retrieve Job with B1 Fields", False, f"Error: {e}")
                
        else:
            self.log_test("5.2 Create Job with B1 Fields", False, "Could not create job")
            
    async def run_all_tests(self):
        """Run all B1 tests"""
        print("🚀 Starting B1 Backend Testing Suite")
        print(f"🌐 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Run all test suites
            await self.test_1_cleanup_function()
            await self.test_2_matching_api_filter()
            await self.test_3_job_get_endpoints()
            await self.test_4_scheduler_verification()
            await self.test_5_job_models()
            
            # Print summary
            print("\n" + "=" * 60)
            print("📊 TEST SUMMARY")
            print("=" * 60)
            
            total_tests = len(self.test_results)
            passed_tests = sum(1 for result in self.test_results if result["success"])
            failed_tests = total_tests - passed_tests
            
            print(f"Total Tests: {total_tests}")
            print(f"✅ Passed: {passed_tests}")
            print(f"❌ Failed: {failed_tests}")
            print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
            
            if failed_tests > 0:
                print("\n❌ FAILED TESTS:")
                for result in self.test_results:
                    if not result["success"]:
                        print(f"  - {result['test']}: {result['details']}")
                        
            return failed_tests == 0
            
        finally:
            await self.cleanup_session()

async def main():
    """Main test runner"""
    tester = B1BackendTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - B1 Implementation is working correctly!")
        sys.exit(0)
    else:
        print("\n💥 SOME TESTS FAILED - B1 Implementation needs fixes")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())