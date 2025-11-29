#!/usr/bin/env python3
"""
Backend Testing Suite for POST /api/registrations/complete Endpoint
Tests the new endpoint comprehensively as requested in German.
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://schnellhire.preview.emergentagent.com/api"

class RegistrationCompleteEndpointTester:
    def __init__(self):
        self.test_results = []
        self.test_data = {}
        
    def log_test(self, test_name, success, details):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_unique_email(self, prefix="testuser"):
        """Generate unique email for testing"""
        timestamp = int(time.time())
        return f"{prefix}_{timestamp}@test.de"
    
    def test_backend_health(self):
        """Test if backend is accessible"""
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Health Check", True, f"Backend accessible: {response.json()}")
                return True
            else:
                self.log_test("Backend Health Check", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def create_test_users(self):
        """Create test worker and employer users"""
        try:
            # Create Worker
            worker_email = self.generate_unique_email("worker")
            worker_data = {
                "email": worker_email,
                "password": "TestPass123!",
                "role": "worker"
            }
            
            worker_response = requests.post(f"{BACKEND_URL}/auth/signup", json=worker_data, timeout=10)
            if worker_response.status_code != 200:
                self.log_test("Create Test Worker", False, f"Status {worker_response.status_code}: {worker_response.text}")
                return False
            
            worker_auth = worker_response.json()
            self.test_data["worker"] = {
                "email": worker_email,
                "userId": worker_auth["userId"],
                "token": worker_auth["token"]
            }
            
            # Create Employer
            employer_email = self.generate_unique_email("employer")
            employer_data = {
                "email": employer_email,
                "password": "TestPass123!",
                "role": "employer"
            }
            
            employer_response = requests.post(f"{BACKEND_URL}/auth/signup", json=employer_data, timeout=10)
            if employer_response.status_code != 200:
                self.log_test("Create Test Employer", False, f"Status {employer_response.status_code}: {employer_response.text}")
                return False
            
            employer_auth = employer_response.json()
            self.test_data["employer"] = {
                "email": employer_email,
                "userId": employer_auth["userId"],
                "token": employer_auth["token"]
            }
            
            self.log_test("Create Test Users", True, f"Worker: {worker_email}, Employer: {employer_email}")
            return True
            
        except Exception as e:
            self.log_test("Create Test Users", False, f"Error: {str(e)}")
            return False
    
    def create_test_job(self):
        """Create a test job"""
        try:
            job_data = {
                "employerType": "private",
                "title": "Test Security Job für Registration",
                "description": "Test job for official registration testing",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "startAt": "2024-12-20T10:00:00",
                "endAt": "2024-12-20T18:00:00",
                "address": {
                    "street": "Brandenburger Tor",
                    "postalCode": "10117",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5163,
                "lon": 13.3777,
                "workerAmountCents": 15000,
                "paymentToWorker": "cash",
                "required_all_tags": ["sachkunde_34a"],
                "required_any_tags": [],
                "status": "open"
            }
            
            headers = {"Authorization": f"Bearer {self.test_data['employer']['token']}"}
            response = requests.post(f"{BACKEND_URL}/jobs", json=job_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Create Test Job", False, f"Status {response.status_code}: {response.text}")
                return False
            
            job = response.json()
            self.test_data["job"] = {
                "id": job["id"],
                "title": job["title"]
            }
            
            self.log_test("Create Test Job", True, f"Job created: {job['id']}")
            return True
            
        except Exception as e:
            self.log_test("Create Test Job", False, f"Error: {str(e)}")
            return False
    
    def create_test_application(self):
        """Create a test application"""
        try:
            app_data = {
                "jobId": self.test_data["job"]["id"]
            }
            
            headers = {"Authorization": f"Bearer {self.test_data['worker']['token']}"}
            response = requests.post(f"{BACKEND_URL}/applications", json=app_data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Create Test Application", False, f"Status {response.status_code}: {response.text}")
                return False
            
            application = response.json()
            self.test_data["application"] = {
                "id": application["id"],
                "jobId": application["jobId"],
                "workerId": application["workerId"],
                "employerId": application["employerId"]
            }
            
            self.log_test("Create Test Application", True, f"Application created: {application['id']}")
            return True
            
        except Exception as e:
            self.log_test("Create Test Application", False, f"Error: {str(e)}")
            return False
    
    def create_official_registration(self):
        """Create official registration using POST /api/registrations/create"""
        try:
            registration_data = {
                "applicationId": self.test_data["application"]["id"],
                "registrationType": "kurzfristig"
            }
            
            response = requests.post(f"{BACKEND_URL}/registrations/create", json=registration_data, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Create Official Registration", False, f"Status {response.status_code}: {response.text}")
                return False
            
            registration = response.json()
            self.test_data["registration"] = {
                "id": registration["id"],
                "applicationId": registration["applicationId"],
                "status": registration["status"],
                "createdAt": registration["createdAt"],
                "updatedAt": registration["updatedAt"]
            }
            
            self.log_test("Create Official Registration", True, f"Registration created: {registration['id']}, status: {registration['status']}")
            return True
            
        except Exception as e:
            self.log_test("Create Official Registration", False, f"Error: {str(e)}")
            return False
    
    def test_successful_completion(self):
        """Test 1: Erfolgreicher Flow - Complete official registration"""
        try:
            complete_data = {
                "applicationId": self.test_data["application"]["id"]
            }
            
            response = requests.post(f"{BACKEND_URL}/registrations/complete", json=complete_data, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Successful Completion Flow", False, f"Status {response.status_code}: {response.text}")
                return False
            
            completed_registration = response.json()
            
            # Verify response structure
            expected_fields = ["id", "applicationId", "employerId", "workerId", "registrationType", "status", "createdAt", "updatedAt"]
            missing_fields = [field for field in expected_fields if field not in completed_registration]
            
            if missing_fields:
                self.log_test("Successful Completion Flow", False, f"Missing fields: {missing_fields}")
                return False
            
            # Verify status changed to completed
            if completed_registration["status"] != "completed":
                self.log_test("Successful Completion Flow", False, f"Status not 'completed': {completed_registration['status']}")
                return False
            
            # Verify updatedAt was changed (should be different from createdAt)
            if completed_registration["updatedAt"] == completed_registration["createdAt"]:
                self.log_test("Successful Completion Flow", False, "updatedAt was not updated")
                return False
            
            # Verify createdAt remained unchanged
            if completed_registration["createdAt"] != self.test_data["registration"]["createdAt"]:
                self.log_test("Successful Completion Flow", False, "createdAt was modified")
                return False
            
            # Store completed registration data for further tests
            self.test_data["completed_registration"] = completed_registration
            
            self.log_test("Successful Completion Flow", True, f"Registration completed successfully, status: {completed_registration['status']}")
            return True
            
        except Exception as e:
            self.log_test("Successful Completion Flow", False, f"Error: {str(e)}")
            return False
    
    def test_persistence_official_registrations(self):
        """Test 2: Verify persistence in official_registrations collection"""
        try:
            # We can't directly query MongoDB, but we can verify by calling the endpoint again
            # and checking if the status is still "completed"
            complete_data = {
                "applicationId": self.test_data["application"]["id"]
            }
            
            response = requests.post(f"{BACKEND_URL}/registrations/complete", json=complete_data, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Persistence Official Registrations", False, f"Status {response.status_code}: {response.text}")
                return False
            
            registration = response.json()
            
            # Verify status is still "completed"
            if registration["status"] != "completed":
                self.log_test("Persistence Official Registrations", False, f"Status not persisted: {registration['status']}")
                return False
            
            # Verify updatedAt was updated again (idempotent but timestamp changes)
            if registration["updatedAt"] == self.test_data["completed_registration"]["updatedAt"]:
                self.log_test("Persistence Official Registrations", False, "updatedAt not updated on second call")
                return False
            
            self.log_test("Persistence Official Registrations", True, f"Status persisted correctly: {registration['status']}")
            return True
            
        except Exception as e:
            self.log_test("Persistence Official Registrations", False, f"Error: {str(e)}")
            return False
    
    def test_persistence_applications(self):
        """Test 3: Verify persistence in applications collection"""
        try:
            # Get the application to verify officialRegistrationStatus was set
            headers = {"Authorization": f"Bearer {self.test_data['worker']['token']}"}
            response = requests.get(f"{BACKEND_URL}/applications/{self.test_data['application']['id']}", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Persistence Applications", False, f"Status {response.status_code}: {response.text}")
                return False
            
            application = response.json()
            
            # Verify officialRegistrationStatus was set to "completed"
            if application.get("officialRegistrationStatus") != "completed":
                self.log_test("Persistence Applications", False, f"officialRegistrationStatus not set: {application.get('officialRegistrationStatus')}")
                return False
            
            # Verify other fields are unchanged
            if application["id"] != self.test_data["application"]["id"]:
                self.log_test("Persistence Applications", False, "Application ID changed")
                return False
            
            if application["workerId"] != self.test_data["application"]["workerId"]:
                self.log_test("Persistence Applications", False, "Worker ID changed")
                return False
            
            if application["employerId"] != self.test_data["application"]["employerId"]:
                self.log_test("Persistence Applications", False, "Employer ID changed")
                return False
            
            self.log_test("Persistence Applications", True, f"officialRegistrationStatus set correctly: {application['officialRegistrationStatus']}")
            return True
            
        except Exception as e:
            self.log_test("Persistence Applications", False, f"Error: {str(e)}")
            return False
    
    def test_registration_not_found(self):
        """Test 4: Registration nicht gefunden (404)"""
        try:
            # Use non-existent applicationId
            fake_app_id = f"app_{uuid.uuid4().hex[:12]}"
            complete_data = {
                "applicationId": fake_app_id
            }
            
            response = requests.post(f"{BACKEND_URL}/registrations/complete", json=complete_data, timeout=10)
            
            if response.status_code != 404:
                self.log_test("Registration Not Found (404)", False, f"Expected 404, got {response.status_code}: {response.text}")
                return False
            
            # Verify error message
            error_data = response.json()
            expected_message = "Keine offizielle Anmeldung für diese Application gefunden"
            if error_data.get("detail") != expected_message:
                self.log_test("Registration Not Found (404)", False, f"Wrong error message: {error_data.get('detail')}")
                return False
            
            self.log_test("Registration Not Found (404)", True, f"Correct 404 response: {error_data['detail']}")
            return True
            
        except Exception as e:
            self.log_test("Registration Not Found (404)", False, f"Error: {str(e)}")
            return False
    
    def test_incomplete_body(self):
        """Test 5: Unvollständiger Body (422)"""
        try:
            # Test empty body
            response1 = requests.post(f"{BACKEND_URL}/registrations/complete", json={}, timeout=10)
            
            if response1.status_code != 422:
                self.log_test("Incomplete Body - Empty (422)", False, f"Expected 422, got {response1.status_code}: {response1.text}")
                return False
            
            # Test missing applicationId field
            response2 = requests.post(f"{BACKEND_URL}/registrations/complete", json={"wrongField": "value"}, timeout=10)
            
            if response2.status_code != 422:
                self.log_test("Incomplete Body - Wrong Field (422)", False, f"Expected 422, got {response2.status_code}: {response2.text}")
                return False
            
            # Test null applicationId
            response3 = requests.post(f"{BACKEND_URL}/registrations/complete", json={"applicationId": None}, timeout=10)
            
            if response3.status_code != 422:
                self.log_test("Incomplete Body - Null Value (422)", False, f"Expected 422, got {response3.status_code}: {response3.text}")
                return False
            
            self.log_test("Incomplete Body Validation (422)", True, "All invalid body scenarios correctly return 422")
            return True
            
        except Exception as e:
            self.log_test("Incomplete Body Validation (422)", False, f"Error: {str(e)}")
            return False
    
    def test_multiple_completions(self):
        """Test 6: Mehrfaches Abschließen (Idempotent)"""
        try:
            complete_data = {
                "applicationId": self.test_data["application"]["id"]
            }
            
            # Call the endpoint multiple times
            responses = []
            for i in range(3):
                response = requests.post(f"{BACKEND_URL}/registrations/complete", json=complete_data, timeout=10)
                responses.append(response)
                
                if response.status_code != 200:
                    self.log_test("Multiple Completions (Idempotent)", False, f"Call {i+1} failed with status {response.status_code}: {response.text}")
                    return False
                
                registration = response.json()
                
                # Verify status is always "completed"
                if registration["status"] != "completed":
                    self.log_test("Multiple Completions (Idempotent)", False, f"Call {i+1}: Status not 'completed': {registration['status']}")
                    return False
            
            # Verify all calls succeeded and returned consistent data
            first_response = responses[0].json()
            for i, response in enumerate(responses[1:], 2):
                current_response = response.json()
                
                # ID should remain the same
                if current_response["id"] != first_response["id"]:
                    self.log_test("Multiple Completions (Idempotent)", False, f"Call {i}: ID changed")
                    return False
                
                # Status should remain "completed"
                if current_response["status"] != "completed":
                    self.log_test("Multiple Completions (Idempotent)", False, f"Call {i}: Status changed")
                    return False
                
                # createdAt should remain unchanged
                if current_response["createdAt"] != first_response["createdAt"]:
                    self.log_test("Multiple Completions (Idempotent)", False, f"Call {i}: createdAt changed")
                    return False
            
            self.log_test("Multiple Completions (Idempotent)", True, "Endpoint is idempotent - multiple calls successful")
            return True
            
        except Exception as e:
            self.log_test("Multiple Completions (Idempotent)", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting POST /api/registrations/complete Endpoint Testing")
        print("=" * 70)
        
        # Setup phase
        if not self.test_backend_health():
            print("❌ Backend not accessible - aborting tests")
            return False
        
        if not self.create_test_users():
            print("❌ Failed to create test users - aborting tests")
            return False
        
        if not self.create_test_job():
            print("❌ Failed to create test job - aborting tests")
            return False
        
        if not self.create_test_application():
            print("❌ Failed to create test application - aborting tests")
            return False
        
        if not self.create_official_registration():
            print("❌ Failed to create official registration - aborting tests")
            return False
        
        print("\n📋 Test Data Setup Complete - Starting Endpoint Tests")
        print("-" * 50)
        
        # Main tests
        test_methods = [
            self.test_successful_completion,
            self.test_persistence_official_registrations,
            self.test_persistence_applications,
            self.test_registration_not_found,
            self.test_incomplete_body,
            self.test_multiple_completions
        ]
        
        passed = 0
        total = len(test_methods)
        
        for test_method in test_methods:
            if test_method():
                passed += 1
        
        print("\n" + "=" * 70)
        print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - POST /api/registrations/complete is working correctly!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = RegistrationCompleteEndpointTester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\n📊 DETAILED TEST RESULTS:")
    print("-" * 50)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}")
        if not result["success"]:
            print(f"   Details: {result['details']}")
    
    return success

if __name__ == "__main__":
    main()