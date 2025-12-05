#!/usr/bin/env python3
"""
Backend Testing für erweiterte Worker Registration Data Fields

Testet den erweiterten Backend-Endpoint PUT /api/profiles/worker/me/registration-data
mit den neu hinzugefügten Feldern:
- geburtsort (string)
- staatsangehoerigkeit (string)  
- confirm_70_days (boolean) -> kurzfristigkeit_bestaetigt
- confirm_not_professional (boolean) -> kurzfristigkeit_nicht_berufsmaeßig
"""

import asyncio
import httpx
import json
import os
from datetime import datetime

# Backend URL from environment
BACKEND_URL = os.environ.get('EXPO_PUBLIC_API_URL', 'https://backup.dickie.app/api')

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.worker_token = None
        self.worker_id = None
        self.test_timestamp = int(datetime.now().timestamp())
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details,
            "success": success
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    async def test_health_check(self):
        """Test basic backend health"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/health")
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Backend Health Check", True, f"Status: {data.get('status')}")
                    return True
                else:
                    self.log_test("Backend Health Check", False, f"Status: {response.status_code}")
                    return False
                    
        except Exception as e:
            self.log_test("Backend Health Check", False, f"Error: {str(e)}")
            return False
    
    async def create_test_worker(self):
        """Create a test worker account"""
        try:
            # Generate unique email
            test_email = f"testworker_reg_{self.test_timestamp}@test.de"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Register worker
                signup_data = {
                    "email": test_email,
                    "password": "TestPass123!",
                    "role": "worker",
                    "accountType": "private"
                }
                
                response = await client.post(f"{self.base_url}/auth/signup", json=signup_data)
                
                if response.status_code == 200:
                    data = response.json()
                    self.worker_token = data["token"]
                    self.worker_id = data["userId"]
                    self.log_test("Worker Account Creation", True, f"Email: {test_email}, ID: {self.worker_id}")
                    return True
                else:
                    self.log_test("Worker Account Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Worker Account Creation", False, f"Error: {str(e)}")
            return False
    
    async def create_worker_profile(self):
        """Create worker profile"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                profile_data = {
                    "firstName": "Max",
                    "lastName": "Mustermann",
                    "phone": "+49 123 456789",
                    "email": f"testworker_reg_{self.test_timestamp}@test.de",
                    "categories": ["sicherheit"],
                    "subcategories": ["objektschutz"],
                    "qualifications": ["sicherheitsschein"],
                    "radiusKm": 25,
                    "homeAddress": {
                        "street": "Teststraße",
                        "houseNumber": "123",
                        "postalCode": "10115",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "homeLat": 52.5200,
                    "homeLon": 13.4050,
                    "shortBio": "Erfahrener Sicherheitsmitarbeiter"
                }
                
                headers = {"Authorization": f"Bearer {self.worker_token}"}
                response = await client.post(f"{self.base_url}/profiles/worker", json=profile_data, headers=headers)
                
                if response.status_code == 200:
                    self.log_test("Worker Profile Creation", True, "Profile created successfully")
                    return True
                else:
                    self.log_test("Worker Profile Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Worker Profile Creation", False, f"Error: {str(e)}")
            return False
    
    async def test_registration_data_full_fields(self):
        """Test PUT /api/profiles/worker/me/registration-data with ALL fields including new ones"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test data with ALL fields including new ones
                registration_data = {
                    # Existing fields
                    "steuerId": "12345678901",
                    "geburtsdatum": "15.03.1995",
                    "sozialversicherungsnummer": "12 150395 S 123",
                    "krankenkasse": "TK Techniker Krankenkasse",
                    # NEW FIELDS
                    "geburtsort": "Berlin",
                    "staatsangehoerigkeit": "Deutsch",
                    "kurzfristigkeit_bestaetigt": True,  # This maps to confirm_70_days
                    "kurzfristigkeit_nicht_berufsmaeßig": True  # This maps to confirm_not_professional
                }
                
                headers = {"Authorization": f"Bearer {self.worker_token}"}
                response = await client.put(
                    f"{self.base_url}/profiles/worker/me/registration-data", 
                    json=registration_data, 
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify all fields are in response
                    checks = []
                    checks.append(("steuerId", data.get("steuerId") == "12345678901"))
                    checks.append(("geburtsdatum", data.get("geburtsdatum") == "15.03.1995"))
                    checks.append(("sozialversicherungsnummer", data.get("sozialversicherungsnummer") == "12 150395 S 123"))
                    checks.append(("krankenkasse", data.get("krankenkasse") == "TK Techniker Krankenkasse"))
                    checks.append(("geburtsort", data.get("geburtsort") == "Berlin"))
                    checks.append(("staatsangehoerigkeit", data.get("staatsangehoerigkeit") == "Deutsch"))
                    checks.append(("kurzfristigkeit_bestaetigt", data.get("kurzfristigkeit_bestaetigt") == True))
                    checks.append(("kurzfristigkeit_nicht_berufsmaeßig", data.get("kurzfristigkeit_nicht_berufsmaeßig") == True))
                    
                    failed_checks = [field for field, passed in checks if not passed]
                    
                    if not failed_checks:
                        self.log_test("Registration Data - Full Fields", True, "All fields correctly saved and returned")
                        return True
                    else:
                        self.log_test("Registration Data - Full Fields", False, f"Failed fields: {failed_checks}")
                        return False
                else:
                    self.log_test("Registration Data - Full Fields", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Registration Data - Full Fields", False, f"Error: {str(e)}")
            return False
    
    async def test_registration_data_persistence(self):
        """Test data persistence by retrieving worker profile after update"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {self.worker_token}"}
                response = await client.get(f"{self.base_url}/profiles/worker/{self.worker_id}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify all new fields are persisted in MongoDB
                    checks = []
                    checks.append(("geburtsort", data.get("geburtsort") == "Berlin"))
                    checks.append(("staatsangehoerigkeit", data.get("staatsangehoerigkeit") == "Deutsch"))
                    checks.append(("kurzfristigkeit_bestaetigt", data.get("kurzfristigkeit_bestaetigt") == True))
                    checks.append(("kurzfristigkeit_nicht_berufsmaeßig", data.get("kurzfristigkeit_nicht_berufsmaeßig") == True))
                    
                    failed_checks = [field for field, passed in checks if not passed]
                    
                    if not failed_checks:
                        self.log_test("Data Persistence Check", True, "All new fields correctly persisted in MongoDB")
                        return True
                    else:
                        self.log_test("Data Persistence Check", False, f"Not persisted: {failed_checks}")
                        return False
                else:
                    self.log_test("Data Persistence Check", False, f"Status: {response.status_code}")
                    return False
                    
        except Exception as e:
            self.log_test("Data Persistence Check", False, f"Error: {str(e)}")
            return False
    
    async def test_partial_fields_update(self):
        """Test that endpoint works when only SOME new fields are sent"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test with only some new fields
                partial_data = {
                    "geburtsort": "München",  # Update only this new field
                    "steuerId": "98765432109"  # Update existing field
                }
                
                headers = {"Authorization": f"Bearer {self.worker_token}"}
                response = await client.put(
                    f"{self.base_url}/profiles/worker/me/registration-data", 
                    json=partial_data, 
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify partial update worked
                    checks = []
                    checks.append(("geburtsort_updated", data.get("geburtsort") == "München"))
                    checks.append(("steuerId_updated", data.get("steuerId") == "98765432109"))
                    # Old data should be preserved
                    checks.append(("staatsangehoerigkeit_preserved", data.get("staatsangehoerigkeit") == "Deutsch"))
                    checks.append(("kurzfristigkeit_bestaetigt_preserved", data.get("kurzfristigkeit_bestaetigt") == True))
                    
                    failed_checks = [field for field, passed in checks if not passed]
                    
                    if not failed_checks:
                        self.log_test("Partial Fields Update", True, "Partial update successful, old data preserved")
                        return True
                    else:
                        self.log_test("Partial Fields Update", False, f"Failed checks: {failed_checks}")
                        return False
                else:
                    self.log_test("Partial Fields Update", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Partial Fields Update", False, f"Error: {str(e)}")
            return False
    
    async def test_validation_and_response(self):
        """Test endpoint validation and response format"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test with valid data
                valid_data = {
                    "geburtsort": "Hamburg",
                    "staatsangehoerigkeit": "Österreichisch",
                    "kurzfristigkeit_bestaetigt": False,
                    "kurzfristigkeit_nicht_berufsmaeßig": False
                }
                
                headers = {"Authorization": f"Bearer {self.worker_token}"}
                response = await client.put(
                    f"{self.base_url}/profiles/worker/me/registration-data", 
                    json=valid_data, 
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify response structure
                    required_fields = ["userId", "firstName", "lastName", "email"]
                    has_required = all(field in data for field in required_fields)
                    
                    if has_required:
                        self.log_test("Validation and Response Format", True, "200 OK with correct response structure")
                        return True
                    else:
                        missing = [f for f in required_fields if f not in data]
                        self.log_test("Validation and Response Format", False, f"Missing fields in response: {missing}")
                        return False
                else:
                    self.log_test("Validation and Response Format", False, f"Status: {response.status_code}")
                    return False
                    
        except Exception as e:
            self.log_test("Validation and Response Format", False, f"Error: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🎯 BACKEND TESTING: Extended Worker Registration Data Fields")
        print("=" * 70)
        
        # Test sequence
        tests = [
            ("Backend Health Check", self.test_health_check),
            ("Create Test Worker Account", self.create_test_worker),
            ("Create Worker Profile", self.create_worker_profile),
            ("Test Full Registration Data Fields", self.test_registration_data_full_fields),
            ("Test Data Persistence", self.test_registration_data_persistence),
            ("Test Partial Fields Update", self.test_partial_fields_update),
            ("Test Validation and Response", self.test_validation_and_response)
        ]
        
        success_count = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            success = await test_func()
            if success:
                success_count += 1
            else:
                print(f"❌ Test failed: {test_name}")
                # Continue with other tests even if one fails
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   → {result['details']}")
        
        print(f"\n🎯 OVERALL RESULT: {success_count}/{total_tests} tests passed")
        
        if success_count == total_tests:
            print("🎉 ALL TESTS PASSED - Extended Worker Registration Data Fields are fully functional!")
            return True
        else:
            print(f"⚠️  {total_tests - success_count} tests failed - Issues found with extended registration data fields")
            return False

async def main():
    """Main test runner"""
    tester = BackendTester()
    success = await tester.run_all_tests()
    return success

if __name__ == "__main__":
    asyncio.run(main())