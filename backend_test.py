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
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None

    def test_backend_health(self):
        """Test basic backend connectivity"""
        print("\n=== BACKEND HEALTH CHECK ===")
        
        response = self.make_request("GET", "/")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                self.log_test("Backend Health Check", True, "Backend is responding correctly")
                return True
            else:
                self.log_test("Backend Health Check", False, f"Unexpected response: {data}")
                return False
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Backend Health Check", False, f"Backend not responding: {status_code}")
            return False

    def test_create_worker_profile(self):
        """Test creating worker profile for distance testing"""
        print("\n=== CREATING TEST WORKER PROFILE ===")
        
        worker_data = {
            "categories": ["sicherheit", "gastronomie"],
            "selectedTags": ["service_kellner", "Sachkunde nach § 34a GewO"],
            "radiusKm": 20,
            "homeAddress": {
                "street": "Brandenburger Tor",
                "postalCode": "10117",
                "city": "Berlin"
            },
            "homeLat": 52.5163,
            "homeLon": 13.3777,
            "firstName": "Test Distance",
            "contactPhone": "0123456789",
            "contactEmail": "test@distance.de"
        }
        
        # First try to get existing profile
        get_response = self.make_request("GET", f"/profiles/worker/{TEST_WORKER}", token=TEST_WORKER)
        if get_response and get_response.status_code == 200:
            self.created_worker_profile = get_response.json()
            self.log_test("Create Worker Profile", True, "Profile already exists, retrieved successfully")
            return True
        
        # If profile doesn't exist, create it
        response = self.make_request("POST", "/profiles/worker", worker_data, TEST_WORKER)
        
        if response and response.status_code in [200, 201]:
            self.created_worker_profile = response.json()
            self.log_test("Create Worker Profile", True, 
                         f"Profile created with radius {worker_data['radiusKm']}km at Berlin Brandenburger Tor")
            return True
        elif response and response.status_code == 400:
            # Profile might already exist, try to get it again
            get_response = self.make_request("GET", f"/profiles/worker/{TEST_WORKER}", token=TEST_WORKER)
            if get_response and get_response.status_code == 200:
                self.created_worker_profile = get_response.json()
                self.log_test("Create Worker Profile", True, "Profile already exists, retrieved successfully")
                return True
            else:
                self.log_test("Create Worker Profile", False, f"Profile exists but cannot retrieve: {get_response.status_code if get_response else 'No response'}")
                return False
        else:
            error_msg = response.text if response else "No response"
            status_code = response.status_code if response else "No response"
            self.log_test("Create Worker Profile", False, f"Failed to create profile: {status_code} - {error_msg}")
            return False

    def test_create_test_jobs(self):
        """Create 4 test jobs at different distances and requirements"""
        print("\n=== CREATING TEST JOBS ===")
        
        jobs_data = [
            {
                "name": "Job 1: Nahe (5km) - Security mit Sachkunde",
                "data": {
                    "title": "Security Nahbereich (5km)",
                    "category": "sicherheit",
                    "timeMode": "fixed_time",
                    "address": {
                        "street": "Potsdamer Platz 1",
                        "postalCode": "10785",
                        "city": "Berlin"
                    },
                    "lat": 52.5096,
                    "lon": 13.3762,
                    "workerAmountCents": 15000,
                    "required_all_tags": ["Sachkunde nach § 34a GewO"],
                    "status": "open"
                },
                "expected_match": True,
                "reason": "5km distance + has required Sachkunde tag"
            },
            {
                "name": "Job 2: Mittel (15km) - Gastronomie ohne spezielle Tags",
                "data": {
                    "title": "Kellner Mittlere Distanz (15km)",
                    "category": "gastronomie",
                    "timeMode": "fixed_time",
                    "address": {
                        "street": "Alexanderplatz 1",
                        "postalCode": "10178",
                        "city": "Berlin"
                    },
                    "lat": 52.5219,
                    "lon": 13.4132,
                    "workerAmountCents": 12000,
                    "required_all_tags": [],
                    "status": "open"
                },
                "expected_match": True,
                "reason": "15km distance + no special tags required"
            },
            {
                "name": "Job 3: Weit (30km) - Außerhalb Radius",
                "data": {
                    "title": "Job Außerhalb (30km)",
                    "category": "gastronomie",
                    "timeMode": "fixed_time",
                    "address": {
                        "street": "Oranienburg",
                        "postalCode": "16515",
                        "city": "Oranienburg"
                    },
                    "lat": 52.7534,
                    "lon": 13.2399,
                    "workerAmountCents": 10000,
                    "required_all_tags": [],
                    "status": "open"
                },
                "expected_match": False,
                "reason": "30km > 20km radius limit"
            },
            {
                "name": "Job 4: Nahe aber fehlende Qualifikation",
                "data": {
                    "title": "Security mit Bewacher-ID (Worker hat nicht)",
                    "category": "sicherheit",
                    "timeMode": "fixed_time",
                    "address": {
                        "street": "Unter den Linden",
                        "postalCode": "10117",
                        "city": "Berlin"
                    },
                    "lat": 52.5170,
                    "lon": 13.3888,
                    "workerAmountCents": 18000,
                    "required_all_tags": ["Bewacher-ID"],
                    "status": "open"
                },
                "expected_match": False,
                "reason": "Worker doesn't have required Bewacher-ID tag"
            }
        ]
        
        success_count = 0
        
        for job_info in jobs_data:
            job_name = job_info["name"]
            job_data = job_info["data"]
            
            response = self.make_request("POST", "/jobs", job_data, TEST_EMPLOYER)
            
            if response and response.status_code in [200, 201]:
                created_job = response.json()
                self.created_jobs.append({
                    "job": created_job,
                    "expected_match": job_info["expected_match"],
                    "reason": job_info["reason"],
                    "name": job_name
                })
                self.log_test(f"Create {job_name}", True, f"Job created at lat={job_data['lat']}, lon={job_data['lon']}")
                success_count += 1
            else:
                error_msg = response.text if response else "No response"
                self.log_test(f"Create {job_name}", False, f"Failed: {error_msg}")
        
        return success_count == len(jobs_data)

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth radius in kilometers
        r = 6371
        
        return c * r

    def test_job_matching_logic(self):
        """Test the matching logic for all created jobs"""
        print("\n=== TESTING JOB MATCHING LOGIC ===")
        
        if not self.created_worker_profile:
            self.log_test("Job Matching Logic", False, "No worker profile available for testing")
            return False
        
        if not self.created_jobs:
            self.log_test("Job Matching Logic", False, "No jobs available for testing")
            return False
        
        # Get all jobs from backend
        response = self.make_request("GET", "/jobs", token=TEST_WORKER)
        
        if not response or response.status_code != 200:
            self.log_test("Job Matching Logic", False, "Failed to retrieve jobs from backend")
            return False
        
        all_jobs = response.json()
        worker_profile = self.created_worker_profile
        
        # Worker data for matching
        worker_lat = worker_profile.get("homeLat")
        worker_lon = worker_profile.get("homeLon")
        worker_radius = worker_profile.get("radiusKm", 20)
        worker_categories = worker_profile.get("categories", [])
        worker_tags = worker_profile.get("selectedTags", [])
        
        print(f"Worker Profile: lat={worker_lat}, lon={worker_lon}, radius={worker_radius}km")
        print(f"Worker Categories: {worker_categories}")
        print(f"Worker Tags: {worker_tags}")
        
        matching_results = []
        
        for job_info in self.created_jobs:
            job = job_info["job"]
            expected_match = job_info["expected_match"]
            reason = job_info["reason"]
            job_name = job_info["name"]
            
            # Calculate distance
            job_lat = job.get("lat")
            job_lon = job.get("lon")
            
            if job_lat is None or job_lon is None or worker_lat is None or worker_lon is None:
                distance = float('inf')
                distance_ok = False
            else:
                distance = self.calculate_distance(worker_lat, worker_lon, job_lat, job_lon)
                distance_ok = distance <= worker_radius
            
            # Check category match
            job_category = job.get("category")
            category_ok = job_category in worker_categories
            
            # Check required tags
            required_all_tags = job.get("required_all_tags", [])
            tags_ok = all(tag in worker_tags for tag in required_all_tags)
            
            # Overall match
            should_match = distance_ok and category_ok and tags_ok
            
            # Log detailed analysis
            print(f"\n--- {job_name} ---")
            print(f"Distance: {distance:.1f}km ({'✅' if distance_ok else '❌'} <= {worker_radius}km)")
            print(f"Category: {job_category} ({'✅' if category_ok else '❌'} in {worker_categories})")
            print(f"Required Tags: {required_all_tags} ({'✅' if tags_ok else '❌'} all in {worker_tags})")
            print(f"Expected Match: {expected_match}, Calculated Match: {should_match}")
            print(f"Reason: {reason}")
            
            # Verify against expected result
            if should_match == expected_match:
                self.log_test(f"Match Logic - {job_name}", True, 
                             f"Correct: {'ENABLED' if should_match else 'DISABLED'} ({reason})")
                matching_results.append(True)
            else:
                self.log_test(f"Match Logic - {job_name}", False, 
                             f"Expected {expected_match}, got {should_match} ({reason})")
                matching_results.append(False)
        
        # Overall matching test result
        all_correct = all(matching_results)
        self.log_test("Overall Job Matching Logic", all_correct, 
                     f"{sum(matching_results)}/{len(matching_results)} jobs matched correctly")
        
        return all_correct

    def test_get_all_jobs(self):
        """Test retrieving all jobs"""
        print("\n=== TESTING GET ALL JOBS ===")
        
        response = self.make_request("GET", "/jobs", token=TEST_WORKER)
        
        if response and response.status_code == 200:
            jobs = response.json()
            job_count = len(jobs)
            
            # Verify our created jobs are in the list
            created_job_ids = [job_info["job"]["id"] for job_info in self.created_jobs]
            found_jobs = [job for job in jobs if job["id"] in created_job_ids]
            
            self.log_test("Get All Jobs", True, 
                         f"Retrieved {job_count} total jobs, {len(found_jobs)}/{len(created_job_ids)} test jobs found")
            return True
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get All Jobs", False, f"Failed to retrieve jobs: {error_msg}")
            return False

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n=== CLEANUP TEST DATA ===")
        
        # Delete created jobs
        deleted_jobs = 0
        for job_info in self.created_jobs:
            job_id = job_info["job"]["id"]
            response = self.make_request("DELETE", f"/jobs/{job_id}", token=TEST_EMPLOYER)
            
            if response and response.status_code in [200, 204]:
                deleted_jobs += 1
        
        self.log_test("Cleanup Jobs", True, f"Deleted {deleted_jobs}/{len(self.created_jobs)} test jobs")

    def run_comprehensive_test(self):
        """Run the complete test suite"""
        print("🚀 STARTING COMPREHENSIVE JOBS MATCHING SYSTEM TEST")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Backend Health", self.test_backend_health),
            ("Create Worker Profile", self.test_create_worker_profile),
            ("Create Test Jobs", self.test_create_test_jobs),
            ("Get All Jobs", self.test_get_all_jobs),
            ("Job Matching Logic", self.test_job_matching_logic),
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed_tests += 1
                else:
                    print(f"❌ {test_name} failed - stopping test sequence")
                    break
            except Exception as e:
                print(f"❌ {test_name} crashed: {e}")
                break
        
        # Cleanup regardless of test results
        try:
            self.cleanup_test_data()
        except Exception as e:
            print(f"⚠️ Cleanup failed: {e}")
        
        # Final results
        print("\n" + "=" * 60)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Jobs matching system is working correctly!")
            return True
        else:
            print("❌ SOME TESTS FAILED - Jobs matching system needs attention")
            return False

def main():
    """Main test execution"""
    tester = DistanceMatchingTester()
    success = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()