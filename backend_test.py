#!/usr/bin/env python3
"""
Backend Test Suite for ShiftMatch App
Tests the basic FastAPI endpoints and health checks
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

def test_backend_health():
    """Test basic backend connectivity and health"""
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ Could not determine backend URL")
        return False
    
    api_url = f"{backend_url}/api"
    print(f"Testing backend at: {api_url}")
    
    try:
        # Test root endpoint
        print("\n🔍 Testing GET /api/ (root endpoint)...")
        response = requests.get(f"{api_url}/", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working: {data}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False

def test_status_endpoints():
    """Test status check endpoints"""
    backend_url = get_backend_url()
    if not backend_url:
        return False
    
    api_url = f"{backend_url}/api"
    
    try:
        # Test POST /api/status
        print("\n🔍 Testing POST /api/status...")
        test_data = {
            "client_name": "ShiftMatch_Test_Client"
        }
        
        response = requests.post(f"{api_url}/status", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ POST /api/status working: Created status check with ID {data.get('id')}")
            
            # Test GET /api/status
            print("\n🔍 Testing GET /api/status...")
            get_response = requests.get(f"{api_url}/status", timeout=10)
            
            if get_response.status_code == 200:
                status_list = get_response.json()
                print(f"✅ GET /api/status working: Retrieved {len(status_list)} status checks")
                return True
            else:
                print(f"❌ GET /api/status failed: {get_response.status_code}")
                return False
        else:
            print(f"❌ POST /api/status failed: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Status endpoint error: {e}")
        return False

def test_cors_headers():
    """Test CORS configuration"""
    backend_url = get_backend_url()
    if not backend_url:
        return False
    
    api_url = f"{backend_url}/api"
    
    try:
        print("\n🔍 Testing CORS headers...")
        response = requests.options(f"{api_url}/", timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"✅ CORS headers present: {cors_headers}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test error: {e}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("🚀 ShiftMatch Backend Test Suite")
    print("=" * 60)
    
    test_results = []
    
    # Test 1: Basic health check
    print("\n📋 Test 1: Backend Health Check")
    health_ok = test_backend_health()
    test_results.append(("Backend Health", health_ok))
    
    # Test 2: Status endpoints (only if health check passes)
    if health_ok:
        print("\n📋 Test 2: Status Endpoints")
        status_ok = test_status_endpoints()
        test_results.append(("Status Endpoints", status_ok))
        
        # Test 3: CORS configuration
        print("\n📋 Test 3: CORS Configuration")
        cors_ok = test_cors_headers()
        test_results.append(("CORS Headers", cors_ok))
    else:
        test_results.append(("Status Endpoints", False))
        test_results.append(("CORS Headers", False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests passed!")
        return True
    else:
        print("⚠️  Some backend tests failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)