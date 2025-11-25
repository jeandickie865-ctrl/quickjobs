#!/usr/bin/env python3
"""
Backend API Testing Suite for ShiftMatch Applications API
Testing Phase 3: Applications System

This script tests all Applications API endpoints with realistic German data
as requested in the German review.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Backend URL from frontend/.env
BACKEND_URL = "https://jobfinder-de.preview.emergentagent.com/api"

# Test users
TEST_WORKER = "user_testworker_test_de"
TEST_EMPLOYER = "user_testemployer_test_de"

class ApplicationsAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_jobs = []
        self.test_applications = []
        self.results = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if details:
            result += f" - {details}"
        self.results.append((success, result))
        print(result)
        
    def make_request(self, method: str, endpoint: str, headers: Dict = None, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, None, 0
                
            return True, response, response.status_code
            
        except Exception as e:
            print(f"Request failed: {e}")
            return False, None, 0
    
    def create_test_jobs(self) -> bool:
        """Create 2 test jobs for application testing"""
        print("\n=== CREATING TEST JOBS ===")
        
        # Job 1: Kellner für Hochzeit
        job1_data = {
            "title": "Kellner für Hochzeit in Berlin",
            "description": "Suchen erfahrenen Kellner für Hochzeitsfeier am Wochenende",
            "category": "gastronomie",
            "timeMode": "fixed_time",
            "startAt": "2024-12-15T18:00:00",
            "endAt": "2024-12-15T23:00:00",
            "address": {
                "street": "Unter den Linden 1",
                "postalCode": "10117",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 15000,  # 150 EUR
            "paymentToWorker": "cash",
            "required_all_tags": ["service_kellner"],
            "required_any_tags": ["erfahrung_gastronomie"],
            "status": "open"
        }
        
        # Job 2: Umzugshilfe
        job2_data = {
            "title": "Umzugshilfe in München",
            "description": "Benötigen Hilfe beim Umzug einer 3-Zimmer-Wohnung",
            "category": "transport_umzug",
            "timeMode": "hour_package",
            "hours": 6.0,
            "address": {
                "street": "Marienplatz 8",
                "postalCode": "80331",
                "city": "München",
                "country": "DE"
            },
            "lat": 48.1351,
            "lon": 11.5820,
            "workerAmountCents": 12000,  # 120 EUR
            "paymentToWorker": "bank",
            "required_all_tags": ["transport_umzug"],
            "required_any_tags": ["koerperliche_arbeit"],
            "status": "open"
        }
        
        headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        
        # Create Job 1
        success, response, status = self.make_request("POST", "/jobs", headers, job1_data)
        if success and status in [200, 201]:
            job1 = response.json()
            self.test_jobs.append(job1)
            self.log_result("Create Job 1 (Kellner)", True, f"ID: {job1['id']}")
        else:
            self.log_result("Create Job 1 (Kellner)", False, f"Status: {status}")
            return False
            
        # Create Job 2
        success, response, status = self.make_request("POST", "/jobs", headers, job2_data)
        if success and status in [200, 201]:
            job2 = response.json()
            self.test_jobs.append(job2)
            self.log_result("Create Job 2 (Umzug)", True, f"ID: {job2['id']}")
        else:
            self.log_result("Create Job 2 (Umzug)", False, f"Status: {status}")
            return False
            
        return True
    
    def test_create_applications(self) -> bool:
        """Test POST /api/applications - Create applications"""
        print("\n=== TESTING APPLICATION CREATION ===")
        
        if len(self.test_jobs) < 2:
            self.log_result("Create Applications", False, "Not enough test jobs")
            return False
            
        job1_id = self.test_jobs[0]["id"]
        job2_id = self.test_jobs[1]["id"]
        
        headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        
        # Application 1: Worker applies to Job 1
        app1_data = {
            "jobId": job1_id,
            "workerId": TEST_WORKER,
            "employerId": TEST_EMPLOYER
        }
        
        success, response, status = self.make_request("POST", "/applications", headers, app1_data)
        if success and status in [200, 201]:
            app1 = response.json()
            self.test_applications.append(app1)
            self.log_result("Create Application 1 (Worker -> Job1)", True, f"ID: {app1['id']}")
        else:
            self.log_result("Create Application 1 (Worker -> Job1)", False, f"Status: {status}")
            return False
        
        # Application 2: Same worker applies to Job 1 again (should return existing)
        success, response, status = self.make_request("POST", "/applications", headers, app1_data)
        if success and status in [200, 201]:
            app1_duplicate = response.json()
            if app1_duplicate["id"] == app1["id"]:
                self.log_result("Duplicate Application Check", True, "Returns existing application")
            else:
                self.log_result("Duplicate Application Check", False, "Created new instead of returning existing")
        else:
            self.log_result("Duplicate Application Check", False, f"Status: {status}")
        
        # Application 3: Worker applies to Job 2
        app3_data = {
            "jobId": job2_id,
            "workerId": TEST_WORKER,
            "employerId": TEST_EMPLOYER
        }
        
        success, response, status = self.make_request("POST", "/applications", headers, app3_data)
        if success and status in [200, 201]:
            app3 = response.json()
            self.test_applications.append(app3)
            self.log_result("Create Application 3 (Worker -> Job2)", True, f"ID: {app3['id']}")
        else:
            self.log_result("Create Application 3 (Worker -> Job2)", False, f"Status: {status}")
            return False
            
        # Create second worker application to Job 1 for accept testing
        second_worker = "user_testworker2_test_de"
        headers_worker2 = {"Authorization": f"Bearer {second_worker}"}
        app2_data = {
            "jobId": job1_id,
            "workerId": second_worker,
            "employerId": TEST_EMPLOYER
        }
        
        success, response, status = self.make_request("POST", "/applications", headers_worker2, app2_data)
        if success and status in [200, 201]:
            app2 = response.json()
            self.test_applications.append(app2)
            self.log_result("Create Application 2 (Worker2 -> Job1)", True, f"ID: {app2['id']}")
        else:
            self.log_result("Create Application 2 (Worker2 -> Job1)", False, f"Status: {status}")
            
        return True
    
    def test_get_applications_for_job(self) -> bool:
        """Test GET /api/applications/job/{jobId}"""
        print("\n=== TESTING GET APPLICATIONS FOR JOB ===")
        
        if not self.test_jobs:
            self.log_result("Get Applications for Job", False, "No test jobs available")
            return False
            
        job1_id = self.test_jobs[0]["id"]
        headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        
        # Test as employer (should work)
        success, response, status = self.make_request("GET", f"/applications/job/{job1_id}", headers)
        if success and status == 200:
            applications = response.json()
            if isinstance(applications, list) and len(applications) >= 1:
                self.log_result("Get Applications for Job (Employer)", True, f"Found {len(applications)} applications")
            else:
                self.log_result("Get Applications for Job (Employer)", False, "No applications returned")
        else:
            self.log_result("Get Applications for Job (Employer)", False, f"Status: {status}")
            
        # Test as worker (should get 403)
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("GET", f"/applications/job/{job1_id}", worker_headers)
        if success and status == 403:
            self.log_result("Get Applications for Job (Worker - 403)", True, "Correctly blocked worker access")
        else:
            self.log_result("Get Applications for Job (Worker - 403)", False, f"Expected 403, got {status}")
            
        return True
    
    def test_get_applications_for_worker(self) -> bool:
        """Test GET /api/applications/worker/{workerId}"""
        print("\n=== TESTING GET APPLICATIONS FOR WORKER ===")
        
        headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        
        # Test as worker (should work)
        success, response, status = self.make_request("GET", f"/applications/worker/{TEST_WORKER}", headers)
        if success and status == 200:
            applications = response.json()
            if isinstance(applications, list) and len(applications) >= 1:
                self.log_result("Get Applications for Worker (Self)", True, f"Found {len(applications)} applications")
            else:
                self.log_result("Get Applications for Worker (Self)", False, "No applications returned")
        else:
            self.log_result("Get Applications for Worker (Self)", False, f"Status: {status}")
            
        # Test as different worker (should get 403)
        other_worker_headers = {"Authorization": f"Bearer user_otherworker_test_de"}
        success, response, status = self.make_request("GET", f"/applications/worker/{TEST_WORKER}", other_worker_headers)
        if success and status == 403:
            self.log_result("Get Applications for Worker (Other - 403)", True, "Correctly blocked other worker access")
        else:
            self.log_result("Get Applications for Worker (Other - 403)", False, f"Expected 403, got {status}")
            
        return True
    
    def test_get_applications_for_employer(self) -> bool:
        """Test GET /api/applications/employer/{employerId}"""
        print("\n=== TESTING GET APPLICATIONS FOR EMPLOYER ===")
        
        headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        
        # Test as employer (should work)
        success, response, status = self.make_request("GET", f"/applications/employer/{TEST_EMPLOYER}", headers)
        if success and status == 200:
            applications = response.json()
            if isinstance(applications, list) and len(applications) >= 1:
                self.log_result("Get Applications for Employer (Self)", True, f"Found {len(applications)} applications")
            else:
                self.log_result("Get Applications for Employer (Self)", False, "No applications returned")
        else:
            self.log_result("Get Applications for Employer (Self)", False, f"Status: {status}")
            
        return True
    
    def test_get_single_application(self) -> bool:
        """Test GET /api/applications/{applicationId}"""
        print("\n=== TESTING GET SINGLE APPLICATION ===")
        
        if not self.test_applications:
            self.log_result("Get Single Application", False, "No test applications available")
            return False
            
        app_id = self.test_applications[0]["id"]
        
        # Test as worker (should work)
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("GET", f"/applications/{app_id}", worker_headers)
        if success and status == 200:
            application = response.json()
            if application.get("id") == app_id:
                self.log_result("Get Single Application (Worker)", True, f"Retrieved application {app_id}")
            else:
                self.log_result("Get Single Application (Worker)", False, "Wrong application returned")
        else:
            self.log_result("Get Single Application (Worker)", False, f"Status: {status}")
            
        # Test as employer (should work)
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("GET", f"/applications/{app_id}", employer_headers)
        if success and status == 200:
            application = response.json()
            if application.get("id") == app_id:
                self.log_result("Get Single Application (Employer)", True, f"Retrieved application {app_id}")
            else:
                self.log_result("Get Single Application (Employer)", False, "Wrong application returned")
        else:
            self.log_result("Get Single Application (Employer)", False, f"Status: {status}")
            
        # Test as unauthorized user (should get 403)
        unauthorized_headers = {"Authorization": f"Bearer user_unauthorized_test_de"}
        success, response, status = self.make_request("GET", f"/applications/{app_id}", unauthorized_headers)
        if success and status == 403:
            self.log_result("Get Single Application (Unauthorized - 403)", True, "Correctly blocked unauthorized access")
        else:
            self.log_result("Get Single Application (Unauthorized - 403)", False, f"Expected 403, got {status}")
            
        return True
    
    def test_accept_application(self) -> bool:
        """Test PUT /api/applications/{applicationId}/accept - Complex business logic"""
        print("\n=== TESTING ACCEPT APPLICATION (COMPLEX LOGIC) ===")
        
        if len(self.test_applications) < 2:
            self.log_result("Accept Application", False, "Need at least 2 applications for testing")
            return False
            
        # Find applications for job1 (should have 2 applications)
        job1_id = self.test_jobs[0]["id"]
        job1_applications = [app for app in self.test_applications if app["jobId"] == job1_id]
        
        if len(job1_applications) < 2:
            self.log_result("Accept Application", False, f"Need 2 applications for job1, found {len(job1_applications)}")
            return False
            
        app_to_accept = job1_applications[0]
        app_to_reject = job1_applications[1]
        
        headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        
        # Accept first application
        success, response, status = self.make_request(
            "PUT", 
            f"/applications/{app_to_accept['id']}/accept",
            headers,
            params={"employer_confirmed_legal": "true"}
        )
        
        if success and status == 200:
            accepted_app = response.json()
            if accepted_app.get("status") == "accepted":
                self.log_result("Accept Application", True, f"Application {app_to_accept['id']} accepted")
            else:
                self.log_result("Accept Application", False, f"Status not 'accepted': {accepted_app.get('status')}")
                return False
        else:
            self.log_result("Accept Application", False, f"Status: {status}")
            return False
            
        # Verify other application was rejected
        success, response, status = self.make_request("GET", f"/applications/{app_to_reject['id']}", headers)
        if success and status == 200:
            rejected_app = response.json()
            if rejected_app.get("status") == "rejected":
                self.log_result("Auto-reject Other Applications", True, f"Application {app_to_reject['id']} auto-rejected")
            else:
                self.log_result("Auto-reject Other Applications", False, f"Status not 'rejected': {rejected_app.get('status')}")
        else:
            self.log_result("Auto-reject Other Applications", False, f"Could not verify rejection, status: {status}")
            
        # Verify job status changed to "matched"
        success, response, status = self.make_request("GET", f"/jobs/{job1_id}", headers)
        if success and status == 200:
            job = response.json()
            if job.get("status") == "matched" and job.get("matchedWorkerId") == app_to_accept["workerId"]:
                self.log_result("Job Status Update to Matched", True, f"Job {job1_id} marked as matched")
            else:
                self.log_result("Job Status Update to Matched", False, f"Job status: {job.get('status')}, matchedWorker: {job.get('matchedWorkerId')}")
        else:
            self.log_result("Job Status Update to Matched", False, f"Could not verify job status, status: {status}")
            
        return True
    
    def test_update_application(self) -> bool:
        """Test PUT /api/applications/{applicationId} - Update legal confirmations"""
        print("\n=== TESTING UPDATE APPLICATION ===")
        
        if not self.test_applications:
            self.log_result("Update Application", False, "No test applications available")
            return False
            
        app_id = self.test_applications[0]["id"]
        
        # Test worker confirming legal
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        update_data = {"workerConfirmedLegal": True}
        
        success, response, status = self.make_request("PUT", f"/applications/{app_id}", worker_headers, update_data)
        if success and status == 200:
            updated_app = response.json()
            if updated_app.get("workerConfirmedLegal") == True:
                self.log_result("Update Application (Worker Legal)", True, "Worker legal confirmation updated")
            else:
                self.log_result("Update Application (Worker Legal)", False, "Legal confirmation not updated")
        else:
            self.log_result("Update Application (Worker Legal)", False, f"Status: {status}")
            
        # Test employer confirming legal
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        update_data = {"employerConfirmedLegal": True}
        
        success, response, status = self.make_request("PUT", f"/applications/{app_id}", employer_headers, update_data)
        if success and status == 200:
            updated_app = response.json()
            if updated_app.get("employerConfirmedLegal") == True:
                self.log_result("Update Application (Employer Legal)", True, "Employer legal confirmation updated")
            else:
                self.log_result("Update Application (Employer Legal)", False, "Legal confirmation not updated")
        else:
            self.log_result("Update Application (Employer Legal)", False, f"Status: {status}")
            
        return True
    
    def test_404_errors(self) -> bool:
        """Test 404 errors for non-existent applications"""
        print("\n=== TESTING 404 ERROR HANDLING ===")
        
        fake_app_id = "app_nonexistent_12345"
        headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        
        # Test GET non-existent application
        success, response, status = self.make_request("GET", f"/applications/{fake_app_id}", headers)
        if success and status == 404:
            self.log_result("404 for Non-existent Application", True, "Correctly returns 404")
        else:
            self.log_result("404 for Non-existent Application", False, f"Expected 404, got {status}")
            
        return True
    
    def run_comprehensive_test(self) -> bool:
        """Run the complete test suite as requested in German review"""
        print("🚀 STARTING COMPREHENSIVE APPLICATIONS API TESTING")
        print("=" * 60)
        
        # Step 1: Create test jobs
        if not self.create_test_jobs():
            print("❌ Failed to create test jobs - aborting")
            return False
            
        # Step 2: Create applications (3 applications: 2 on job1, 1 on job2)
        if not self.test_create_applications():
            print("❌ Failed to create test applications - aborting")
            return False
            
        # Step 3: Test all GET endpoints
        self.test_get_applications_for_job()
        self.test_get_applications_for_worker()
        self.test_get_applications_for_employer()
        self.test_get_single_application()
        
        # Step 4: Test accept logic (accept first application on job1)
        self.test_accept_application()
        
        # Step 5: Test update functionality
        self.test_update_application()
        
        # Step 6: Test error handling
        self.test_404_errors()
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for success, _ in self.results if success)
        total = len(self.results)
        
        for success, result in self.results:
            print(result)
            
        print(f"\n📊 RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Applications API is fully functional!")
            return True
        else:
            print(f"❌ {total - passed} tests failed - Applications API needs fixes")
            return False

def main():
    """Main test execution"""
    print("Backend Applications API Testing Suite")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Test Worker: {TEST_WORKER}")
    print(f"Test Employer: {TEST_EMPLOYER}")
    
    tester = ApplicationsAPITester()
    success = tester.run_comprehensive_test()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()