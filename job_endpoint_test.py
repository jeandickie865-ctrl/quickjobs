#!/usr/bin/env python3
"""
Focused Backend Test for GET /api/jobs/{jobId} Endpoint
Testing nach matches.tsx Performance-Refaktorierung

This test specifically focuses on the GET /api/jobs/{jobId} endpoint
after the frontend performance optimization where matches.tsx was changed from:
- OLD: Load all jobs (getJobs()), then filter by iteration  
- NEW: Load each job individually by ID (getJobById(jobId))

Test Goals:
1. ✅ Verify that GET /api/jobs/{jobId} works
2. ✅ Test that endpoint handles different Job IDs correctly
3. ✅ Ensure 404 errors for non-existent IDs are returned correctly
4. ✅ Check backend logs for errors
"""

import asyncio
import httpx
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any

# Backend URL from frontend/.env
BACKEND_URL = "https://backupmatch.preview.emergentagent.com/api"

class JobEndpointTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.employer_token = None
        self.worker_token = None
        self.test_job_ids = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    async def setup_auth_tokens(self):
        """Setup authentication tokens for testing"""
        print("🔧 Setting up authentication...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test employer credentials
            employer_email = "testemployer@jobendpoint.de"
            employer_password = "TestPass123!"
            
            # Test worker credentials  
            worker_email = "testworker@jobendpoint.de"
            worker_password = "WorkerPass123!"
            
            try:
                # Setup employer
                signup_data = {
                    "email": employer_email,
                    "password": employer_password,
                    "role": "employer"
                }
                
                response = await client.post(f"{self.base_url}/auth/signup", json=signup_data)
                if response.status_code == 200:
                    data = response.json()
                    self.employer_token = data["token"]
                    print(f"✅ Employer created: {data['userId']}")
                elif response.status_code == 400 and "bereits registriert" in response.text:
                    # User exists, try login
                    login_data = {"email": employer_email, "password": employer_password}
                    response = await client.post(f"{self.base_url}/auth/login", json=login_data)
                    if response.status_code == 200:
                        data = response.json()
                        self.employer_token = data["token"]
                        print(f"✅ Employer logged in: {data['userId']}")
                    else:
                        print(f"❌ Employer login failed: {response.status_code}")
                        return False
                else:
                    print(f"❌ Employer signup failed: {response.status_code} - {response.text}")
                    return False
                
                # Setup worker
                signup_data = {
                    "email": worker_email,
                    "password": worker_password,
                    "role": "worker"
                }
                
                response = await client.post(f"{self.base_url}/auth/signup", json=signup_data)
                if response.status_code == 200:
                    data = response.json()
                    self.worker_token = data["token"]
                    print(f"✅ Worker created: {data['userId']}")
                elif response.status_code == 400 and "bereits registriert" in response.text:
                    # User exists, try login
                    login_data = {"email": worker_email, "password": worker_password}
                    response = await client.post(f"{self.base_url}/auth/login", json=login_data)
                    if response.status_code == 200:
                        data = response.json()
                        self.worker_token = data["token"]
                        print(f"✅ Worker logged in: {data['userId']}")
                    else:
                        print(f"❌ Worker login failed: {response.status_code}")
                        return False
                else:
                    print(f"❌ Worker signup failed: {response.status_code} - {response.text}")
                    return False
                
                return True
                
            except Exception as e:
                print(f"❌ Auth setup failed: {str(e)}")
                return False

    async def create_test_jobs(self):
        """Create test jobs for endpoint testing"""
        print("📝 Creating test jobs...")
        
        if not self.employer_token:
            print("❌ No employer token available")
            return False
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.employer_token}"}
            
            # Create multiple test jobs with different characteristics
            test_jobs = [
                {
                    "title": "Sicherheitsdienst Brandenburger Tor",
                    "description": "Objektschutz am Brandenburger Tor",
                    "category": "sicherheit",
                    "timeMode": "fixed_time",
                    "startAt": "2024-12-20T18:00:00Z",
                    "endAt": "2024-12-20T23:00:00Z",
                    "address": {
                        "street": "Pariser Platz",
                        "houseNumber": "1",
                        "postalCode": "10117",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "lat": 52.5163,
                    "lon": 13.3777,
                    "workerAmountCents": 2500,
                    "paymentToWorker": "cash",
                    "required_all_tags": ["sachkunde"],
                    "required_any_tags": [],
                    "status": "open"
                },
                {
                    "title": "Kellner Hochzeit Potsdamer Platz",
                    "description": "Service bei eleganter Hochzeitsfeier",
                    "category": "gastronomie",
                    "timeMode": "hour_package",
                    "hours": 8.0,
                    "address": {
                        "street": "Potsdamer Platz",
                        "houseNumber": "1",
                        "postalCode": "10785",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "lat": 52.5096,
                    "lon": 13.3760,
                    "workerAmountCents": 1800,
                    "paymentToWorker": "bank",
                    "required_all_tags": [],
                    "required_any_tags": ["service-erfahrung"],
                    "status": "open"
                },
                {
                    "title": "Lagerhelfer Warschauer Straße",
                    "description": "Kommissionierung und Wareneingang",
                    "category": "logistik",
                    "timeMode": "project",
                    "dueAt": "2024-12-25T17:00:00Z",
                    "address": {
                        "street": "Warschauer Str.",
                        "houseNumber": "70",
                        "postalCode": "10243",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "lat": 52.5058,
                    "lon": 13.4497,
                    "workerAmountCents": 1500,
                    "paymentToWorker": "paypal",
                    "required_all_tags": ["staplerführerschein"],
                    "required_any_tags": [],
                    "status": "open"
                },
                {
                    "title": "Reinigungskraft Alexanderplatz",
                    "description": "Büroreinigung nach Geschäftsschluss",
                    "category": "reinigung",
                    "timeMode": "fixed_time",
                    "startAt": "2024-12-21T20:00:00Z",
                    "endAt": "2024-12-21T23:00:00Z",
                    "address": {
                        "street": "Alexanderplatz",
                        "houseNumber": "1",
                        "postalCode": "10178",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "lat": 52.5200,
                    "lon": 13.4050,
                    "workerAmountCents": 1200,
                    "paymentToWorker": "cash",
                    "required_all_tags": [],
                    "required_any_tags": ["reinigungserfahrung"],
                    "status": "open"
                }
            ]
            
            for i, job_data in enumerate(test_jobs, 1):
                try:
                    response = await client.post(f"{self.base_url}/jobs", json=job_data, headers=headers)
                    
                    if response.status_code == 200:
                        job = response.json()
                        job_id = job["id"]
                        self.test_job_ids.append(job_id)
                        print(f"✅ Created job {i}: {job_id} - {job['title']}")
                    else:
                        print(f"❌ Failed to create job {i}: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    print(f"❌ Exception creating job {i}: {str(e)}")
            
            print(f"📊 Created {len(self.test_job_ids)} test jobs")
            return len(self.test_job_ids) > 0

    async def test_get_job_by_id_valid_ids(self):
        """Test GET /api/jobs/{jobId} with valid job IDs"""
        print("🎯 Testing GET /api/jobs/{jobId} with VALID IDs...")
        
        if not self.test_job_ids:
            self.log_test("GET Job by Valid ID", False, "No test jobs available")
            return
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with employer token
            employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
            worker_headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            for i, job_id in enumerate(self.test_job_ids, 1):
                try:
                    # Test with employer token
                    response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=employer_headers)
                    
                    if response.status_code == 200:
                        job = response.json()
                        if job["id"] == job_id:
                            self.log_test(f"GET Job {i} (Employer)", True, 
                                        f"Retrieved job: {job_id} - {job['title']}")
                        else:
                            self.log_test(f"GET Job {i} (Employer)", False, 
                                        f"ID mismatch: expected {job_id}, got {job['id']}")
                    else:
                        self.log_test(f"GET Job {i} (Employer)", False, 
                                    f"Status: {response.status_code} - {response.text}")
                    
                    # Test with worker token
                    response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=worker_headers)
                    
                    if response.status_code == 200:
                        job = response.json()
                        if job["id"] == job_id:
                            self.log_test(f"GET Job {i} (Worker)", True, 
                                        f"Retrieved job: {job_id} - {job['title']}")
                        else:
                            self.log_test(f"GET Job {i} (Worker)", False, 
                                        f"ID mismatch: expected {job_id}, got {job['id']}")
                    else:
                        self.log_test(f"GET Job {i} (Worker)", False, 
                                    f"Status: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    self.log_test(f"GET Job {i}", False, f"Exception: {str(e)}")

    async def test_get_job_by_id_invalid_ids(self):
        """Test GET /api/jobs/{jobId} with INVALID job IDs (should return 404)"""
        print("🚫 Testing GET /api/jobs/{jobId} with INVALID IDs...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.employer_token}"}
            
            # Test various invalid ID formats
            invalid_ids = [
                "job_nonexistent_12345",
                "job_" + str(uuid.uuid4()),  # Valid format but doesn't exist
                "invalid_format_no_prefix",
                "job_",  # Empty after prefix
                "completely_wrong_format",
                "job_12345678-1234-1234-1234-123456789012",  # Valid UUID format but doesn't exist
                "",  # Empty string
                "null",
                "undefined"
            ]
            
            for i, invalid_id in enumerate(invalid_ids, 1):
                try:
                    if invalid_id == "":
                        # Empty string case - might cause different error
                        response = await client.get(f"{self.base_url}/jobs/", headers=headers)
                    else:
                        response = await client.get(f"{self.base_url}/jobs/{invalid_id}", headers=headers)
                    
                    if response.status_code == 404:
                        self.log_test(f"Invalid ID {i}", True, 
                                    f"Correctly returned 404 for: '{invalid_id}'")
                    elif response.status_code == 422 and invalid_id == "":
                        self.log_test(f"Invalid ID {i}", True, 
                                    f"Correctly returned 422 for empty ID")
                    elif response.status_code == 405 and invalid_id == "":
                        self.log_test(f"Invalid ID {i}", True, 
                                    f"Correctly returned 405 for empty ID (Method Not Allowed)")
                    else:
                        self.log_test(f"Invalid ID {i}", False, 
                                    f"Expected 404, got {response.status_code} for: '{invalid_id}'")
                        
                except Exception as e:
                    self.log_test(f"Invalid ID {i}", False, f"Exception: {str(e)}")

    async def test_get_job_unauthorized(self):
        """Test GET /api/jobs/{jobId} without proper authorization"""
        print("🔒 Testing GET /api/jobs/{jobId} without authorization...")
        
        if not self.test_job_ids:
            self.log_test("Unauthorized Access Test", False, "No test jobs available")
            return
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            job_id = self.test_job_ids[0]
            
            try:
                # Test without Authorization header
                response = await client.get(f"{self.base_url}/jobs/{job_id}")
                
                if response.status_code == 401:
                    self.log_test("No Auth Header", True, "Correctly returned 401 without auth header")
                else:
                    self.log_test("No Auth Header", False, f"Expected 401, got {response.status_code}")
                
                # Test with invalid token format
                invalid_headers = {"Authorization": "InvalidFormat token123"}
                response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=invalid_headers)
                
                if response.status_code == 401:
                    self.log_test("Invalid Auth Format", True, "Correctly returned 401 with invalid format")
                else:
                    self.log_test("Invalid Auth Format", False, f"Expected 401, got {response.status_code}")
                
                # Test with invalid token
                invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
                response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=invalid_headers)
                
                if response.status_code == 401:
                    self.log_test("Invalid Token", True, "Correctly returned 401 with invalid token")
                else:
                    self.log_test("Invalid Token", False, f"Expected 401, got {response.status_code}")
                    
            except Exception as e:
                self.log_test("Unauthorized Access", False, f"Exception: {str(e)}")

    async def test_performance_multiple_sequential_requests(self):
        """Test performance of multiple sequential requests (simulating new matches.tsx behavior)"""
        print("⚡ Testing PERFORMANCE of multiple sequential GET requests...")
        
        if not self.test_job_ids:
            self.log_test("Performance Test", False, "No test jobs available")
            return
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            try:
                start_time = datetime.now()
                successful_requests = 0
                failed_requests = 0
                response_times = []
                
                # Simulate the NEW matches.tsx behavior: multiple individual getJobById() calls
                for job_id in self.test_job_ids:
                    request_start = datetime.now()
                    
                    response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=headers)
                    
                    request_end = datetime.now()
                    request_time = (request_end - request_start).total_seconds()
                    response_times.append(request_time)
                    
                    if response.status_code == 200:
                        successful_requests += 1
                    else:
                        failed_requests += 1
                
                end_time = datetime.now()
                total_duration = (end_time - start_time).total_seconds()
                avg_response_time = sum(response_times) / len(response_times) if response_times else 0
                max_response_time = max(response_times) if response_times else 0
                min_response_time = min(response_times) if response_times else 0
                
                if successful_requests == len(self.test_job_ids):
                    self.log_test("Performance Test", True, 
                        f"Successfully retrieved {successful_requests} jobs in {total_duration:.2f}s "
                        f"(avg: {avg_response_time:.3f}s, min: {min_response_time:.3f}s, max: {max_response_time:.3f}s per job)")
                else:
                    self.log_test("Performance Test", False, 
                        f"Only {successful_requests}/{len(self.test_job_ids)} requests succeeded "
                        f"({failed_requests} failed) in {total_duration:.2f}s")
                
                # Performance benchmark: Each request should be under 1 second
                if max_response_time < 1.0:
                    self.log_test("Performance Benchmark", True, 
                        f"All requests under 1s (max: {max_response_time:.3f}s)")
                else:
                    self.log_test("Performance Benchmark", False, 
                        f"Some requests over 1s (max: {max_response_time:.3f}s)")
                        
            except Exception as e:
                self.log_test("Performance Test", False, f"Exception: {str(e)}")

    async def test_response_data_integrity(self):
        """Test that response data contains all expected fields"""
        print("🔍 Testing RESPONSE DATA INTEGRITY...")
        
        if not self.test_job_ids:
            self.log_test("Data Integrity Test", False, "No test jobs available")
            return
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            try:
                job_id = self.test_job_ids[0]
                response = await client.get(f"{self.base_url}/jobs/{job_id}", headers=headers)
                
                if response.status_code == 200:
                    job = response.json()
                    
                    # Check required fields
                    required_fields = [
                        "id", "employerId", "title", "category", "timeMode", 
                        "address", "workerAmountCents", "paymentToWorker", 
                        "status", "createdAt"
                    ]
                    
                    missing_fields = []
                    for field in required_fields:
                        if field not in job:
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        self.log_test("Required Fields", True, 
                            f"All required fields present: {', '.join(required_fields)}")
                    else:
                        self.log_test("Required Fields", False, 
                            f"Missing fields: {', '.join(missing_fields)}")
                    
                    # Check data types
                    type_checks = [
                        ("id", str),
                        ("employerId", str),
                        ("title", str),
                        ("workerAmountCents", int),
                        ("status", str)
                    ]
                    
                    type_errors = []
                    for field, expected_type in type_checks:
                        if field in job and not isinstance(job[field], expected_type):
                            type_errors.append(f"{field} should be {expected_type.__name__}, got {type(job[field]).__name__}")
                    
                    if not type_errors:
                        self.log_test("Data Types", True, "All field types correct")
                    else:
                        self.log_test("Data Types", False, f"Type errors: {'; '.join(type_errors)}")
                        
                else:
                    self.log_test("Data Integrity Test", False, f"Failed to get job: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Data Integrity Test", False, f"Exception: {str(e)}")

    async def check_backend_health(self):
        """Check backend health and logs"""
        print("🏥 Checking BACKEND HEALTH...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Health check
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Backend Health Check", True, f"Backend healthy: {data}")
                else:
                    self.log_test("Backend Health Check", False, f"Health check failed: {response.status_code}")
                
                # Root endpoint check
                response = await client.get(f"{self.base_url}/")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Root Endpoint", True, f"Root endpoint working: {data}")
                else:
                    self.log_test("Root Endpoint", False, f"Root endpoint failed: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Backend Health", False, f"Exception: {str(e)}")

    async def cleanup_test_jobs(self):
        """Clean up created test jobs"""
        print("🧹 Cleaning up test jobs...")
        
        if not self.employer_token or not self.test_job_ids:
            print("⚠️  No cleanup needed")
            return
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.employer_token}"}
            
            for job_id in self.test_job_ids:
                try:
                    response = await client.delete(f"{self.base_url}/jobs/{job_id}", headers=headers)
                    
                    if response.status_code == 200:
                        print(f"✅ Deleted job: {job_id}")
                    else:
                        print(f"⚠️  Failed to delete job {job_id}: {response.status_code}")
                        
                except Exception as e:
                    print(f"⚠️  Exception deleting job {job_id}: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 GET /api/jobs/{jobId} ENDPOINT TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🎯 CONCLUSION:")
        if failed_tests == 0:
            print("✅ GET /api/jobs/{jobId} endpoint is working correctly!")
            print("✅ Ready for matches.tsx performance optimization")
            print("✅ Multiple sequential requests perform well")
            print("✅ Proper error handling for invalid IDs")
        else:
            print("❌ Some issues found with GET /api/jobs/{jobId} endpoint")
            print("⚠️  Review failed tests before deploying matches.tsx changes")
        
        return passed_tests, failed_tests

    async def run_all_tests(self):
        """Run all focused tests for GET /api/jobs/{jobId}"""
        print("🚀 STARTING GET /api/jobs/{jobId} ENDPOINT TESTING")
        print("Testing nach matches.tsx Performance-Refaktorierung")
        print("=" * 70)
        
        try:
            # Setup
            if not await self.setup_auth_tokens():
                print("❌ Failed to setup authentication, aborting tests")
                return False
            
            if not await self.create_test_jobs():
                print("❌ Failed to create test jobs, aborting tests")
                return False
            
            # Core endpoint tests
            await self.test_get_job_by_id_valid_ids()
            await self.test_get_job_by_id_invalid_ids()
            await self.test_get_job_unauthorized()
            await self.test_performance_multiple_sequential_requests()
            await self.test_response_data_integrity()
            await self.check_backend_health()
            
            # Cleanup
            await self.cleanup_test_jobs()
            
        except Exception as e:
            print(f"❌ Test execution failed: {str(e)}")
            return False
        
        # Print summary
        passed, failed = self.print_summary()
        return failed == 0

async def main():
    """Main test runner"""
    tester = JobEndpointTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! GET /api/jobs/{jobId} endpoint is ready for production.")
    else:
        print("\n⚠️  Some tests failed. Check the results above.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())