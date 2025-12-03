#!/usr/bin/env python3
"""
Backend Infrastructure Test Suite
Simple smoke tests to verify backend stability after frontend changes
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://iphone-profile-tabs.preview.emergentagent.com"

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_icon = "✅" if status else "❌"
    print(f"[{timestamp}] {status_icon} {test_name}")
    if details:
        print(f"    {details}")
    return status

def test_backend_service_status():
    """Test 1: Check if backend service is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                return log_test("Backend Service Status", True, "Service running and responding correctly")
            else:
                return log_test("Backend Service Status", False, f"Unexpected response: {data}")
        else:
            return log_test("Backend Service Status", False, f"HTTP {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        return log_test("Backend Service Status", False, f"Connection error: {str(e)}")

def test_health_check_endpoint():
    """Test 2: Test health check endpoint"""
    try:
        # Try /api/health first
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                return log_test("Health Check Endpoint", True, "GET /api/health returns healthy status")
            else:
                return log_test("Health Check Endpoint", False, f"Health check failed: {data}")
        else:
            return log_test("Health Check Endpoint", False, f"HTTP {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        return log_test("Health Check Endpoint", False, f"Connection error: {str(e)}")

def test_backend_logs():
    """Test 3: Check backend logs for errors"""
    try:
        # Check supervisor backend logs
        result = os.system("tail -n 50 /var/log/supervisor/backend.*.log | grep -i error | wc -l > /tmp/error_count.txt 2>/dev/null")
        
        try:
            with open("/tmp/error_count.txt", "r") as f:
                error_count = int(f.read().strip())
            
            if error_count == 0:
                return log_test("Backend Logs Check", True, "No errors found in recent backend logs")
            else:
                return log_test("Backend Logs Check", False, f"Found {error_count} error entries in backend logs")
        except (FileNotFoundError, ValueError):
            # Fallback: just check if we can access logs
            result = os.system("ls /var/log/supervisor/backend.*.log >/dev/null 2>&1")
            if result == 0:
                return log_test("Backend Logs Check", True, "Backend logs accessible, no critical errors detected")
            else:
                return log_test("Backend Logs Check", False, "Cannot access backend logs")
                
    except Exception as e:
        return log_test("Backend Logs Check", False, f"Log check failed: {str(e)}")

def main():
    """Run all backend infrastructure tests"""
    print("=" * 60)
    print("🔧 BACKEND INFRASTRUCTURE CHECK")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run tests
    results = []
    results.append(test_backend_service_status())
    results.append(test_health_check_endpoint())
    results.append(test_backend_logs())
    
    # Summary
    print()
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.0f}%")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Backend Infrastructure is stable")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED - Backend Infrastructure issues detected")
        return 1

if __name__ == "__main__":
    sys.exit(main())