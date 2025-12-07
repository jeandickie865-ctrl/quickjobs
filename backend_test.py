#!/usr/bin/env python3
"""
🚨 UMFASSENDE SYSTEM-PRÜFUNG - Backend Testing Suite
Comprehensive Backend Testing for ShiftMatch App

Tests all 7 critical features implemented today:
1. New Categories Integration (Friseur, Kosmetik, DJ, etc.)
2. Job Creation with ISO Timestamps
3. Document Upload System (Base64)
4. Employer Profile Public View
5. Review/Rating System
6. Backend Filter for Jobs
7. Performance & Stability

Usage: python backend_test.py
"""

import asyncio
import aiohttp
import json
import base64
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid

# Backend Configuration
BACKEND_URL = "https://shiftmatch-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.test_results = []
        self.tokens = {}  # Store tokens for different users
        self.test_users = {}  # Store created test users
        self.test_jobs = {}  # Store created test jobs
        self.test_documents = {}  # Store uploaded documents
        self.performance_metrics = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} {test_name} ({result['response_time_ms']}ms)")
        if details:
            print(f"    {details}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, 
                          headers: Dict = None, expect_status: int = 200) -> tuple:
        """Make HTTP request and measure response time"""
        url = f"{BACKEND_URL}{endpoint}"
        start_time = time.time()
        
        try:
            if headers is None:
                headers = {"Content-Type": "application/json"}
            
            kwargs = {"headers": headers}
            if data is not None:
                kwargs["json"] = data
            
            async with self.session.request(method, url, **kwargs) as response:
                response_time = time.time() - start_time
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                success = response.status == expect_status
                return success, response.status, response_data, response_time
                
        except Exception as e:
            response_time = time.time() - start_time
            return False, 0, str(e), response_time
    
    def get_auth_headers(self, user_type: str) -> Dict:
        """Get authorization headers for a user type"""
        token = self.tokens.get(user_type)
        if not token:
            return {"Content-Type": "application/json"}
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    
    async def test_backend_health(self):
        """Test basic backend connectivity"""
        print("\n🏥 BACKEND HEALTH CHECK")
        
        # Test root endpoint
        success, status, data, rt = await self.make_request("GET", "/")
        self.log_test("Backend Root Endpoint", success and data.get("message") == "Hello World", 
                     f"Status: {status}, Response: {data}", rt)
        
        # Test health endpoint
        success, status, data, rt = await self.make_request("GET", "/health")
        self.log_test("Backend Health Endpoint", success and data.get("status") == "ok", 
                     f"Status: {status}, Response: {data}", rt)
    
    async def create_test_users(self):
        """Create test users for different roles"""
        print("\n👥 CREATING TEST USERS")
        
        timestamp = int(time.time())
        
        # Create Worker
        worker_email = f"testworker_{timestamp}@test.de"
        worker_data = {
            "email": worker_email,
            "password": "testpass123",
            "role": "worker",
            "accountType": "private"
        }
        
        success, status, data, rt = await self.make_request("POST", "/auth/signup", worker_data)
        if success:
            self.tokens["worker"] = data.get("token")
            self.test_users["worker"] = {
                "userId": data.get("userId"),
                "email": worker_email,
                "token": data.get("token")
            }
        self.log_test("Create Worker User", success, 
                     f"Email: {worker_email}, Status: {status}", rt)
        
        # Create Employer
        employer_email = f"testemployer_{timestamp}@test.de"
        employer_data = {
            "email": employer_email,
            "password": "testpass123",
            "role": "employer",
            "accountType": "business"
        }
        
        success, status, data, rt = await self.make_request("POST", "/auth/signup", employer_data)
        if success:
            self.tokens["employer"] = data.get("token")
            self.test_users["employer"] = {
                "userId": data.get("userId"),
                "email": employer_email,
                "token": data.get("token")
            }
        self.log_test("Create Employer User", success, 
                     f"Email: {employer_email}, Status: {status}", rt)
    
    async def test_new_categories_integration(self):
        """Test new categories: friseur, kosmetik, dj with subcategories"""
        print("\n💇 TESTING NEW CATEGORIES INTEGRATION")
        
        if not self.tokens.get("worker"):
            self.log_test("New Categories - No Worker Token", False, "Worker token not available")
            return
        
        # Test 1: Create worker profile with "friseur" category
        friseur_profile = {
            "firstName": "Maria",
            "lastName": "Schneider",
            "phone": "+49123456789",
            "email": self.test_users["worker"]["email"],
            "categories": ["friseur"],
            "subcategories": ["herrenfriseur", "damenfriseur"],
            "qualifications": ["meisterbrief"],
            "radiusKm": 25,
            "homeAddress": {
                "street": "Hauptstraße 123",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "homeLat": 52.5200,
            "homeLon": 13.4050
        }
        
        headers = self.get_auth_headers("worker")
        success, status, data, rt = await self.make_request("POST", "/profiles/worker", friseur_profile, headers)
        self.log_test("Worker Profile - Friseur Category", success, 
                     f"Status: {status}, Categories: {data.get('categories') if success else 'Failed'}", rt)
        
        # Test 2: Create job with "kosmetik" category
        if self.tokens.get("employer"):
            kosmetik_job = {
                "title": "Kosmetikbehandlung Event",
                "description": "Mobile Kosmetikbehandlung für Firmenveranstaltung",
                "category": "kosmetik",
                "subcategory": "gesichtsbehandlung",
                "qualifications": ["kosmetikausbildung"],
                "timeMode": "fixed_time",
                "date": "2025-12-15",
                "start_at": "14:00",
                "end_at": "18:00",
                "startAt": "2025-12-15T14:00:00Z",
                "endAt": "2025-12-15T18:00:00Z",
                "address": {
                    "street": "Friedrichstraße 200",
                    "postalCode": "10117",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5170,
                "lon": 13.3888,
                "workerAmountCents": 15000,
                "paymentToWorker": "bank"
            }
            
            emp_headers = self.get_auth_headers("employer")
            success, status, data, rt = await self.make_request("POST", "/jobs", kosmetik_job, emp_headers)
            if success:
                self.test_jobs["kosmetik"] = data
            self.log_test("Job Creation - Kosmetik Category", success, 
                         f"Status: {status}, Category: {data.get('category') if success else 'Failed'}", rt)
        
        # Test 3: Create job with "dj" category and subcategory "hochzeits-dj"
        if self.tokens.get("employer"):
            dj_job = {
                "title": "Hochzeits-DJ gesucht",
                "description": "DJ für Hochzeitsfeier mit 150 Gästen",
                "category": "dj",
                "subcategory": "hochzeits-dj",
                "qualifications": ["dj-erfahrung", "eigene-ausruestung"],
                "timeMode": "fixed_time",
                "date": "2025-12-20",
                "start_at": "18:00",
                "end_at": "02:00",
                "startAt": "2025-12-20T18:00:00Z",
                "endAt": "2025-12-21T02:00:00Z",
                "address": {
                    "street": "Eventlocation Spree",
                    "postalCode": "12345",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5000,
                "lon": 13.4000,
                "workerAmountCents": 50000,
                "paymentToWorker": "cash"
            }
            
            success, status, data, rt = await self.make_request("POST", "/jobs", dj_job, emp_headers)
            if success:
                self.test_jobs["dj"] = data
            self.log_test("Job Creation - DJ Hochzeits-DJ", success, 
                         f"Status: {status}, Subcategory: {data.get('subcategory') if success else 'Failed'}", rt)
        
        # Test 4: Test invalid category
        if self.tokens.get("worker"):
            invalid_profile = {
                "firstName": "Test",
                "lastName": "Invalid",
                "phone": "+49123456789",
                "email": "test@invalid.de",
                "categories": ["invalid123"],  # Invalid category
                "radiusKm": 15,
                "homeAddress": {
                    "street": "Test",
                    "postalCode": "12345",
                    "city": "Test",
                    "country": "DE"
                }
            }
            
            success, status, data, rt = await self.make_request("POST", "/profiles/worker", invalid_profile, headers, expect_status=422)
            self.log_test("Invalid Category Validation", success, 
                         f"Status: {status}, Expected 422 for invalid category", rt)
    
    async def test_iso_timestamps(self):
        """Test job creation with ISO timestamps"""
        print("\n⏰ TESTING ISO TIMESTAMPS")
        
        if not self.tokens.get("employer"):
            self.log_test("ISO Timestamps - No Employer Token", False, "Employer token not available")
            return
        
        # Test 1: Create job with ISO timestamps
        iso_job = {
            "title": "Security Event Job",
            "description": "Sicherheitsdienst für Veranstaltung",
            "category": "security",
            "subcategory": "event_security",
            "timeMode": "fixed_time",
            "date": "2025-12-10",
            "startAt": "2025-12-10T18:00:00Z",
            "endAt": "2025-12-10T22:00:00Z",
            "address": {
                "street": "Alexanderplatz 1",
                "postalCode": "10178",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5219,
            "lon": 13.4132,
            "workerAmountCents": 12000,
            "paymentToWorker": "bank"
        }
        
        headers = self.get_auth_headers("employer")
        success, status, data, rt = await self.make_request("POST", "/jobs", iso_job, headers)
        
        if success:
            self.test_jobs["iso_timestamp"] = data
            # Verify timestamps are stored correctly
            stored_start = data.get("startAt")
            stored_end = data.get("endAt")
            expected_start = "2025-12-10T18:00:00Z"
            expected_end = "2025-12-10T22:00:00Z"
            
            timestamp_correct = stored_start == expected_start and stored_end == expected_end
            self.log_test("ISO Timestamp Storage", timestamp_correct, 
                         f"Stored: {stored_start} - {stored_end}, Expected: {expected_start} - {expected_end}", rt)
        else:
            self.log_test("Job Creation with ISO Timestamps", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 2: Verify job appears in employer's job list
        if self.test_jobs.get("iso_timestamp"):
            employer_id = self.test_users["employer"]["userId"]
            success, status, data, rt = await self.make_request("GET", f"/jobs/employer/{employer_id}", headers=headers)
            
            if success:
                job_found = any(job.get("id") == self.test_jobs["iso_timestamp"]["id"] for job in data)
                self.log_test("ISO Job in Employer List", job_found, 
                             f"Found {len(data)} jobs, ISO job present: {job_found}", rt)
            else:
                self.log_test("Get Employer Jobs", success, f"Status: {status}", rt)
        
        # Test 3: Verify job appears in general jobs list (future jobs)
        success, status, data, rt = await self.make_request("GET", "/jobs", headers=headers)
        if success:
            iso_job_found = any(job.get("startAt", "").startswith("2025-12-10T18:00:00") for job in data)
            self.log_test("ISO Job in General List", iso_job_found, 
                         f"Found {len(data)} jobs, ISO job with correct timestamp: {iso_job_found}", rt)
        else:
            self.log_test("Get All Jobs", success, f"Status: {status}", rt)
    
    async def test_document_system(self):
        """Test Base64 document upload system"""
        print("\n📄 TESTING DOCUMENT UPLOAD SYSTEM")
        
        if not self.tokens.get("worker"):
            self.log_test("Document System - No Worker Token", False, "Worker token not available")
            return
        
        worker_id = self.test_users["worker"]["userId"]
        headers = self.get_auth_headers("worker")
        
        # Create a test PDF (small Base64 encoded PDF)
        test_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        test_pdf_b64 = base64.b64encode(test_pdf_content).decode('utf-8')
        
        # Test 1: Upload PDF document
        pdf_upload = {
            "filename": "test_certificate.pdf",
            "content_type": "application/pdf",
            "data": test_pdf_b64
        }
        
        success, status, data, rt = await self.make_request("POST", f"/profiles/worker/{worker_id}/documents", pdf_upload, headers)
        
        if success:
            doc_id = data.get("document", {}).get("id")
            self.test_documents["pdf"] = doc_id
            self.log_test("PDF Document Upload", success, 
                         f"Status: {status}, Document ID: {doc_id}", rt)
        else:
            self.log_test("PDF Document Upload", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 2: Upload image document (small test image)
        # Create a minimal PNG (1x1 pixel)
        test_png_content = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==")
        test_png_b64 = base64.b64encode(test_png_content).decode('utf-8')
        
        png_upload = {
            "filename": "profile_photo.png",
            "content_type": "image/png",
            "data": test_png_b64
        }
        
        success, status, data, rt = await self.make_request("POST", f"/profiles/worker/{worker_id}/documents", png_upload, headers)
        
        if success:
            doc_id = data.get("document", {}).get("id")
            self.test_documents["png"] = doc_id
            self.log_test("PNG Image Upload", success, 
                         f"Status: {status}, Document ID: {doc_id}", rt)
        else:
            self.log_test("PNG Image Upload", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 3: Download uploaded document
        if self.test_documents.get("pdf"):
            doc_id = self.test_documents["pdf"]
            success, status, data, rt = await self.make_request("GET", f"/profiles/worker/{worker_id}/documents/{doc_id}", headers=headers)
            
            if success:
                returned_data = data.get("data", "")
                data_matches = returned_data == test_pdf_b64
                self.log_test("Document Download", data_matches, 
                             f"Status: {status}, Data integrity: {data_matches}", rt)
            else:
                self.log_test("Document Download", success, f"Status: {status}", rt)
        
        # Test 4: Test file size validation (>5MB should fail)
        large_content = b"x" * (6 * 1024 * 1024)  # 6MB
        large_b64 = base64.b64encode(large_content).decode('utf-8')
        
        large_upload = {
            "filename": "large_file.pdf",
            "content_type": "application/pdf",
            "data": large_b64
        }
        
        success, status, data, rt = await self.make_request("POST", f"/profiles/worker/{worker_id}/documents", large_upload, headers, expect_status=400)
        self.log_test("Large File Validation (>5MB)", success, 
                     f"Status: {status}, Expected 400 for file >5MB", rt)
        
        # Test 5: Test invalid file type
        txt_upload = {
            "filename": "test.txt",
            "content_type": "text/plain",
            "data": base64.b64encode(b"This is a text file").decode('utf-8')
        }
        
        success, status, data, rt = await self.make_request("POST", f"/profiles/worker/{worker_id}/documents", txt_upload, headers, expect_status=400)
        self.log_test("Invalid File Type Validation", success, 
                     f"Status: {status}, Expected 400 for .txt file", rt)
        
        # Test 6: Delete document
        if self.test_documents.get("png"):
            doc_id = self.test_documents["png"]
            success, status, data, rt = await self.make_request("DELETE", f"/profiles/worker/{worker_id}/documents/{doc_id}", headers=headers)
            self.log_test("Document Deletion", success, 
                         f"Status: {status}, Message: {data.get('message') if success else 'Failed'}", rt)
            
            # Verify document is deleted
            success, status, data, rt = await self.make_request("GET", f"/profiles/worker/{worker_id}/documents/{doc_id}", headers=headers, expect_status=404)
            self.log_test("Document Deletion Verification", success, 
                         f"Status: {status}, Expected 404 after deletion", rt)
    
    async def test_employer_public_view(self):
        """Test employer profile public view endpoint"""
        print("\n🏢 TESTING EMPLOYER PROFILE PUBLIC VIEW")
        
        if not self.tokens.get("employer"):
            self.log_test("Employer Public View - No Token", False, "Employer token not available")
            return
        
        # First create an employer profile
        employer_id = self.test_users["employer"]["userId"]
        employer_profile = {
            "firstName": "Hans",
            "lastName": "Mueller",
            "company": "Mueller GmbH",
            "phone": "+49301234567",
            "email": self.test_users["employer"]["email"],
            "street": "Unter den Linden 1",
            "postalCode": "10117",
            "city": "Berlin",
            "lat": 52.5170,
            "lon": 13.3888,
            "shortBio": "Erfahrener Arbeitgeber im Eventbereich"
        }
        
        headers = self.get_auth_headers("employer")
        success, status, data, rt = await self.make_request("POST", "/profiles/employer", employer_profile, headers)
        self.log_test("Create Employer Profile", success, 
                     f"Status: {status}, Company: {data.get('company') if success else 'Failed'}", rt)
        
        # Test public view endpoint (should not return 403)
        success, status, data, rt = await self.make_request("GET", f"/profiles/employer/{employer_id}/public-view", headers=headers)
        
        if success:
            # Verify only public data is returned
            has_public_data = all(key in data for key in ["companyName", "firstName", "lastName"])
            no_private_data = "email" not in data or data.get("email") is None
            
            self.log_test("Employer Public View Access", success and not (status == 403), 
                         f"Status: {status}, No 403 error: {status != 403}", rt)
            self.log_test("Employer Public Data Only", has_public_data and no_private_data, 
                         f"Public data present: {has_public_data}, Private data hidden: {no_private_data}", rt)
        else:
            self.log_test("Employer Public View Access", success, 
                         f"Status: {status}, Error: {data}", rt)
    
    async def test_review_system(self):
        """Test review/rating system"""
        print("\n⭐ TESTING REVIEW/RATING SYSTEM")
        
        if not all(self.tokens.get(role) for role in ["worker", "employer"]):
            self.log_test("Review System - Missing Tokens", False, "Worker or Employer token not available")
            return
        
        # Create a job and application first (needed for reviews)
        if not self.test_jobs:
            # Create a simple job for review testing
            simple_job = {
                "title": "Test Job for Review",
                "category": "sicherheit",
                "timeMode": "fixed_time",
                "date": "2025-12-05",
                "startAt": "2025-12-05T10:00:00Z",
                "endAt": "2025-12-05T14:00:00Z",
                "address": {
                    "street": "Test Street 1",
                    "postalCode": "12345",
                    "city": "Berlin",
                    "country": "DE"
                },
                "lat": 52.5200,
                "lon": 13.4050,
                "workerAmountCents": 8000,
                "paymentToWorker": "cash"
            }
            
            emp_headers = self.get_auth_headers("employer")
            success, status, data, rt = await self.make_request("POST", "/jobs", simple_job, emp_headers)
            if success:
                self.test_jobs["review_test"] = data
        
        if not self.test_jobs.get("review_test"):
            self.log_test("Review System - No Test Job", False, "Could not create test job for reviews")
            return
        
        job_id = self.test_jobs["review_test"]["id"]
        worker_id = self.test_users["worker"]["userId"]
        employer_id = self.test_users["employer"]["userId"]
        
        # Test 1: Create a review
        review_data = {
            "jobId": job_id,
            "workerId": worker_id,
            "employerId": employer_id,
            "rating": 5,
            "comment": "Sehr professionelle Arbeit, pünktlich und zuverlässig!"
        }
        
        emp_headers = self.get_auth_headers("employer")
        success, status, data, rt = await self.make_request("POST", "/reviews", review_data, emp_headers)
        
        if success:
            review_id = data.get("id")
            self.log_test("Create Review", success, 
                         f"Status: {status}, Rating: {data.get('rating')}, Review ID: {review_id}", rt)
        else:
            self.log_test("Create Review", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 2: Get reviews for worker
        success, status, data, rt = await self.make_request("GET", f"/reviews/worker/{worker_id}", headers=emp_headers)
        
        if success:
            review_count = len(data)
            has_our_review = any(review.get("rating") == 5 for review in data)
            self.log_test("Get Worker Reviews", success and has_our_review, 
                         f"Status: {status}, Review count: {review_count}, Our review found: {has_our_review}", rt)
        else:
            self.log_test("Get Worker Reviews", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 3: Get reviews for employer
        success, status, data, rt = await self.make_request("GET", f"/reviews/employer/{employer_id}", headers=emp_headers)
        
        if success:
            review_count = len(data)
            self.log_test("Get Employer Reviews", success, 
                         f"Status: {status}, Review count: {review_count}", rt)
        else:
            self.log_test("Get Employer Reviews", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 4: Create another review with different rating
        review_data_2 = {
            "jobId": job_id,
            "workerId": worker_id,
            "employerId": employer_id,
            "rating": 4,
            "comment": "Gute Arbeit, kleine Verbesserungen möglich"
        }
        
        success, status, data, rt = await self.make_request("POST", "/reviews", review_data_2, emp_headers)
        self.log_test("Create Second Review", success, 
                     f"Status: {status}, Rating: {data.get('rating') if success else 'Failed'}", rt)
    
    async def test_backend_filters(self):
        """Test backend filter for jobs with different date formats"""
        print("\n🔍 TESTING BACKEND JOB FILTERS")
        
        if not self.tokens.get("employer"):
            self.log_test("Backend Filters - No Token", False, "Employer token not available")
            return
        
        employer_id = self.test_users["employer"]["userId"]
        headers = self.get_auth_headers("employer")
        
        # Create job with ISO timestamp format
        iso_job = {
            "title": "ISO Format Job",
            "category": "sicherheit",
            "timeMode": "fixed_time",
            "startAt": "2025-12-25T15:00:00Z",
            "endAt": "2025-12-25T19:00:00Z",
            "address": {
                "street": "ISO Street 1",
                "postalCode": "12345",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 10000,
            "paymentToWorker": "bank"
        }
        
        success, status, data, rt = await self.make_request("POST", "/jobs", iso_job, headers)
        iso_job_id = data.get("id") if success else None
        self.log_test("Create ISO Format Job", success, 
                     f"Status: {status}, Job ID: {iso_job_id}", rt)
        
        # Create job with legacy date string format
        legacy_job = {
            "title": "Legacy Format Job",
            "category": "sicherheit",
            "timeMode": "fixed_time",
            "date": "2025-12-26",
            "start_at": "16:00",
            "end_at": "20:00",
            "address": {
                "street": "Legacy Street 1",
                "postalCode": "12345",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 12000,
            "paymentToWorker": "cash"
        }
        
        success, status, data, rt = await self.make_request("POST", "/jobs", legacy_job, headers)
        legacy_job_id = data.get("id") if success else None
        self.log_test("Create Legacy Format Job", success, 
                     f"Status: {status}, Job ID: {legacy_job_id}", rt)
        
        # Test: Get employer jobs (should find both formats)
        success, status, data, rt = await self.make_request("GET", f"/jobs/employer/{employer_id}", headers=headers)
        
        if success:
            iso_found = any(job.get("id") == iso_job_id for job in data) if iso_job_id else False
            legacy_found = any(job.get("id") == legacy_job_id for job in data) if legacy_job_id else False
            
            self.log_test("Backend Filter - ISO Jobs Found", iso_found, 
                         f"ISO job found in employer list: {iso_found}", rt)
            self.log_test("Backend Filter - Legacy Jobs Found", legacy_found, 
                         f"Legacy job found in employer list: {legacy_found}", rt)
            self.log_test("Backend Filter - Both Formats", iso_found and legacy_found, 
                         f"Both ISO and legacy formats supported: {iso_found and legacy_found}", rt)
        else:
            self.log_test("Backend Filter Test", success, 
                         f"Status: {status}, Error: {data}", rt)
    
    async def test_performance_stability(self):
        """Test response times and error handling"""
        print("\n⚡ TESTING PERFORMANCE & STABILITY")
        
        # Test response times for critical endpoints
        endpoints_to_test = [
            ("GET", "/", "Root Endpoint"),
            ("GET", "/health", "Health Check"),
            ("GET", "/jobs", "Get All Jobs")
        ]
        
        if self.tokens.get("worker"):
            worker_headers = self.get_auth_headers("worker")
            endpoints_to_test.append(("GET", "/jobs/matches/me", "Worker Job Matches"))
        
        for method, endpoint, name in endpoints_to_test:
            headers = self.get_auth_headers("worker") if "matches" in endpoint else None
            success, status, data, rt = await self.make_request(method, endpoint, headers=headers)
            
            # Check if response time is acceptable
            acceptable_time = rt < 0.5  # 500ms threshold
            self.log_test(f"Performance - {name}", acceptable_time, 
                         f"Response time: {rt*1000:.0f}ms (threshold: 500ms)", rt)
            
            # Track performance metrics
            self.performance_metrics[name] = rt * 1000
        
        # Test error handling - invalid endpoints
        success, status, data, rt = await self.make_request("GET", "/nonexistent", expect_status=404)
        self.log_test("Error Handling - 404", success, 
                     f"Status: {status}, Expected 404 for invalid endpoint", rt)
        
        # Test error handling - invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_123"}
        success, status, data, rt = await self.make_request("GET", "/auth/me", headers=invalid_headers, expect_status=401)
        self.log_test("Error Handling - Invalid Token", success, 
                     f"Status: {status}, Expected 401 for invalid token", rt)
    
    async def test_data_consistency(self):
        """Test data consistency and validation"""
        print("\n🔒 TESTING DATA CONSISTENCY")
        
        if not self.tokens.get("employer"):
            self.log_test("Data Consistency - No Token", False, "Employer token not available")
            return
        
        # Test 1: Job creation with all required fields
        complete_job = {
            "title": "Complete Job Test",
            "description": "Job with all required fields for consistency test",
            "category": "sicherheit",
            "subcategory": "objektschutz",
            "qualifications": ["sicherheitsschein"],
            "timeMode": "fixed_time",
            "date": "2025-12-30",
            "startAt": "2025-12-30T09:00:00Z",
            "endAt": "2025-12-30T17:00:00Z",
            "address": {
                "street": "Consistency Street 1",
                "houseNumber": "42",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "lat": 52.5200,
            "lon": 13.4050,
            "workerAmountCents": 16000,
            "paymentToWorker": "bank",
            "employerType": "business"
        }
        
        headers = self.get_auth_headers("employer")
        success, status, data, rt = await self.make_request("POST", "/jobs", complete_job, headers)
        
        if success:
            # Verify all fields are present and valid
            required_fields = ["id", "title", "category", "startAt", "endAt", "address", "workerAmountCents"]
            all_fields_present = all(field in data for field in required_fields)
            
            # Verify timestamp format
            start_time = data.get("startAt", "")
            valid_iso_format = start_time.endswith("Z") and "T" in start_time
            
            self.log_test("Data Consistency - Required Fields", all_fields_present, 
                         f"All required fields present: {all_fields_present}", rt)
            self.log_test("Data Consistency - ISO Format", valid_iso_format, 
                         f"Valid ISO timestamp: {start_time}", rt)
        else:
            self.log_test("Data Consistency - Job Creation", success, 
                         f"Status: {status}, Error: {data}", rt)
        
        # Test 2: Verify Base64 data integrity
        if self.test_documents.get("pdf"):
            worker_id = self.test_users["worker"]["userId"]
            doc_id = self.test_documents["pdf"]
            worker_headers = self.get_auth_headers("worker")
            
            success, status, data, rt = await self.make_request("GET", f"/profiles/worker/{worker_id}/documents/{doc_id}", headers=worker_headers)
            
            if success:
                returned_data = data.get("data", "")
                try:
                    # Try to decode Base64 to verify integrity
                    decoded = base64.b64decode(returned_data)
                    is_valid_b64 = True
                except:
                    is_valid_b64 = False
                
                self.log_test("Data Consistency - Base64 Integrity", is_valid_b64, 
                             f"Base64 data is valid and decodable: {is_valid_b64}", rt)
            else:
                self.log_test("Data Consistency - Document Retrieval", success, 
                             f"Status: {status}", rt)
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🚨 UMFASSENDE SYSTEM-PRÜFUNG - FINAL RESULTS")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL STATISTICS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # Performance Summary
        if self.performance_metrics:
            print(f"\n⚡ PERFORMANCE METRICS:")
            for endpoint, time_ms in self.performance_metrics.items():
                status = "✅" if time_ms < 500 else "⚠️" if time_ms < 1000 else "❌"
                print(f"   {endpoint}: {time_ms:.0f}ms {status}")
        
        # Failed Tests Details
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print(f"\n❌ FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"   • {result['test']}")
                if result['details']:
                    print(f"     {result['details']}")
        
        # Critical Features Summary
        print(f"\n🎯 CRITICAL FEATURES STATUS:")
        
        categories = [
            ("New Categories Integration", ["Worker Profile - Friseur Category", "Job Creation - Kosmetik Category", "Job Creation - DJ Hochzeits-DJ"]),
            ("ISO Timestamps", ["ISO Timestamp Storage", "ISO Job in Employer List"]),
            ("Document System", ["PDF Document Upload", "Document Download", "Document Deletion"]),
            ("Employer Public View", ["Employer Public View Access"]),
            ("Review System", ["Create Review", "Get Worker Reviews"]),
            ("Backend Filters", ["Backend Filter - Both Formats"]),
            ("Performance", ["Performance - Root Endpoint", "Performance - Health Check"])
        ]
        
        for category, test_names in categories:
            category_tests = [r for r in self.test_results if any(name in r["test"] for name in test_names)]
            if category_tests:
                category_passed = sum(1 for r in category_tests if r["success"])
                category_total = len(category_tests)
                status = "✅" if category_passed == category_total else "⚠️" if category_passed > 0 else "❌"
                print(f"   {category}: {category_passed}/{category_total} {status}")
        
        print("\n" + "="*80)
        
        return success_rate >= 80  # Consider 80%+ as overall success

async def main():
    """Run comprehensive backend testing"""
    print("🚨 UMFASSENDE SYSTEM-PRÜFUNG - Backend Testing Suite")
    print("Testing all 7 critical features implemented today")
    print("Backend URL:", BACKEND_URL)
    print("="*80)
    
    async with BackendTester() as tester:
        # Run all test suites
        await tester.test_backend_health()
        await tester.create_test_users()
        await tester.test_new_categories_integration()
        await tester.test_iso_timestamps()
        await tester.test_document_system()
        await tester.test_employer_public_view()
        await tester.test_review_system()
        await tester.test_backend_filters()
        await tester.test_performance_stability()
        await tester.test_data_consistency()
        
        # Print final summary
        overall_success = tester.print_summary()
        
        return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)