#!/usr/bin/env python3
"""
Backend Infrastructure Test Suite for ShiftMatch App
Tests basic backend functionality after frontend address autocomplete fix
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://hire-connect-19.preview.emergentagent.com"
BACKEND_URL = f"{BASE_URL}/api"

def test_health_check():
    """Test GET /api/health endpoint"""
    print("🔍 Testing Health Check Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ Health Check: PASSED - GET /api/health returns healthy")
                return True
            else:
                print(f"❌ Health Check: FAILED - Unexpected response: {data}")
                return False
        else:
            print(f"❌ Health Check: FAILED - Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check: FAILED - Error: {str(e)}")
        return False

def test_status_post():
    """Test POST /api/status endpoint"""
    print("🔍 Testing Status POST Endpoint...")
    try:
        test_data = {
            "client_name": f"backend_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
        response = requests.post(
            f"{BACKEND_URL}/status", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "client_name" in data and "timestamp" in data:
                print(f"✅ Status POST: PASSED - Created status check with ID: {data['id']}")
                return True, data["id"]
            else:
                print(f"❌ Status POST: FAILED - Missing fields in response: {data}")
                return False, None
        else:
            print(f"❌ Status POST: FAILED - Status {response.status_code}: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Status POST: FAILED - Error: {str(e)}")
        return False, None

def test_status_get():
    """Test GET /api/status endpoint"""
    print("🔍 Testing Status GET Endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/status", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Status GET: PASSED - Retrieved {len(data)} status checks")
                return True
            else:
                print(f"❌ Status GET: FAILED - Expected list, got: {type(data)}")
                return False
        else:
            print(f"❌ Status GET: FAILED - Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Status GET: FAILED - Error: {str(e)}")
        return False

def check_backend_service():
    """Check if backend service is running"""
    print("🔍 Checking Backend Service Status...")
    try:
        # Simple connectivity test
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend Service: RUNNING - Service is accessible")
            return True
        else:
            print(f"❌ Backend Service: ISSUE - Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend Service: DOWN - Cannot connect to backend")
        return False
    except Exception as e:
        print(f"❌ Backend Service: ERROR - {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("🚀 BACKEND INFRASTRUCTURE TEST SUITE")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Backend Service Status
    if check_backend_service():
        tests_passed += 1
    
    # Test 2: Health Check
    if test_health_check():
        tests_passed += 1
    
    # Test 3: Status POST
    post_success, status_id = test_status_post()
    if post_success:
        tests_passed += 1
    
    # Test 4: Status GET
    if test_status_get():
        tests_passed += 1
    
    print("-" * 60)
    print(f"📊 TEST RESULTS: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 ALL TESTS PASSED - Backend is fully functional")
        return True
    else:
        print(f"⚠️  {total_tests - tests_passed} tests failed - Backend has issues")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)