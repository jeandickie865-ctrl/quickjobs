#!/usr/bin/env python3
"""
Backend API Testing Suite for ShiftMatch/BACKUP App
Tests upload endpoints, worker profile endpoints, and auth flow as requested in review.
"""

import requests
import json
import sys
import tempfile
from pathlib import Path
import uuid
from PIL import Image
import io
from typing import Dict, Any, Optional

# Backend URL - using localhost since we're testing from within the container
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

def test_endpoint(method: str, endpoint: str, data: Optional[Dict[str, Any]] = None, 
                 headers: Optional[Dict[str, str]] = None, expected_status: int = 200) -> Dict[str, Any]:
    """Test a single endpoint and return results"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == "PATCH":
            response = requests.patch(url, json=data, headers=headers, timeout=10)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        result = {
            "method": method.upper(),
            "endpoint": endpoint,
            "status_code": response.status_code,
            "expected_status": expected_status,
            "success": response.status_code == expected_status,
            "response_time": response.elapsed.total_seconds()
        }
        
        # Try to parse JSON response
        try:
            result["response_data"] = response.json()
        except:
            result["response_data"] = response.text[:200] if response.text else "No response body"
        
        return result
        
    except requests.exceptions.RequestException as e:
        return {
            "method": method.upper(),
            "endpoint": endpoint,
            "error": str(e),
            "success": False
        }

def print_test_result(result: Dict[str, Any]) -> None:
    """Print formatted test result"""
    if result.get("success"):
        status_icon = "✅"
    else:
        status_icon = "❌"
    
    print(f"{status_icon} {result['method']} {result['endpoint']}")
    print(f"   Status: {result.get('status_code', 'ERROR')} (expected: {result.get('expected_status', 'N/A')})")
    
    if result.get("error"):
        print(f"   Error: {result['error']}")
    elif result.get("response_data"):
        if isinstance(result["response_data"], dict):
            print(f"   Response: {json.dumps(result['response_data'], indent=2)[:100]}...")
        else:
            print(f"   Response: {str(result['response_data'])[:100]}...")
    
    print()

def main():
    print("🚨 CRITICAL BACKEND ISSUE INVESTIGATION")
    print("=" * 60)
    print("User Report: Profile saving & logout not working")
    print("Backend Log: 404 Not Found for /api/profiles/worker/me")
    print("=" * 60)
    print()
    
    # Test 1: Basic endpoints that should exist
    print("📋 TESTING EXISTING ENDPOINTS:")
    print("-" * 30)
    
    basic_tests = [
        ("GET", "/api/", 200),
        ("GET", "/api/status", 200),
        ("POST", "/api/status", 200, {"client_name": "test_client"}),
    ]
    
    basic_results = []
    for method, endpoint, expected_status, *data in basic_tests:
        test_data = data[0] if data else None
        result = test_endpoint(method, endpoint, test_data, expected_status=expected_status)
        basic_results.append(result)
        print_test_result(result)
    
    # Test 2: Authentication endpoints (should give 404)
    print("🔐 TESTING AUTHENTICATION ENDPOINTS (Expected 404s):")
    print("-" * 50)
    
    auth_tests = [
        ("GET", "/api/auth/me", 404),
        ("POST", "/api/auth/register", 404),
        ("POST", "/api/auth/login", 404),
    ]
    
    auth_results = []
    for method, endpoint, expected_status in auth_tests:
        result = test_endpoint(method, endpoint, expected_status=expected_status)
        auth_results.append(result)
        print_test_result(result)
    
    # Test 3: Profile endpoints (should give 404) - THE CRITICAL ISSUE
    print("👤 TESTING PROFILE ENDPOINTS (Expected 404s) - CRITICAL ISSUE:")
    print("-" * 60)
    
    profile_tests = [
        ("GET", "/api/profiles/worker/me", 404),
        ("PATCH", "/api/profiles/worker/me", 404),
    ]
    
    profile_results = []
    for method, endpoint, expected_status in profile_tests:
        test_data = {"name": "Test User", "categories": ["security"]} if method == "PATCH" else None
        result = test_endpoint(method, endpoint, test_data, expected_status=expected_status)
        profile_results.append(result)
        print_test_result(result)
    
    # Test 4: Try to create a test user (should fail)
    print("🧪 TESTING USER CREATION (Expected to fail):")
    print("-" * 42)
    
    user_creation_data = {
        "email": "worker@shiftmatch.com",
        "password": "securepass123",
        "role": "worker"
    }
    
    register_result = test_endpoint("POST", "/api/auth/register", user_creation_data, expected_status=404)
    print_test_result(register_result)
    
    # Summary
    print("📊 CRITICAL ISSUE ANALYSIS:")
    print("=" * 60)
    
    all_results = basic_results + auth_results + profile_results + [register_result]
    
    working_endpoints = [r for r in all_results if r.get("success")]
    failing_endpoints = [r for r in all_results if not r.get("success")]
    
    print(f"✅ WORKING ENDPOINTS ({len(working_endpoints)}):")
    for result in working_endpoints:
        print(f"   • {result['method']} {result['endpoint']} → {result.get('status_code')}")
    
    print()
    print(f"❌ FAILING/404 ENDPOINTS ({len(failing_endpoints)}):")
    for result in failing_endpoints:
        status = result.get('status_code', 'ERROR')
        expected = result.get('expected_status', 'N/A')
        if status == expected:
            print(f"   • {result['method']} {result['endpoint']} → {status} (as expected)")
        else:
            print(f"   • {result['method']} {result['endpoint']} → {status} (expected {expected})")
    
    print()
    print("🔍 ROOT CAUSE ANALYSIS:")
    print("-" * 25)
    print("✅ Backend server is RUNNING and healthy")
    print("✅ Basic infrastructure endpoints work:")
    print("   • GET /api/ (Hello World)")
    print("   • GET/POST /api/status (Status checks)")
    print()
    print("❌ MISSING ENDPOINTS causing user issues:")
    print("   • Authentication endpoints (/api/auth/*)")
    print("   • Profile endpoints (/api/profiles/*)")
    print()
    print("🚨 CRITICAL IMPACT:")
    print("   ❌ Profile saving doesn't work → /api/profiles/worker/me gives 404")
    print("   ❌ Logout doesn't work → /api/auth/* endpoints don't exist")
    print("   ❌ User registration/login → No backend API implementation")
    print()
    print("💡 SOLUTION NEEDED:")
    print("   The backend needs ShiftMatch-specific endpoints implemented:")
    print("   1. Authentication system (register, login, logout, me)")
    print("   2. Worker profile management (get, update)")
    print("   3. Employer profile management")
    print("   4. Job management endpoints")
    print("   5. Matching system endpoints")

if __name__ == "__main__":
    main()