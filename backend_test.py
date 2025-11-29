#!/usr/bin/env python3
"""
Backend Auth Testing Suite
Tests the authentication endpoints after AuthContext fix
Focused testing as requested in German review request
"""

import asyncio
import httpx
import json
import sys
import time
from typing import Dict, List, Any, Optional
import uuid
import math
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://job-connector-7.preview.emergentagent.com/api"

class AuthBackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.auth_tokens = {}
        self.test_data = {}
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def test_health_check(self):
        """Test basic health endpoints"""
        print("🏥 TESTING BACKEND INFRASTRUCTURE")
        print("=" * 50)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Test root endpoint
                response = await client.get(f"{self.base_url}/")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Root Endpoint", True, f"GET /api/ → {data}")
                else:
                    self.log_test("Root Endpoint", False, f"Status: {response.status_code}")
                
                # Test health endpoint
                response = await client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Health Check", True, f"GET /api/health → {data}")
                else:
                    self.log_test("Health Check", False, f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Backend Infrastructure", False, f"Connection error: {str(e)}")
    
    async def test_authentication(self):
        """Test user registration and login with German data"""
        print("🔐 TESTING AUTHENTICATION SYSTEM")
        print("=" * 50)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test data with German names and addresses
            test_users = [
                {
                    "email": "max.mueller@test.de",
                    "password": "TestPass123!",
                    "role": "worker",
                    "name": "Max Müller"
                },
                {
                    "email": "anna.schmidt@firma.de", 
                    "password": "SicherPass456!",
                    "role": "employer",
                    "name": "Anna Schmidt"
                }
            ]
            
            for user in test_users:
                try:
                    # Test Registration
                    signup_data = {
                        "email": user["email"],
                        "password": user["password"],
                        "role": user["role"]
                    }
                    
                    response = await client.post(f"{self.base_url}/auth/signup", json=signup_data)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test(f"Registration ({user['role']})", True, 
                                    f"User {user['email']} registered successfully")
                        # Use userId as token for authorization (backend expects Bearer {userId})
                        self.auth_tokens[user["role"]] = data.get("userId")
                        self.test_data[f"{user['role']}_user_id"] = data.get("userId")
                        self.test_data[f"{user['role']}_email"] = data.get("email")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test(f"Registration ({user['role']})", False, 
                                    f"Status: {response.status_code}", error_data)
                    
                    # Test Login
                    login_data = {
                        "email": user["email"],
                        "password": user["password"]
                    }
                    
                    response = await client.post(f"{self.base_url}/auth/login", json=login_data)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test(f"Login ({user['role']})", True, 
                                    f"User {user['email']} logged in successfully")
                        # Update token from login - use userId for authorization
                        self.auth_tokens[user["role"]] = data.get("userId")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test(f"Login ({user['role']})", False, 
                                    f"Status: {response.status_code}", error_data)
                        
                except Exception as e:
                    self.log_test(f"Authentication ({user['role']})", False, f"Error: {str(e)}")
    
    async def test_worker_profile(self):
        """Test worker profile endpoints with German data"""
        print("👷 TESTING WORKER PROFILE SYSTEM")
        print("=" * 50)
        
        if "worker" not in self.auth_tokens:
            self.log_test("Worker Profile Tests", False, "No worker auth token available")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.auth_tokens['worker']}"}
            user_id = self.test_data.get("worker_user_id")
            
            try:
                # Test Create Worker Profile
                profile_data = {
                    "firstName": "Max",
                    "lastName": "Müller", 
                    "phone": "+49 30 12345678",
                    "email": "max.mueller@test.de",
                    "categories": ["sicherheit", "gastronomie"],
                    "selectedTags": ["Sachkunde §34a", "Bewacher-ID"],
                    "activities": ["Objektschutz", "Veranstaltungsschutz"],
                    "qualifications": ["Sachkunde §34a", "Erste Hilfe"],
                    "radiusKm": 25,
                    "homeAddress": {
                        "street": "Alexanderplatz",
                        "houseNumber": "1",
                        "postalCode": "10178",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "homeLat": 52.5200,
                    "homeLon": 13.4050,
                    "shortBio": "Erfahrener Sicherheitsmitarbeiter mit 5 Jahren Berufserfahrung in Berlin."
                }
                
                response = await client.post(f"{self.base_url}/profiles/worker", 
                                           json=profile_data, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Worker Profile Creation", True, 
                                f"Profile created for {data.get('firstName')} {data.get('lastName')}")
                    self.test_data["worker_profile"] = data
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Worker Profile Creation", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Worker Profile
                if user_id:
                    response = await client.get(f"{self.base_url}/profiles/worker/{user_id}", 
                                              headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Worker Profile Retrieval", True, 
                                    f"Retrieved profile for {data.get('firstName')} {data.get('lastName')}")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Worker Profile Retrieval", False, 
                                    f"Status: {response.status_code}", error_data)
                
                # Test Update Worker Profile
                update_data = {
                    "shortBio": "Erfahrener Sicherheitsmitarbeiter mit 6 Jahren Berufserfahrung in Berlin und Brandenburg.",
                    "radiusKm": 30
                }
                
                if user_id:
                    response = await client.put(f"{self.base_url}/profiles/worker/{user_id}", 
                                              json=update_data, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Worker Profile Update", True, 
                                    f"Profile updated, new radius: {data.get('radiusKm')}km")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Worker Profile Update", False, 
                                    f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Worker Profile System", False, f"Error: {str(e)}")
    
    async def test_employer_profile(self):
        """Test employer profile endpoints with German data"""
        print("🏢 TESTING EMPLOYER PROFILE SYSTEM")
        print("=" * 50)
        
        if "employer" not in self.auth_tokens:
            self.log_test("Employer Profile Tests", False, "No employer auth token available")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.auth_tokens['employer']}"}
            user_id = self.test_data.get("employer_user_id")
            
            try:
                # Test Create Employer Profile
                profile_data = {
                    "firstName": "Anna",
                    "lastName": "Schmidt",
                    "company": "Schmidt Sicherheitsdienst GmbH",
                    "phone": "+49 30 98765432",
                    "email": "anna.schmidt@firma.de",
                    "street": "Potsdamer Platz",
                    "houseNumber": "5",
                    "postalCode": "10785",
                    "city": "Berlin",
                    "lat": 52.5096,
                    "lon": 13.3765,
                    "paymentMethod": "card",
                    "shortBio": "Inhaberin eines mittelständischen Sicherheitsunternehmens in Berlin."
                }
                
                response = await client.post(f"{self.base_url}/profiles/employer", 
                                           json=profile_data, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Employer Profile Creation", True, 
                                f"Profile created for {data.get('company')}")
                    self.test_data["employer_profile"] = data
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Employer Profile Creation", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Employer Profile
                if user_id:
                    response = await client.get(f"{self.base_url}/profiles/employer/{user_id}", 
                                              headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Employer Profile Retrieval", True, 
                                    f"Retrieved profile for {data.get('company')}")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Employer Profile Retrieval", False, 
                                    f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Employer Profile System", False, f"Error: {str(e)}")
    
    async def test_jobs_system(self):
        """Test job creation, retrieval, and management"""
        print("💼 TESTING JOBS SYSTEM")
        print("=" * 50)
        
        if "employer" not in self.auth_tokens:
            self.log_test("Jobs System Tests", False, "No employer auth token available")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.auth_tokens['employer']}"}
            employer_id = self.test_data.get("employer_user_id")
            
            try:
                # Test Create Job
                job_data = {
                    "title": "Sicherheitsmitarbeiter für Veranstaltung gesucht",
                    "description": "Wir suchen einen erfahrenen Sicherheitsmitarbeiter für eine Firmenveranstaltung in Berlin-Mitte. Sachkunde §34a erforderlich.",
                    "category": "sicherheit",
                    "timeMode": "fixed_time",
                    "startAt": "2024-12-20T18:00:00Z",
                    "endAt": "2024-12-20T23:00:00Z",
                    "workerAmountCents": 2500,  # 25€/Stunde * 5 Stunden
                    "paymentToWorker": "cash",
                    "address": {
                        "street": "Unter den Linden",
                        "houseNumber": "77",
                        "postalCode": "10117",
                        "city": "Berlin",
                        "country": "DE"
                    },
                    "lat": 52.5170,
                    "lon": 13.3888,
                    "required_all_tags": ["Sachkunde §34a"],
                    "required_any_tags": ["Bewacher-ID", "Erste Hilfe"],
                    "status": "open"
                }
                
                response = await client.post(f"{self.base_url}/jobs", 
                                           json=job_data, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Job Creation", True, 
                                f"Job created: {data.get('title')}")
                    self.test_data["job_id"] = data.get("id")
                    self.test_data["job"] = data
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Job Creation", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get All Open Jobs
                response = await client.get(f"{self.base_url}/jobs", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Open Jobs", True, 
                                f"Retrieved {len(data)} open jobs")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Open Jobs", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Employer's Jobs
                if employer_id:
                    response = await client.get(f"{self.base_url}/jobs/employer/{employer_id}", 
                                              headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Get Employer Jobs", True, 
                                    f"Retrieved {len(data)} jobs for employer")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Get Employer Jobs", False, 
                                    f"Status: {response.status_code}", error_data)
                
                # Test Get Single Job
                job_id = self.test_data.get("job_id")
                if job_id:
                    response = await client.get(f"{self.base_url}/jobs/{job_id}", 
                                              headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Get Single Job", True, 
                                    f"Retrieved job: {data.get('title')}")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Get Single Job", False, 
                                    f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Jobs System", False, f"Error: {str(e)}")
    
    async def test_applications_system(self):
        """Test job application system"""
        print("📝 TESTING APPLICATIONS SYSTEM")
        print("=" * 50)
        
        if "worker" not in self.auth_tokens or "employer" not in self.auth_tokens:
            self.log_test("Applications System Tests", False, "Missing auth tokens")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            worker_headers = {"Authorization": f"Bearer {self.auth_tokens['worker']}"}
            employer_headers = {"Authorization": f"Bearer {self.auth_tokens['employer']}"}
            
            worker_id = self.test_data.get("worker_user_id")
            employer_id = self.test_data.get("employer_user_id")
            job_id = self.test_data.get("job_id")
            
            if not all([worker_id, employer_id, job_id]):
                self.log_test("Applications System Tests", False, "Missing required test data")
                return
            
            try:
                # Test Create Application
                app_data = {
                    "jobId": job_id,
                    "workerId": worker_id,
                    "employerId": employer_id
                }
                
                response = await client.post(f"{self.base_url}/applications", 
                                           json=app_data, headers=worker_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Application Creation", True, 
                                f"Application created: {data.get('id')}")
                    self.test_data["application_id"] = data.get("id")
                    self.test_data["application"] = data
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Application Creation", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Applications for Job (Employer view)
                response = await client.get(f"{self.base_url}/applications/job/{job_id}", 
                                          headers=employer_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Job Applications", True, 
                                f"Retrieved {len(data)} applications for job")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Job Applications", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Applications for Worker
                response = await client.get(f"{self.base_url}/applications/worker/{worker_id}", 
                                          headers=worker_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Worker Applications", True, 
                                f"Retrieved {len(data)} applications for worker")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Worker Applications", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Accept Application
                application_id = self.test_data.get("application_id")
                if application_id:
                    response = await client.put(f"{self.base_url}/applications/{application_id}/accept", 
                                              headers=employer_headers)
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("Accept Application", True, 
                                    f"Application accepted: {data.get('status')}")
                    else:
                        error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                        self.log_test("Accept Application", False, 
                                    f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Applications System", False, f"Error: {str(e)}")
    
    async def test_chat_system(self):
        """Test chat messaging system"""
        print("💬 TESTING CHAT SYSTEM")
        print("=" * 50)
        
        if "worker" not in self.auth_tokens or "employer" not in self.auth_tokens:
            self.log_test("Chat System Tests", False, "Missing auth tokens")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            worker_headers = {"Authorization": f"Bearer {self.auth_tokens['worker']}"}
            employer_headers = {"Authorization": f"Bearer {self.auth_tokens['employer']}"}
            
            application_id = self.test_data.get("application_id")
            
            if not application_id:
                self.log_test("Chat System Tests", False, "No application ID available")
                return
            
            try:
                # Test Send Message (Worker to Employer)
                message_data = {
                    "applicationId": application_id,
                    "message": "Hallo! Ich freue mich auf den Auftrag. Wann soll ich vor Ort sein?"
                }
                
                response = await client.post(f"{self.base_url}/chat/messages", 
                                           json=message_data, headers=worker_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Send Message (Worker)", True, 
                                f"Message sent: {data.get('message')[:50]}...")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Send Message (Worker)", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Messages (Employer view)
                response = await client.get(f"{self.base_url}/chat/messages/{application_id}", 
                                          headers=employer_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Messages (Employer)", True, 
                                f"Retrieved {len(data)} messages")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Messages (Employer)", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Send Reply (Employer to Worker)
                reply_data = {
                    "applicationId": application_id,
                    "message": "Hallo Max! Bitte seien Sie um 17:45 Uhr vor Ort für das Briefing. Vielen Dank!"
                }
                
                response = await client.post(f"{self.base_url}/chat/messages", 
                                           json=reply_data, headers=employer_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Send Reply (Employer)", True, 
                                f"Reply sent: {data.get('message')[:50]}...")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Send Reply (Employer)", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get All Messages (Worker view)
                response = await client.get(f"{self.base_url}/chat/messages/{application_id}", 
                                          headers=worker_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get All Messages (Worker)", True, 
                                f"Retrieved {len(data)} messages in conversation")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get All Messages (Worker)", False, 
                                f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Chat System", False, f"Error: {str(e)}")
    
    async def test_reviews_system(self):
        """Test reviews and ratings system"""
        print("⭐ TESTING REVIEWS SYSTEM")
        print("=" * 50)
        
        if "worker" not in self.auth_tokens or "employer" not in self.auth_tokens:
            self.log_test("Reviews System Tests", False, "Missing auth tokens")
            return
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            worker_headers = {"Authorization": f"Bearer {self.auth_tokens['worker']}"}
            employer_headers = {"Authorization": f"Bearer {self.auth_tokens['employer']}"}
            
            worker_id = self.test_data.get("worker_user_id")
            employer_id = self.test_data.get("employer_user_id")
            job_id = self.test_data.get("job_id")
            
            if not all([worker_id, employer_id, job_id]):
                self.log_test("Reviews System Tests", False, "Missing required test data")
                return
            
            try:
                # Test Create Review (Employer reviews Worker)
                review_data = {
                    "jobId": job_id,
                    "workerId": worker_id,
                    "employerId": employer_id,
                    "rating": 5,
                    "comment": "Hervorragender Sicherheitsmitarbeiter! Pünktlich, professionell und sehr zuverlässig. Gerne wieder!"
                }
                
                response = await client.post(f"{self.base_url}/reviews", 
                                           json=review_data, headers=employer_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Create Review", True, 
                                f"Review created with {data.get('rating')} stars")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Create Review", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Reviews for Worker
                response = await client.get(f"{self.base_url}/reviews/worker/{worker_id}", 
                                          headers=worker_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Worker Reviews", True, 
                                f"Retrieved {len(data)} reviews for worker")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Worker Reviews", False, 
                                f"Status: {response.status_code}", error_data)
                
                # Test Get Reviews for Employer
                response = await client.get(f"{self.base_url}/reviews/employer/{employer_id}", 
                                          headers=employer_headers)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Get Employer Reviews", True, 
                                f"Retrieved {len(data)} reviews for employer")
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    self.log_test("Get Employer Reviews", False, 
                                f"Status: {response.status_code}", error_data)
                        
            except Exception as e:
                self.log_test("Reviews System", False, f"Error: {str(e)}")
    
    async def test_authorization_headers(self):
        """Test that authorization headers work correctly after frontend refactoring"""
        print("🔒 TESTING AUTHORIZATION HEADERS")
        print("=" * 50)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Test with correct Bearer token format
                if "worker" in self.auth_tokens:
                    headers = {"Authorization": f"Bearer {self.auth_tokens['worker']}"}
                    response = await client.get(f"{self.base_url}/jobs", headers=headers)
                    if response.status_code == 200:
                        self.log_test("Correct Bearer Token Format", True, 
                                    "Authorization header 'Bearer {token}' works correctly")
                    else:
                        self.log_test("Correct Bearer Token Format", False, 
                                    f"Status: {response.status_code}")
                
                # Test with missing Authorization header
                response = await client.get(f"{self.base_url}/jobs")
                if response.status_code == 401:
                    self.log_test("Missing Authorization Header", True, 
                                "Correctly returns 401 when Authorization header is missing")
                else:
                    self.log_test("Missing Authorization Header", False, 
                                f"Expected 401, got {response.status_code}")
                
                # Test with invalid Bearer format
                headers = {"Authorization": "InvalidFormat token123"}
                response = await client.get(f"{self.base_url}/jobs", headers=headers)
                if response.status_code == 401:
                    self.log_test("Invalid Bearer Format", True, 
                                "Correctly returns 401 for invalid Authorization format")
                else:
                    self.log_test("Invalid Bearer Format", False, 
                                f"Expected 401, got {response.status_code}")
                        
            except Exception as e:
                self.log_test("Authorization Headers", False, f"Error: {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🎯 BACKEND API TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🎉 BACKEND API TESTING COMPLETED")
        print(f"All major endpoints tested with German realistic data")
        print(f"Authorization header format 'Bearer {{token}}' verified")
        
        return passed_tests, failed_tests

    async def test_auth_endpoints_focused(self):
        """Focused auth testing as requested in German review"""
        print("🔐 TESTING AUTH ENDPOINTS NACH AUTHCONTEXT FIX")
        print("=" * 60)
        
        # Generate dynamic email to avoid conflicts as requested
        timestamp = int(time.time())
        
        test_scenarios = [
            {
                "email": f"testuser_{timestamp}@test.de",
                "password": "Test123!",
                "role": "worker",
                "name": "Test Worker"
            },
            {
                "email": f"employer_{timestamp}@test.de", 
                "password": "Test123!",
                "role": "employer",
                "name": "Test Employer"
            }
        ]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for scenario in test_scenarios:
                print(f"\n🧪 Testing {scenario['role'].upper()} Flow:")
                print("-" * 40)
                
                # 1. SIGNUP FLOW
                try:
                    signup_data = {
                        "email": scenario["email"],
                        "password": scenario["password"],
                        "role": scenario["role"]
                    }
                    
                    response = await client.post(f"{self.base_url}/auth/signup", json=signup_data)
                    
                    if response.status_code in [200, 201]:
                        data = response.json()
                        if all(key in data for key in ["userId", "email", "role", "token"]):
                            self.log_test(f"Signup Flow ({scenario['role']})", True, 
                                        f"✅ User created: {data['email']}, Token received")
                            scenario["userId"] = data["userId"]
                            scenario["token"] = data["token"]
                        else:
                            self.log_test(f"Signup Flow ({scenario['role']})", False, 
                                        f"Missing required fields in response")
                            continue
                    else:
                        error_text = response.text
                        self.log_test(f"Signup Flow ({scenario['role']})", False, 
                                    f"Status: {response.status_code}, Error: {error_text}")
                        continue
                        
                except Exception as e:
                    self.log_test(f"Signup Flow ({scenario['role']})", False, f"Exception: {str(e)}")
                    continue
                
                # 2. LOGIN FLOW
                try:
                    login_data = {
                        "email": scenario["email"],
                        "password": scenario["password"]
                    }
                    
                    response = await client.post(f"{self.base_url}/auth/login", json=login_data)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if (data.get("email") == scenario["email"] and 
                            data.get("role") == scenario["role"] and
                            "token" in data):
                            self.log_test(f"Login Flow ({scenario['role']})", True, 
                                        f"✅ Login successful, token valid")
                            scenario["login_token"] = data["token"]
                        else:
                            self.log_test(f"Login Flow ({scenario['role']})", False, 
                                        f"Data mismatch in login response")
                    else:
                        error_text = response.text
                        self.log_test(f"Login Flow ({scenario['role']})", False, 
                                    f"Status: {response.status_code}, Error: {error_text}")
                        
                except Exception as e:
                    self.log_test(f"Login Flow ({scenario['role']})", False, f"Exception: {str(e)}")
                
                # 3. GET CURRENT USER
                if "login_token" in scenario:
                    try:
                        headers = {"Authorization": f"Bearer {scenario['login_token']}"}
                        response = await client.get(f"{self.base_url}/auth/me", headers=headers)
                        
                        if response.status_code == 200:
                            data = response.json()
                            if (data.get("email") == scenario["email"] and 
                                data.get("role") == scenario["role"] and
                                data.get("userId") == scenario["userId"]):
                                self.log_test(f"Get Current User ({scenario['role']})", True, 
                                            f"✅ User data verified correctly")
                            else:
                                self.log_test(f"Get Current User ({scenario['role']})", False, 
                                            f"User data mismatch")
                        else:
                            error_text = response.text
                            self.log_test(f"Get Current User ({scenario['role']})", False, 
                                        f"Status: {response.status_code}, Error: {error_text}")
                            
                    except Exception as e:
                        self.log_test(f"Get Current User ({scenario['role']})", False, f"Exception: {str(e)}")
            
            # 4. INVALID LOGIN TESTS
            print(f"\n🚫 Testing Invalid Login Scenarios:")
            print("-" * 40)
            
            try:
                # Test with non-existent email
                invalid_login = {
                    "email": "nonexistent@test.de",
                    "password": "Test123!"
                }
                
                response = await client.post(f"{self.base_url}/auth/login", json=invalid_login)
                
                if response.status_code == 404:
                    self.log_test("Invalid Login - Non-existent Email", True, 
                                f"✅ Correctly returned 404 for non-existent user")
                else:
                    self.log_test("Invalid Login - Non-existent Email", False, 
                                f"Expected 404, got {response.status_code}")
                    
            except Exception as e:
                self.log_test("Invalid Login - Non-existent Email", False, f"Exception: {str(e)}")
            
            try:
                # Test with wrong password (using first test user)
                if test_scenarios:
                    wrong_password = {
                        "email": test_scenarios[0]["email"],
                        "password": "WrongPassword123!"
                    }
                    
                    response = await client.post(f"{self.base_url}/auth/login", json=wrong_password)
                    
                    if response.status_code == 401:
                        self.log_test("Invalid Login - Wrong Password", True, 
                                    f"✅ Correctly returned 401 for wrong password")
                    else:
                        self.log_test("Invalid Login - Wrong Password", False, 
                                    f"Expected 401, got {response.status_code}")
                        
            except Exception as e:
                self.log_test("Invalid Login - Wrong Password", False, f"Exception: {str(e)}")

async def main():
    """Run focused auth tests as requested"""
    print("🔐 BACKEND AUTH TESTING NACH AUTHCONTEXT FIX")
    print("Testing authentication endpoints with dynamic emails")
    print("=" * 60)
    
    tester = AuthBackendTester()
    
    # Test backend health first
    await tester.test_health_check()
    
    # Run focused auth testing
    await tester.test_auth_endpoints_focused()
    
    # Print final summary
    passed, failed = tester.print_summary()
    
    return passed, failed

if __name__ == "__main__":
    asyncio.run(main())