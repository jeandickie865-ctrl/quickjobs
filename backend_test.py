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

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {test_name}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_job_creation():
    """Test POST /api/jobs - Job creation"""
    print_test_header("Job Creation (POST /api/jobs)")
    
    # Test data from the review request
    job_data = {
        "employerType": "business",
        "title": "Kellner für Hochzeit gesucht",
        "description": "5 Stunden Service für elegante Hochzeitsfeier in Berlin Mitte",
        "category": "gastronomie",
        "timeMode": "fixed_time",
        "startAt": "2025-12-01T18:00:00Z",
        "endAt": "2025-12-01T23:00:00Z",
        "address": {
            "street": "Musterstraße 10",
            "postalCode": "10115",
            "city": "Berlin",
            "country": "DE"
        },
        "lat": 52.5200,
        "lon": 13.4050,
        "workerAmountCents": 10000,
        "paymentToWorker": "cash",
        "required_all_tags": ["service_kellner"],
        "required_any_tags": ["erfahrung_service"],
        "status": "open"
    }
    
    headers = {
        "Authorization": f"Bearer {EMPLOYER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/jobs", json=job_data, headers=headers)
        
        if response.status_code in [200, 201]:
            job = response.json()
            print_success(f"Job created successfully with ID: {job.get('id')}")
            print_info(f"Title: {job.get('title')}")
            print_info(f"Employer ID: {job.get('employerId')}")
            print_info(f"Status: {job.get('status')}")
            print_info(f"Worker Amount: {job.get('workerAmountCents')} cents")
            return job.get('id')  # Return job ID for further tests
        else:
            print_error(f"Job creation failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Job creation error: {str(e)}")
        return None

def test_get_all_open_jobs():
    """Test GET /api/jobs - Get all open jobs"""
    print_test_header("Get All Open Jobs (GET /api/jobs)")
    
    headers = {
        "Authorization": f"Bearer {WORKER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/jobs", headers=headers)
        
        if response.status_code == 200:
            jobs = response.json()
            print_success(f"Retrieved {len(jobs)} open jobs")
            
            for job in jobs:
                if job.get('status') != 'open':
                    print_error(f"Non-open job found: {job.get('id')} has status {job.get('status')}")
                else:
                    print_info(f"Job: {job.get('title')} - Status: {job.get('status')}")
            
            return len(jobs) > 0
        else:
            print_error(f"Failed to get open jobs: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Get open jobs error: {str(e)}")
        return False

def test_get_employer_jobs():
    """Test GET /api/jobs/employer/{employerId} - Get employer's jobs"""
    print_test_header("Get Employer Jobs (GET /api/jobs/employer/{employerId})")
    
    headers = {
        "Authorization": f"Bearer {EMPLOYER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/jobs/employer/{EMPLOYER_TOKEN}", headers=headers)
        
        if response.status_code == 200:
            jobs = response.json()
            print_success(f"Retrieved {len(jobs)} jobs for employer {EMPLOYER_TOKEN}")
            
            for job in jobs:
                if job.get('employerId') != EMPLOYER_TOKEN:
                    print_error(f"Wrong employer job found: {job.get('id')} belongs to {job.get('employerId')}")
                else:
                    print_info(f"Job: {job.get('title')} - Employer: {job.get('employerId')}")
            
            return jobs
        else:
            print_error(f"Failed to get employer jobs: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        print_error(f"Get employer jobs error: {str(e)}")
        return []

def test_get_single_job(job_id):
    """Test GET /api/jobs/{jobId} - Get single job"""
    print_test_header(f"Get Single Job (GET /api/jobs/{job_id})")
    
    if not job_id:
        print_error("No job ID provided for single job test")
        return False
    
    headers = {
        "Authorization": f"Bearer {WORKER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/jobs/{job_id}", headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            print_success(f"Retrieved job: {job.get('title')}")
            print_info(f"Job ID: {job.get('id')}")
            print_info(f"Category: {job.get('category')}")
            print_info(f"Time Mode: {job.get('timeMode')}")
            print_info(f"Address: {job.get('address', {}).get('street')}, {job.get('address', {}).get('city')}")
            return True
        else:
            print_error(f"Failed to get single job: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Get single job error: {str(e)}")
        return False

def test_update_job(job_id):
    """Test PUT /api/jobs/{jobId} - Update job"""
    print_test_header(f"Update Job (PUT /api/jobs/{job_id})")
    
    if not job_id:
        print_error("No job ID provided for update test")
        return False
    
    update_data = {
        "title": "Kellner für Hochzeit gesucht - AKTUALISIERT",
        "description": "5 Stunden Service für elegante Hochzeitsfeier - Neue Details hinzugefügt",
        "workerAmountCents": 12000,  # Increased payment
        "status": "open"
    }
    
    headers = {
        "Authorization": f"Bearer {EMPLOYER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/jobs/{job_id}", json=update_data, headers=headers)
        
        if response.status_code == 200:
            job = response.json()
            print_success(f"Job updated successfully")
            print_info(f"New title: {job.get('title')}")
            print_info(f"New amount: {job.get('workerAmountCents')} cents")
            
            # Verify the update worked
            if job.get('title') == update_data['title'] and job.get('workerAmountCents') == update_data['workerAmountCents']:
                print_success("Update data verified correctly")
                return True
            else:
                print_error("Update data verification failed")
                return False
        else:
            print_error(f"Failed to update job: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Update job error: {str(e)}")
        return False

def test_authorization_failures():
    """Test authorization failures - worker trying to edit employer's job"""
    print_test_header("Authorization Testing - Unauthorized Access")
    
    # First create a job as employer
    job_data = {
        "employerType": "private",
        "title": "Test Job für Authorization",
        "category": "reinigung",
        "timeMode": "project",
        "address": {
            "street": "Teststraße 1",
            "postalCode": "10117",
            "city": "Berlin"
        },
        "workerAmountCents": 5000,
        "status": "open"
    }
    
    employer_headers = {
        "Authorization": f"Bearer {EMPLOYER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        # Create job as employer
        response = requests.post(f"{BACKEND_URL}/jobs", json=job_data, headers=employer_headers)
        if response.status_code not in [200, 201]:
            print_error("Could not create test job for authorization test")
            return False
        
        job_id = response.json().get('id')
        print_info(f"Created test job {job_id} as employer")
        
        # Try to update as worker (should fail)
        worker_headers = {
            "Authorization": f"Bearer {WORKER_TOKEN}",
            "Content-Type": "application/json"
        }
        
        update_data = {"title": "Hacked Job Title"}
        
        response = requests.put(f"{BACKEND_URL}/jobs/{job_id}", json=update_data, headers=worker_headers)
        
        if response.status_code == 403:
            print_success("Authorization correctly blocked worker from updating employer's job")
            auth_test_passed = True
        else:
            print_error(f"Authorization failed - worker was able to update job: {response.status_code}")
            auth_test_passed = False
        
        # Try to delete as worker (should fail)
        response = requests.delete(f"{BACKEND_URL}/jobs/{job_id}", headers=worker_headers)
        
        if response.status_code == 403:
            print_success("Authorization correctly blocked worker from deleting employer's job")
            auth_test_passed = auth_test_passed and True
        else:
            print_error(f"Authorization failed - worker was able to delete job: {response.status_code}")
            auth_test_passed = False
        
        # Clean up - delete the test job as employer
        requests.delete(f"{BACKEND_URL}/jobs/{job_id}", headers=employer_headers)
        
        return auth_test_passed
        
    except Exception as e:
        print_error(f"Authorization test error: {str(e)}")
        return False

def test_delete_job(job_id):
    """Test DELETE /api/jobs/{jobId} - Delete job"""
    print_test_header(f"Delete Job (DELETE /api/jobs/{job_id})")
    
    if not job_id:
        print_error("No job ID provided for delete test")
        return False
    
    headers = {
        "Authorization": f"Bearer {EMPLOYER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.delete(f"{BACKEND_URL}/jobs/{job_id}", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Job deleted successfully: {result.get('message')}")
            
            # Verify job is actually deleted by trying to get it
            get_response = requests.get(f"{BACKEND_URL}/jobs/{job_id}", headers=headers)
            if get_response.status_code == 404:
                print_success("Job deletion verified - job no longer exists")
                return True
            else:
                print_error("Job deletion verification failed - job still exists")
                return False
        else:
            print_error(f"Failed to delete job: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Delete job error: {str(e)}")
        return False

def test_404_errors():
    """Test 404 errors for non-existent jobs"""
    print_test_header("404 Error Testing - Non-existent Jobs")
    
    fake_job_id = "job_nonexistent_12345"
    headers = {
        "Authorization": f"Bearer {WORKER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    tests_passed = 0
    total_tests = 3
    
    try:
        # Test GET non-existent job
        response = requests.get(f"{BACKEND_URL}/jobs/{fake_job_id}", headers=headers)
        if response.status_code == 404:
            print_success("GET non-existent job correctly returns 404")
            tests_passed += 1
        else:
            print_error(f"GET non-existent job returned {response.status_code} instead of 404")
        
        # Test PUT non-existent job
        employer_headers = {"Authorization": f"Bearer {EMPLOYER_TOKEN}", "Content-Type": "application/json"}
        response = requests.put(f"{BACKEND_URL}/jobs/{fake_job_id}", json={"title": "test"}, headers=employer_headers)
        if response.status_code == 404:
            print_success("PUT non-existent job correctly returns 404")
            tests_passed += 1
        else:
            print_error(f"PUT non-existent job returned {response.status_code} instead of 404")
        
        # Test DELETE non-existent job
        response = requests.delete(f"{BACKEND_URL}/jobs/{fake_job_id}", headers=employer_headers)
        if response.status_code == 404:
            print_success("DELETE non-existent job correctly returns 404")
            tests_passed += 1
        else:
            print_error(f"DELETE non-existent job returned {response.status_code} instead of 404")
        
        return tests_passed == total_tests
        
    except Exception as e:
        print_error(f"404 testing error: {str(e)}")
        return False

def main():
    """Run all Jobs API tests"""
    print("🚀 STARTING JOBS API TESTING SUITE")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Employer Token: {EMPLOYER_TOKEN}")
    print(f"Worker Token: {WORKER_TOKEN}")
    
    test_results = []
    created_job_id = None
    
    # Test 1: Job Creation
    created_job_id = test_job_creation()
    test_results.append(("Job Creation", created_job_id is not None))
    
    # Test 2: Get All Open Jobs
    test_results.append(("Get All Open Jobs", test_get_all_open_jobs()))
    
    # Test 3: Get Employer Jobs
    employer_jobs = test_get_employer_jobs()
    test_results.append(("Get Employer Jobs", len(employer_jobs) >= 0))
    
    # Test 4: Get Single Job (if we have a job ID)
    if created_job_id:
        test_results.append(("Get Single Job", test_get_single_job(created_job_id)))
        
        # Test 5: Update Job
        test_results.append(("Update Job", test_update_job(created_job_id)))
    else:
        print_error("Skipping single job and update tests - no job created")
        test_results.append(("Get Single Job", False))
        test_results.append(("Update Job", False))
    
    # Test 6: Authorization Testing
    test_results.append(("Authorization Testing", test_authorization_failures()))
    
    # Test 7: 404 Error Testing
    test_results.append(("404 Error Testing", test_404_errors()))
    
    # Test 8: Delete Job (if we have a job ID)
    if created_job_id:
        test_results.append(("Delete Job", test_delete_job(created_job_id)))
    else:
        print_error("Skipping delete test - no job created")
        test_results.append(("Delete Job", False))
    
    # Print final results
    print_test_header("FINAL TEST RESULTS")
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, passed in test_results:
        if passed:
            print_success(f"{test_name}")
            passed_tests += 1
        else:
            print_error(f"{test_name}")
    
    print(f"\n📊 SUMMARY: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - Jobs API is fully functional!")
        return True
    else:
        print("⚠️  SOME TESTS FAILED - Jobs API has issues")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)