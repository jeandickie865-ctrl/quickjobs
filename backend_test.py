#!/usr/bin/env python3
"""
Backend Testing Suite for ShiftMatch Jobs API
Tests the Jobs API endpoints implemented in Phase 2
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Get backend URL from frontend/.env
BACKEND_URL = "https://jobfinder-de.preview.emergentagent.com/api"

# Test users for authorization testing
EMPLOYER_TOKEN = "user_testemployer_test_de"
WORKER_TOKEN = "user_testworker_test_de"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_backend_health():
    """Test basic backend connectivity"""
    print_test_header("Backend Health Check")
    
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        if response.status_code == 200:
            print_success(f"Backend is running: {response.json()}")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend connection failed: {str(e)}")
        return False

def test_create_worker_profile():
    """Test POST /api/profiles/worker - Create worker profile"""
    print_test_header("Create Worker Profile")
    
    try:
        # Create new profile
        response = requests.post(
            f"{BACKEND_URL}/profiles/worker",
            headers={**AUTH_HEADER, "Content-Type": "application/json"},
            json=WORKER_PROFILE_DATA,
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        print_info(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code in [200, 201]:
            profile = response.json()
            print_success("Worker profile created successfully")
            print_info(f"Profile ID: {profile.get('userId')}")
            print_info(f"Categories: {profile.get('categories')}")
            print_info(f"Selected Tags: {profile.get('selectedTags')}")
            print_info(f"Home Address: {profile.get('homeAddress')}")
            print_info(f"Created At: {profile.get('createdAt')}")
            return True, profile
        elif response.status_code == 400:
            # Profile might already exist, try to get it
            print_info("Profile might already exist (400), checking existing profile...")
            return test_get_worker_profile()
        else:
            print_error(f"Profile creation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print_error(f"Profile creation error: {str(e)}")
        return False, None

def test_get_worker_profile():
    """Test GET /api/profiles/worker/{user_id} - Get worker profile"""
    print_test_header("Get Worker Profile")
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/profiles/worker/{TEST_USER_ID}",
            headers=AUTH_HEADER,
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            profile = response.json()
            print_success("Worker profile retrieved successfully")
            print_info(f"Profile ID: {profile.get('userId')}")
            print_info(f"Categories: {profile.get('categories')}")
            print_info(f"Selected Tags: {profile.get('selectedTags')}")
            print_info(f"Radius: {profile.get('radiusKm')} km")
            print_info(f"First Name: {profile.get('firstName')}")
            return True, profile
        elif response.status_code == 404:
            print_error("Profile not found (404)")
            print_info("This is expected if profile hasn't been created yet")
            return False, None
        else:
            print_error(f"Profile retrieval failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print_error(f"Profile retrieval error: {str(e)}")
        return False, None

def test_update_worker_profile():
    """Test PUT /api/profiles/worker/{user_id} - Update worker profile"""
    print_test_header("Update Worker Profile")
    
    try:
        response = requests.put(
            f"{BACKEND_URL}/profiles/worker/{TEST_USER_ID}",
            headers={**AUTH_HEADER, "Content-Type": "application/json"},
            json=PROFILE_UPDATE_DATA,
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            profile = response.json()
            print_success("Worker profile updated successfully")
            print_info(f"Updated Categories: {profile.get('categories')}")
            print_info(f"Updated Tags: {profile.get('selectedTags')}")
            print_info(f"Updated Radius: {profile.get('radiusKm')} km")
            print_info(f"Updated Name: {profile.get('firstName')}")
            print_info(f"Updated At: {profile.get('updatedAt')}")
            return True, profile
        elif response.status_code == 404:
            print_error("Profile not found for update (404)")
            return False, None
        else:
            print_error(f"Profile update failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print_error(f"Profile update error: {str(e)}")
        return False, None

def test_authorization():
    """Test authorization - user can only access their own profile"""
    print_test_header("Authorization Testing")
    
    try:
        # Test with different user ID in URL vs token
        different_user_id = "different_user_123"
        
        response = requests.get(
            f"{BACKEND_URL}/profiles/worker/{different_user_id}",
            headers=AUTH_HEADER,  # Token for TEST_USER_ID
            timeout=10
        )
        
        print_info(f"Response Status: {response.status_code}")
        
        if response.status_code == 404:
            print_success("Authorization working: Different user profile not accessible")
            return True
        elif response.status_code == 403:
            print_success("Authorization working: Access forbidden for different user")
            return True
        else:
            print_error(f"Authorization test unexpected result: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Authorization test error: {str(e)}")
        return False

def test_invalid_auth():
    """Test invalid authorization header"""
    print_test_header("Invalid Authorization Testing")
    
    try:
        # Test without authorization header
        response = requests.get(
            f"{BACKEND_URL}/profiles/worker/{TEST_USER_ID}",
            timeout=10
        )
        
        print_info(f"No auth header - Status: {response.status_code}")
        
        if response.status_code == 401:
            print_success("Unauthorized access correctly blocked (401)")
        else:
            print_error(f"Expected 401, got {response.status_code}")
            
        # Test with invalid authorization format
        response = requests.get(
            f"{BACKEND_URL}/profiles/worker/{TEST_USER_ID}",
            headers={"Authorization": "InvalidFormat"},
            timeout=10
        )
        
        print_info(f"Invalid auth format - Status: {response.status_code}")
        
        if response.status_code == 401:
            print_success("Invalid auth format correctly blocked (401)")
            return True
        else:
            print_error(f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Invalid auth test error: {str(e)}")
        return False

def test_mongodb_storage():
    """Test that profiles are actually stored in MongoDB"""
    print_test_header("MongoDB Storage Verification")
    
    try:
        # Create a profile and then retrieve it to verify persistence
        create_success, created_profile = test_create_worker_profile()
        
        if not create_success:
            print_error("Cannot test MongoDB storage - profile creation failed")
            return False
            
        # Wait a moment and retrieve again to ensure it's persisted
        import time
        time.sleep(1)
        
        get_success, retrieved_profile = test_get_worker_profile()
        
        if not get_success:
            print_error("MongoDB storage test failed - cannot retrieve created profile")
            return False
            
        # Verify data integrity
        if (retrieved_profile.get('categories') == WORKER_PROFILE_DATA['categories'] and
            retrieved_profile.get('selectedTags') == WORKER_PROFILE_DATA['selectedTags'] and
            retrieved_profile.get('radiusKm') == WORKER_PROFILE_DATA['radiusKm']):
            print_success("MongoDB storage verified - data persisted correctly")
            return True
        else:
            print_error("MongoDB storage test failed - data integrity issues")
            return False
            
    except Exception as e:
        print_error(f"MongoDB storage test error: {str(e)}")
        return False

def run_comprehensive_test():
    """Run complete test suite for Worker Profile API"""
    print("🚀 Starting Comprehensive Worker Profile API Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    
    results = {
        "backend_health": False,
        "create_profile": False,
        "get_profile": False,
        "update_profile": False,
        "authorization": False,
        "invalid_auth": False,
        "mongodb_storage": False
    }
    
    # Test 1: Backend Health
    results["backend_health"] = test_backend_health()
    
    if not results["backend_health"]:
        print_error("Backend is not accessible. Stopping tests.")
        return results
    
    # Test 2: Create Profile
    results["create_profile"], created_profile = test_create_worker_profile()
    
    # Test 3: Get Profile
    results["get_profile"], retrieved_profile = test_get_worker_profile()
    
    # Test 4: Update Profile (only if profile exists)
    if results["get_profile"]:
        results["update_profile"], updated_profile = test_update_worker_profile()
    
    # Test 5: Authorization
    results["authorization"] = test_authorization()
    
    # Test 6: Invalid Auth
    results["invalid_auth"] = test_invalid_auth()
    
    # Test 7: MongoDB Storage
    results["mongodb_storage"] = test_mongodb_storage()
    
    # Summary
    print_test_header("TEST SUMMARY")
    passed = sum(results.values())
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("🎉 ALL TESTS PASSED - Worker Profile API is fully functional!")
    else:
        print_error(f"⚠️  {total - passed} tests failed - Issues need to be addressed")
    
    return results

if __name__ == "__main__":
    results = run_comprehensive_test()
    
    # Exit with appropriate code
    if all(results.values()):
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure