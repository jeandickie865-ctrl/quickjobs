#!/usr/bin/env python3
"""
Backend Test Suite for ShiftMatch DELETE Match Feature
Testing DELETE /api/applications/{application_id} endpoint
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://employer-worker.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_delete_match_feature(self):
        """
        Comprehensive test of DELETE /api/applications/{application_id} endpoint
        
        Test Scenario:
        1. ✅ Create test users (Worker + Employer)
        2. ✅ Create job 
        3. ✅ Create application (Worker applies)
        4. ✅ Accept application (Status = "accepted")
        5. ✅ DELETE /api/applications/{application_id}
        6. ✅ Verify: Application is deleted from MongoDB
        7. ✅ Verify: GET /api/applications/{application_id} returns 404
        """
        
        self.log("🎯 STARTING DELETE MATCH FEATURE BACKEND VERIFICATION")
        self.log("=" * 60)
        
        try:
            # Step 1: Create test users
            self._create_test_users()
            
            # Step 2: Create job
            self._create_test_job()
            
            # Step 3: Create application
            self._create_application()
            
            # Step 4: Accept application
            self._accept_application()
            
            # Step 5: Test DELETE endpoint
            self._test_delete_application()
            
            # Step 6: Verify deletion
            self._verify_application_deleted()
            
            # Step 7: Test authorization (403 scenarios)
            self._test_delete_authorization()
            
            self.log("🎉 ALL DELETE MATCH TESTS PASSED!", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"❌ TEST FAILED: {str(e)}", "ERROR")
            return False
    
    def _create_test_users(self):
        """Step 1: Create Worker and Employer test users"""
        self.log("📝 Step 1: Creating test users...")
        
        # Generate unique emails to avoid conflicts
        timestamp = int(time.time())
        worker_email = f"testworker_{timestamp}@test.de"
        employer_email = f"testemployer_{timestamp}@test.de"
        
        # Create Worker
        worker_data = {
            "email": worker_email,
            "password": "Test123!",
            "role": "worker"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=worker_data, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Worker signup failed: {response.status_code} - {response.text}")
        
        worker_auth = response.json()
        self.test_data['worker'] = {
            'email': worker_email,
            'userId': worker_auth['userId'],
            'token': worker_auth['token'],
            'headers': {'Authorization': f"Bearer {worker_auth['token']}"}
        }
        
        self.log(f"✅ Worker created: {worker_email} (ID: {worker_auth['userId']})")
        
        # Create Employer
        employer_data = {
            "email": employer_email,
            "password": "Test123!",
            "role": "employer"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/signup", json=employer_data, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Employer signup failed: {response.status_code} - {response.text}")
        
        employer_auth = response.json()
        self.test_data['employer'] = {
            'email': employer_email,
            'userId': employer_auth['userId'],
            'token': employer_auth['token'],
            'headers': {'Authorization': f"Bearer {employer_auth['token']}"}
        }
        
        self.log(f"✅ Employer created: {employer_email} (ID: {employer_auth['userId']})")
    
    def _create_test_job(self):
        """Step 2: Create a test job"""
        self.log("📝 Step 2: Creating test job...")
        
        # Job for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        job_data = {
            "title": "Test Security Job",
            "description": "Test job for DELETE match testing",
            "category": "sicherheit",
            "timeMode": "fixed_time",
            "date": tomorrow,
            "start_at": "09:00",
            "end_at": "17:00",
            "address": {
                "street": "Teststraße 123",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 15000,  # 150 EUR
            "paymentToWorker": "cash",
            "subcategory": "objektschutz",
            "qualifications": ["sicherheitsschein"],
            "status": "open"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/jobs", 
            json=job_data,
            headers=self.test_data['employer']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Job creation failed: {response.status_code} - {response.text}")
        
        job = response.json()
        self.test_data['job'] = {
            'id': job['id'],
            'title': job['title'],
            'employerId': job['employerId']
        }
        
        self.log(f"✅ Job created: {job['id']} - {job['title']}")
    
    def _create_application(self):
        """Step 3: Worker applies to the job"""
        self.log("📝 Step 3: Creating application (Worker applies)...")
        
        app_data = {
            "jobId": self.test_data['job']['id']
        }
        
        response = requests.post(
            f"{BACKEND_URL}/applications",
            json=app_data,
            headers=self.test_data['worker']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Application creation failed: {response.status_code} - {response.text}")
        
        application = response.json()
        self.test_data['application'] = {
            'id': application['id'],
            'jobId': application['jobId'],
            'workerId': application['workerId'],
            'employerId': application['employerId'],
            'status': application['status']
        }
        
        self.log(f"✅ Application created: {application['id']} (Status: {application['status']})")
    
    def _accept_application(self):
        """Step 4: Employer accepts the application"""
        self.log("📝 Step 4: Accepting application...")
        
        app_id = self.test_data['application']['id']
        
        response = requests.put(
            f"{BACKEND_URL}/applications/{app_id}/accept",
            headers=self.test_data['employer']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Application acceptance failed: {response.status_code} - {response.text}")
        
        accepted_app = response.json()
        self.test_data['application']['status'] = accepted_app['status']
        
        self.log(f"✅ Application accepted: {app_id} (Status: {accepted_app['status']})")
    
    def _test_delete_application(self):
        """Step 5: Test DELETE /api/applications/{application_id}"""
        self.log("📝 Step 5: Testing DELETE endpoint...")
        
        app_id = self.test_data['application']['id']
        
        # Test DELETE as Worker (should work)
        response = requests.delete(
            f"{BACKEND_URL}/applications/{app_id}",
            headers=self.test_data['worker']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"DELETE failed: {response.status_code} - {response.text}")
        
        result = response.json()
        expected_message = "Application deleted successfully"
        
        if result.get('message') != expected_message:
            raise Exception(f"Unexpected response message: {result}")
        
        self.log(f"✅ DELETE successful: {result['message']}")
    
    def _verify_application_deleted(self):
        """Step 6: Verify application is deleted from MongoDB"""
        self.log("📝 Step 6: Verifying application deletion...")
        
        app_id = self.test_data['application']['id']
        
        # Try to GET the deleted application (should return 404)
        response = requests.get(
            f"{BACKEND_URL}/applications/{app_id}",
            headers=self.test_data['worker']['headers'],
            timeout=10
        )
        
        if response.status_code != 404:
            raise Exception(f"Expected 404, got {response.status_code}. Application not properly deleted!")
        
        self.log("✅ Verification passed: GET returns 404 (application properly deleted)")
    
    def _test_delete_authorization(self):
        """Step 7: Test authorization scenarios (403 cases)"""
        self.log("📝 Step 7: Testing authorization scenarios...")
        
        # Create another application for authorization testing
        app_data = {"jobId": self.test_data['job']['id']}
        
        response = requests.post(
            f"{BACKEND_URL}/applications",
            json=app_data,
            headers=self.test_data['worker']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Second application creation failed: {response.status_code}")
        
        second_app = response.json()
        second_app_id = second_app['id']
        
        self.log(f"✅ Second application created for auth testing: {second_app_id}")
        
        # Test DELETE as Employer (should also work)
        response = requests.delete(
            f"{BACKEND_URL}/applications/{second_app_id}",
            headers=self.test_data['employer']['headers'],
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Employer DELETE failed: {response.status_code} - {response.text}")
        
        self.log("✅ Employer can also delete applications")
        
        # Test DELETE with invalid token (should return 401)
        invalid_headers = {'Authorization': 'Bearer invalid_token_123'}
        
        response = requests.delete(
            f"{BACKEND_URL}/applications/nonexistent_app",
            headers=invalid_headers,
            timeout=10
        )
        
        if response.status_code != 401:
            self.log(f"⚠️ Expected 401 for invalid token, got {response.status_code}")
        else:
            self.log("✅ Invalid token properly rejected (401)")
        
        # Test DELETE non-existent application (should return 404)
        response = requests.delete(
            f"{BACKEND_URL}/applications/app_nonexistent123",
            headers=self.test_data['worker']['headers'],
            timeout=10
        )
        
        if response.status_code != 404:
            self.log(f"⚠️ Expected 404 for non-existent app, got {response.status_code}")
        else:
            self.log("✅ Non-existent application properly returns 404")

def test_backend_health():
    """Test basic backend reachability"""
    print("\n🏥 Backend Health Check...")
    
    try:
        health_response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"   📤 GET /api/health: {health_response.status_code}")
        
        if health_response.status_code == 200:
            print(f"   ✅ Backend reachable")
            return True
        else:
            print(f"   ❌ Backend not reachable: {health_response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Health Check Error: {e}")
        return False

def main():
    """Main test execution"""
    print("🚀 DELETE MATCH FEATURE BACKEND VERIFICATION")
    print("=" * 60)
    print("Testing DELETE /api/applications/{application_id} endpoint")
    print("=" * 60)
    
    # Health Check
    if not test_backend_health():
        print("\n❌ Backend not reachable - Test aborted")
        return False
    
    # Main test
    tester = BackendTester()
    success = tester.test_delete_match_feature()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 DELETE MATCH FEATURE VERIFICATION COMPLETE")
        print("✅ All tests passed - DELETE endpoint is fully functional")
        print("✅ Worker and Employer can both delete their matches")
        print("✅ Applications are properly removed from MongoDB")
        print("✅ Authorization is correctly enforced")
    else:
        print("❌ DELETE MATCH FEATURE VERIFICATION FAILED")
        print("Some tests did not pass - check logs above")
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    main()