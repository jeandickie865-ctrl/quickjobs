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

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_email = f"testworker_{uuid.uuid4().hex[:8]}@test.de"
        self.test_user_password = "TestPassword123!"
        self.user_id = None
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
        
    def create_test_image(self, format="JPEG", size=(100, 100)):
        """Create a test image file"""
        img = Image.new('RGB', size, color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format=format)
        img_bytes.seek(0)
        return img_bytes
        
    def test_health_check(self):
        """Test basic health check"""
        self.log("Testing health check endpoint...")
        try:
            response = self.session.get(f"{API_BASE}/health")
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Health check passed: {data}")
                return True
            else:
                self.log(f"❌ Health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Health check error: {e}", "ERROR")
            return False
            
    def test_auth_register(self):
        """Test user registration"""
        self.log(f"Testing user registration with email: {self.test_user_email}")
        try:
            payload = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "role": "worker"
            }
            response = self.session.post(f"{API_BASE}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log(f"✅ Registration successful. User ID: {self.user_id}")
                return True
            else:
                self.log(f"❌ Registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Registration error: {e}", "ERROR")
            return False
            
    def test_auth_login(self):
        """Test user login"""
        self.log("Testing user login...")
        try:
            # FastAPI OAuth2PasswordRequestForm expects form data with 'username' field
            payload = {
                "username": self.test_user_email,  # Note: username field, not email
                "password": self.test_user_password
            }
            response = self.session.post(f"{API_BASE}/auth/login", data=payload)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log(f"✅ Login successful. Token received.")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Login error: {e}", "ERROR")
            return False
            
    def test_auth_me(self):
        """Test get current user"""
        self.log("Testing get current user...")
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Get current user successful: {data.get('email')}")
                return True
            else:
                self.log(f"❌ Get current user failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Get current user error: {e}", "ERROR")
            return False
            
    def test_worker_profile_create(self):
        """Test worker profile creation"""
        self.log("Testing worker profile creation...")
        try:
            payload = {
                "name": "Test Worker",
                "street": "Teststraße 123",
                "postal_code": "12345",
                "city": "Berlin",
                "lat": 52.5200,
                "lon": 13.4050,
                "categories": ["sicherheit", "reinigung"],
                "qualifications": ["erste_hilfe", "sicherheitsschein"],
                "activities": ["objektschutz", "buero_reinigung"],
                "radius_km": 25
            }
            response = self.session.post(f"{API_BASE}/profiles/worker", json=payload)
            
            if response.status_code == 201:
                data = response.json()
                self.log(f"✅ Worker profile created successfully: {data.get('id')}")
                return True
            else:
                self.log(f"❌ Worker profile creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Worker profile creation error: {e}", "ERROR")
            return False
            
    def test_worker_profile_get(self):
        """Test get worker profile"""
        self.log("Testing get worker profile...")
        try:
            response = self.session.get(f"{API_BASE}/profiles/worker/me")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"✅ Get worker profile successful: {data.get('name')}")
                return True
            else:
                self.log(f"❌ Get worker profile failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Get worker profile error: {e}", "ERROR")
            return False
            
    def test_upload_profile_photo_valid(self):
        """Test valid profile photo upload"""
        self.log("Testing valid profile photo upload (JPEG)...")
        try:
            # Create test image
            img_data = self.create_test_image("JPEG")
            
            files = {
                'file': ('test_photo.jpg', img_data, 'image/jpeg')
            }
            
            response = self.session.post(f"{API_BASE}/upload/profile-photo", files=files)
            
            if response.status_code == 200:
                data = response.json()
                photo_url = data.get("photo_url")
                if photo_url and photo_url.startswith("/uploads/profile-photos/"):
                    self.log(f"✅ Photo upload successful: {photo_url}")
                    return True, photo_url
                else:
                    self.log(f"❌ Invalid photo URL format: {photo_url}", "ERROR")
                    return False, None
            else:
                self.log(f"❌ Photo upload failed: {response.status_code} - {response.text}", "ERROR")
                return False, None
        except Exception as e:
            self.log(f"❌ Photo upload error: {e}", "ERROR")
            return False, None
            
    def test_upload_profile_photo_invalid_type(self):
        """Test invalid file type upload"""
        self.log("Testing invalid file type upload (TXT)...")
        try:
            files = {
                'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')
            }
            
            response = self.session.post(f"{API_BASE}/upload/profile-photo", files=files)
            
            if response.status_code == 400:
                data = response.json()
                if "Invalid file type" in data.get("detail", {}).get("error", ""):
                    self.log("✅ Invalid file type correctly rejected")
                    return True
                else:
                    self.log(f"❌ Unexpected error message: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Invalid file type not rejected: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Invalid file type test error: {e}", "ERROR")
            return False
            
    def test_upload_profile_photo_too_large(self):
        """Test file too large upload"""
        self.log("Testing file too large upload (>5MB)...")
        try:
            # Create a large file (6MB of data) to ensure it's over the 5MB limit
            large_data = b'x' * (6 * 1024 * 1024)  # 6MB of data
            large_file_data = io.BytesIO(large_data)
            
            content_size = len(large_data)
            self.log(f"Created test file of size: {content_size / (1024*1024):.2f} MB")
            
            files = {
                'file': ('large_photo.jpg', large_file_data, 'image/jpeg')
            }
            
            response = self.session.post(f"{API_BASE}/upload/profile-photo", files=files)
            
            if response.status_code == 400:
                data = response.json()
                if "File too large" in data.get("detail", {}).get("error", ""):
                    self.log("✅ Large file correctly rejected")
                    return True
                else:
                    self.log(f"❌ Unexpected error message: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Large file not rejected: {response.status_code} - Size: {content_size / (1024*1024):.2f} MB", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Large file test error: {e}", "ERROR")
            return False
            
    def test_worker_profile_update_with_photo(self, photo_url):
        """Test worker profile update with photo URL"""
        self.log("Testing worker profile update with photo URL...")
        try:
            payload = {
                "name": "Updated Test Worker",
                "street": "Updated Teststraße 456",
                "postal_code": "54321",
                "city": "München",
                "lat": 48.1351,
                "lon": 11.5820,
                "categories": ["sicherheit", "logistik"],
                "qualifications": ["erste_hilfe", "staplerfahrer"],
                "activities": ["objektschutz", "lager_arbeit"],
                "radius_km": 30,
                "photo_url": photo_url
            }
            response = self.session.patch(f"{API_BASE}/profiles/worker/me", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("photo_url") == photo_url and data.get("name") == "Updated Test Worker":
                    self.log(f"✅ Worker profile updated with photo URL: {data.get('photo_url')}")
                    return True
                else:
                    self.log(f"❌ Profile update data mismatch: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Worker profile update failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Worker profile update error: {e}", "ERROR")
            return False
            
    def test_complete_flow(self):
        """Test complete flow: Register → Login → Profile Create → Photo Upload → Profile Update"""
        self.log("=" * 60)
        self.log("STARTING COMPLETE BACKEND FLOW TEST")
        self.log("=" * 60)
        
        results = {}
        
        # 1. Health Check
        results['health_check'] = self.test_health_check()
        
        # 2. Register
        results['register'] = self.test_auth_register()
        if not results['register']:
            self.log("❌ Registration failed, cannot continue with flow", "ERROR")
            return results
            
        # 3. Login (test with new credentials)
        results['login'] = self.test_auth_login()
        if not results['login']:
            self.log("❌ Login failed, cannot continue with flow", "ERROR")
            return results
            
        # 4. Get current user
        results['auth_me'] = self.test_auth_me()
        
        # 5. Create worker profile
        results['profile_create'] = self.test_worker_profile_create()
        if not results['profile_create']:
            self.log("❌ Profile creation failed, cannot continue with flow", "ERROR")
            return results
            
        # 6. Get worker profile
        results['profile_get'] = self.test_worker_profile_get()
        
        # 7. Upload valid photo
        upload_success, photo_url = self.test_upload_profile_photo_valid()
        results['upload_valid'] = upload_success
        
        # 8. Test invalid uploads
        results['upload_invalid_type'] = self.test_upload_profile_photo_invalid_type()
        results['upload_too_large'] = self.test_upload_profile_photo_too_large()
        
        # 9. Update profile with photo URL
        if photo_url:
            results['profile_update_with_photo'] = self.test_worker_profile_update_with_photo(photo_url)
        else:
            results['profile_update_with_photo'] = False
            
        return results
        
    def print_summary(self, results):
        """Print test summary"""
        self.log("=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
                
        self.log("=" * 60)
        self.log(f"TOTAL: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Backend is working correctly.", "SUCCESS")
        else:
            self.log(f"⚠️  {total - passed} tests failed. Backend needs attention.", "WARNING")
            
        return passed == total

def main():
    """Run all backend tests"""
    tester = BackendTester()
    results = tester.test_complete_flow()
    all_passed = tester.print_summary(results)
    
    # Exit with appropriate code
    exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()