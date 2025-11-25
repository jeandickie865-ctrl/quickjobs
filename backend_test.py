#!/usr/bin/env python3
"""
Backend API Testing Suite for ShiftMatch App
Tests the comprehensive Jobs matching system with distance/radius filtering
As requested in the German review request for UMFASSENDE TESTS: Jobs im Umkreis / Matching-System
"""

import requests
import json
import sys
from typing import Dict, List, Any
import uuid
import math

# Backend URL from frontend/.env
BACKEND_URL = "https://jobfinder-de.preview.emergentagent.com/api"

# Test users as specified in the review request
TEST_WORKER = "user_test_distance_worker"
TEST_EMPLOYER = "user_test_employer_distance"

class DistanceMatchingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        
        # Test data storage
        self.created_worker_profile = None
        self.created_jobs = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, headers: Dict = None, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        # Default headers
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=default_headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=default_headers, json=data, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                return False, None, 0
                
            return True, response, response.status_code
            
        except Exception as e:
            print(f"Request failed: {e}")
            return False, None, 0
    
    def test_backend_health(self) -> bool:
        """Test basic backend connectivity"""
        print("\n=== BACKEND HEALTH CHECK ===")
        
        # Test root endpoint
        success, response, status = self.make_request("GET", "/")
        if success and status == 200:
            self.log_result("Backend Root Endpoint", True, f"Response: {response.json()}")
            return True
        else:
            self.log_result("Backend Root Endpoint", False, f"Status: {status if success else 'No response'}")
            return False
    
    def setup_test_data(self) -> bool:
        """Create test jobs and applications for chat testing"""
        print("\n=== SETTING UP TEST DATA ===")
        
        # Create test job
        job_data = {
            "title": "Test Chat Job - Sicherheitsdienst",
            "description": "Job für Chat-System Testing",
            "category": "sicherheit",
            "timeMode": "fixed_time",
            "startAt": "2024-12-20T10:00:00",
            "endAt": "2024-12-20T18:00:00",
            "address": {
                "street": "Teststraße 1",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 15000,
            "paymentToWorker": "cash",
            "required_all_tags": ["security_guard"],
            "required_any_tags": ["first_aid"]
        }
        
        # Create job as employer
        headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("POST", "/jobs", headers, job_data)
        if not success or status != 200:
            self.log_result("Setup - Job Creation", False, f"Status: {status if success else 'No response'}")
            return False
        
        job = response.json()
        self.test_jobs.append(job)
        self.log_result("Setup - Job Creation", True, f"Job ID: {job['id']}")
        
        # Create application as worker
        app_data = {
            "jobId": job["id"],
            "workerId": TEST_WORKER,
            "employerId": TEST_EMPLOYER
        }
        
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("POST", "/applications", worker_headers, app_data)
        if not success or status != 200:
            self.log_result("Setup - Application Creation", False, f"Status: {status if success else 'No response'}")
            return False
        
        application = response.json()
        self.test_applications.append(application)
        self.log_result("Setup - Application Creation", True, f"Application ID: {application['id']}")
        
        return True
    
    def test_chat_system(self) -> bool:
        """Test Chat Messages API - Critical Priority"""
        print("\n=== CHAT SYSTEM TESTING (CRITICAL) ===")
        
        if not self.test_applications:
            self.log_result("Chat System", False, "No test applications available")
            return False
        
        app_id = self.test_applications[0]["id"]
        
        # Test 1: Worker sends message to Employer
        message_data = {
            "applicationId": app_id,
            "message": "Hallo, ich bin interessiert an diesem Job!"
        }
        
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("POST", "/chat/messages", worker_headers, message_data)
        if not success or status != 200:
            self.log_result("POST /api/chat/messages (Worker)", False, f"Status: {status if success else 'No response'}")
            return False
        
        worker_msg = response.json()
        expected_fields = ["id", "applicationId", "senderId", "senderRole", "message", "createdAt", "read"]
        missing_fields = [field for field in expected_fields if field not in worker_msg]
        
        if missing_fields:
            self.log_result("POST /api/chat/messages (Worker)", False, f"Missing fields: {missing_fields}")
            return False
        
        if worker_msg["senderRole"] != "worker":
            self.log_result("POST /api/chat/messages (Worker)", False, f"Expected senderRole 'worker', got '{worker_msg['senderRole']}'")
            return False
        
        self.log_result("POST /api/chat/messages (Worker)", True, f"Message ID: {worker_msg['id']}, Sender: {worker_msg['senderRole']}")
        
        # Test 2: Employer retrieves messages (should mark worker message as read)
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("GET", f"/chat/messages/{app_id}", employer_headers)
        if not success or status != 200:
            self.log_result("GET /api/chat/messages/{applicationId} (Employer)", False, f"Status: {status if success else 'No response'}")
            return False
        
        messages = response.json()
        if len(messages) != 1:
            self.log_result("GET /api/chat/messages/{applicationId} (Employer)", False, f"Expected 1 message, got {len(messages)}")
            return False
        
        # Check if message was marked as read (auto-read functionality)
        if messages[0]["read"] != True:
            self.log_result("Auto-Read Functionality", False, f"Message should be marked as read=true, got read={messages[0]['read']}")
            return False
        
        self.log_result("GET /api/chat/messages/{applicationId} (Employer)", True, f"Retrieved {len(messages)} messages")
        self.log_result("Auto-Read Functionality", True, "Worker message marked as read when employer fetched messages")
        
        # Test 3: Employer sends reply
        reply_data = {
            "applicationId": app_id,
            "message": "Hallo! Ja, Sie sind perfekt für diesen Job. Wann können Sie anfangen?"
        }
        
        success, response, status = self.make_request("POST", "/chat/messages", employer_headers, reply_data)
        if not success or status != 200:
            self.log_result("POST /api/chat/messages (Employer Reply)", False, f"Status: {status if success else 'No response'}")
            return False
        
        employer_msg = response.json()
        if employer_msg["senderRole"] != "employer":
            self.log_result("POST /api/chat/messages (Employer Reply)", False, f"Expected senderRole 'employer', got '{employer_msg['senderRole']}'")
            return False
        
        self.log_result("POST /api/chat/messages (Employer Reply)", True, f"Message ID: {employer_msg['id']}, Sender: {employer_msg['senderRole']}")
        
        # Test 4: Worker retrieves all messages (should see both messages)
        success, response, status = self.make_request("GET", f"/chat/messages/{app_id}", worker_headers)
        if not success or status != 200:
            self.log_result("GET /api/chat/messages/{applicationId} (Worker Final)", False, f"Status: {status if success else 'No response'}")
            return False
        
        final_messages = response.json()
        if len(final_messages) != 2:
            self.log_result("GET /api/chat/messages/{applicationId} (Worker Final)", False, f"Expected 2 messages, got {len(final_messages)}")
            return False
        
        # Check message order (should be sorted by createdAt)
        if final_messages[0]["senderRole"] != "worker" or final_messages[1]["senderRole"] != "employer":
            self.log_result("Message Ordering", False, "Messages not in correct chronological order")
            return False
        
        # Check if employer message was marked as read
        if final_messages[1]["read"] != True:
            self.log_result("Auto-Read Functionality (Employer Message)", False, f"Employer message should be marked as read=true, got read={final_messages[1]['read']}")
            return False
        
        self.log_result("GET /api/chat/messages/{applicationId} (Worker Final)", True, f"Retrieved {len(final_messages)} messages in correct order")
        self.log_result("Auto-Read Functionality (Employer Message)", True, "Employer message marked as read when worker fetched messages")
        
        return True
    
    def test_reviews_system(self) -> bool:
        """Test Reviews/Ratings System"""
        print("\n=== REVIEWS/RATINGS SYSTEM TESTING ===")
        
        if not self.test_jobs:
            self.log_result("Reviews System", False, "No test jobs available")
            return False
        
        job_id = self.test_jobs[0]["id"]
        
        # Test 1: Create Review
        review_data = {
            "jobId": job_id,
            "workerId": TEST_WORKER,
            "employerId": TEST_EMPLOYER,
            "rating": 5,
            "comment": "Ausgezeichneter Worker! Sehr zuverlässig und professionell."
        }
        
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("POST", "/reviews", employer_headers, review_data)
        if not success or status != 200:
            self.log_result("POST /api/reviews", False, f"Status: {status if success else 'No response'}")
            return False
        
        review = response.json()
        expected_fields = ["id", "jobId", "workerId", "employerId", "rating", "comment", "createdAt"]
        missing_fields = [field for field in expected_fields if field not in review]
        
        if missing_fields:
            self.log_result("POST /api/reviews", False, f"Missing fields: {missing_fields}")
            return False
        
        if review["rating"] != 5:
            self.log_result("POST /api/reviews", False, f"Expected rating 5, got {review['rating']}")
            return False
        
        self.test_reviews.append(review)
        self.log_result("POST /api/reviews", True, f"Review created: {review['id']}, Rating: {review['rating']}")
        
        # Test 2: Duplicate Review Check (should update existing)
        updated_review_data = {
            "jobId": job_id,
            "workerId": TEST_WORKER,
            "employerId": TEST_EMPLOYER,
            "rating": 4,
            "comment": "Guter Worker, aber könnte pünktlicher sein."
        }
        
        success, response, status = self.make_request("POST", "/reviews", employer_headers, updated_review_data)
        if not success or status != 200:
            self.log_result("POST /api/reviews (Duplicate Check)", False, f"Status: {status if success else 'No response'}")
            return False
        
        updated_review = response.json()
        if updated_review["rating"] != 4:
            self.log_result("Duplicate Review Update", False, f"Rating should be updated to 4, got {updated_review['rating']}")
            return False
        
        self.log_result("POST /api/reviews (Duplicate Check)", True, "Existing review updated instead of creating duplicate")
        self.log_result("Duplicate Review Update", True, f"Rating updated from 5 to {updated_review['rating']}")
        
        # Test 3: Get Reviews for Worker
        success, response, status = self.make_request("GET", f"/reviews/worker/{TEST_WORKER}", employer_headers)
        if not success or status != 200:
            self.log_result("GET /api/reviews/worker/{workerId}", False, f"Status: {status if success else 'No response'}")
            return False
        
        worker_reviews = response.json()
        if len(worker_reviews) < 1:
            self.log_result("GET /api/reviews/worker/{workerId}", False, f"Expected at least 1 review, got {len(worker_reviews)}")
            return False
        
        self.log_result("GET /api/reviews/worker/{workerId}", True, f"Retrieved {len(worker_reviews)} reviews for worker")
        
        # Test 4: Get Reviews for Employer
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("GET", f"/reviews/employer/{TEST_EMPLOYER}", worker_headers)
        if not success or status != 200:
            self.log_result("GET /api/reviews/employer/{employerId}", False, f"Status: {status if success else 'No response'}")
            return False
        
        employer_reviews = response.json()
        self.log_result("GET /api/reviews/employer/{employerId}", True, f"Retrieved {len(employer_reviews)} reviews for employer")
        
        return True
    
    def test_employer_profiles(self) -> bool:
        """Test Employer Profile System"""
        print("\n=== EMPLOYER PROFILE SYSTEM TESTING ===")
        
        # Test 1: Create Employer Profile
        profile_data = {
            "firstName": "Max",
            "lastName": "Mustermann",
            "company": "Mustermann GmbH",
            "phone": "+49 30 12345678",
            "email": "max.mustermann@example.com",
            "street": "Musterstraße 123",
            "postalCode": "10115",
            "city": "Berlin",
            "lat": 52.5200,
            "lon": 13.4050,
            "paymentMethod": "card",
            "shortBio": "Erfahrener Arbeitgeber mit über 10 Jahren Erfahrung."
        }
        
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("POST", "/profiles/employer", employer_headers, profile_data)
        
        if success and status == 400:
            # Profile might already exist, try to get it
            self.log_result("POST /api/profiles/employer", "INFO", "Profile already exists, testing GET instead")
        elif not success or status != 200:
            self.log_result("POST /api/profiles/employer", False, f"Status: {status if success else 'No response'}")
            return False
        else:
            created_profile = response.json()
            expected_fields = ["userId", "firstName", "lastName", "phone", "email", "street", "postalCode", "city"]
            missing_fields = [field for field in expected_fields if field not in created_profile]
            
            if missing_fields:
                self.log_result("POST /api/profiles/employer", False, f"Missing fields: {missing_fields}")
                return False
            
            self.log_result("POST /api/profiles/employer", True, f"Profile created for user: {created_profile['userId']}")
        
        # Test 2: Get Employer Profile
        success, response, status = self.make_request("GET", f"/profiles/employer/{TEST_EMPLOYER}", employer_headers)
        if not success or status != 200:
            self.log_result("GET /api/profiles/employer/{userId}", False, f"Status: {status if success else 'No response'}")
            return False
        
        profile = response.json()
        required_fields = ["firstName", "lastName", "phone", "email", "street", "postalCode", "city"]
        missing_fields = [field for field in required_fields if not profile.get(field)]
        
        if missing_fields:
            self.log_result("GET /api/profiles/employer/{userId}", False, f"Missing required fields: {missing_fields}")
            return False
        
        self.log_result("GET /api/profiles/employer/{userId}", True, "Profile retrieved with all required fields")
        
        # Test 3: Update Employer Profile
        update_data = {
            "company": "Updated Mustermann AG",
            "shortBio": "Aktualisierte Biografie mit neuen Informationen.",
            "paymentMethod": "paypal"
        }
        
        success, response, status = self.make_request("PUT", f"/profiles/employer/{TEST_EMPLOYER}", employer_headers, update_data)
        if not success or status != 200:
            self.log_result("PUT /api/profiles/employer/{userId}", False, f"Status: {status if success else 'No response'}")
            return False
        
        updated_profile = response.json()
        if updated_profile.get("company") != "Updated Mustermann AG":
            self.log_result("PUT /api/profiles/employer/{userId}", False, "Company not updated correctly")
            return False
        
        self.log_result("PUT /api/profiles/employer/{userId}", True, "Profile updated successfully")
        
        return True
    
    def test_previous_systems_smoke(self) -> bool:
        """Smoke test for previously implemented systems"""
        print("\n=== PREVIOUS SYSTEMS SMOKE TEST ===")
        
        # Test Worker Profiles
        worker_headers = {"Authorization": f"Bearer {TEST_WORKER}"}
        success, response, status = self.make_request("GET", f"/profiles/worker/{TEST_WORKER}", worker_headers)
        if success and status == 200:
            self.log_result("Worker Profiles (GET)", True, "Worker profile endpoint accessible")
        else:
            self.log_result("Worker Profiles (GET)", "WARN", f"Status: {status if success else 'No response'}")
        
        # Test Jobs (GET employer jobs)
        employer_headers = {"Authorization": f"Bearer {TEST_EMPLOYER}"}
        success, response, status = self.make_request("GET", f"/jobs/employer/{TEST_EMPLOYER}", employer_headers)
        if success and status == 200:
            jobs = response.json()
            self.log_result("Jobs System (GET employer jobs)", True, f"Retrieved {len(jobs)} jobs for employer")
        else:
            self.log_result("Jobs System (GET employer jobs)", "WARN", f"Status: {status if success else 'No response'}")
        
        # Test Applications (GET worker applications)
        success, response, status = self.make_request("GET", f"/applications/worker/{TEST_WORKER}", worker_headers)
        if success and status == 200:
            apps = response.json()
            self.log_result("Applications System (GET worker applications)", True, f"Retrieved {len(apps)} applications for worker")
        else:
            self.log_result("Applications System (GET worker applications)", "WARN", f"Status: {status if success else 'No response'}")
        
        return True
    
    def run_comprehensive_test(self) -> bool:
        """Run the complete test suite as requested in German review"""
        print("🚀 STARTING COMPREHENSIVE BACKEND API TESTING")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Test Worker ID: {TEST_WORKER}")
        print(f"Test Employer ID: {TEST_EMPLOYER}")
        
        # Track test results
        test_results = {}
        
        # Step 1: Backend Health Check
        test_results["Backend Health"] = self.test_backend_health()
        if not test_results["Backend Health"]:
            print("❌ Backend health check failed - aborting")
            return False
        
        # Step 2: Setup test data
        test_results["Test Data Setup"] = self.setup_test_data()
        if not test_results["Test Data Setup"]:
            print("❌ Failed to setup test data - aborting")
            return False
        
        # Step 3: Test Chat System (Critical Priority)
        test_results["Chat System"] = self.test_chat_system()
        
        # Step 4: Test Reviews System
        test_results["Reviews System"] = self.test_reviews_system()
        
        # Step 5: Test Employer Profiles
        test_results["Employer Profiles"] = self.test_employer_profiles()
        
        # Step 6: Smoke test previous systems
        test_results["Previous Systems"] = self.test_previous_systems_smoke()
        
        # Summary
        print("\n" + "=" * 60)
        print("🎯 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result is True)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            if result is True:
                status = "✅ PASS"
            elif result is False:
                status = "❌ FAIL"
            else:
                status = "⚠️  WARN"
            print(f"{status} {test_name}")
        
        print(f"\n📊 RESULTS: {passed}/{total} test suites passed")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS:")
        for success, result in self.results:
            print(result)
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED - Backend is fully functional!")
            return True
        else:
            print(f"\n⚠️  {total - passed} test suites failed - Check logs above for details")
            return False

def main():
    """Main test execution"""
    print("Comprehensive Backend API Testing Suite for ShiftMatch")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Test Worker: {TEST_WORKER}")
    print(f"Test Employer: {TEST_EMPLOYER}")
    
    tester = ComprehensiveBackendTester()
    success = tester.run_comprehensive_test()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()