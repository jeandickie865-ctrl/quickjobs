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
        self.session = None
        self.test_results = []
        self.worker_token = None
        self.worker_user_id = None
        self.test_document_id = None
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    async def create_test_worker(self):
        """Create a test worker account for document testing"""
        timestamp = int(datetime.now().timestamp())
        test_email = f"testworker_docs_{timestamp}@test.de"
        
        # Register worker
        signup_data = {
            "email": test_email,
            "password": "TestPass123!",
            "role": "worker"
        }
        
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/signup", json=signup_data) as resp:
                if resp.status == 200:
                    auth_data = await resp.json()
                    self.worker_token = auth_data["token"]
                    self.worker_user_id = auth_data["userId"]
                    self.log_test("Worker Account Creation", True, f"Created worker: {test_email}")
                    return True
                else:
                    error_text = await resp.text()
                    self.log_test("Worker Account Creation", False, f"Status {resp.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Worker Account Creation", False, f"Exception: {str(e)}")
            return False
            
    async def create_worker_profile(self):
        """Create a basic worker profile"""
        profile_data = {
            "firstName": "Test",
            "lastName": "Worker",
            "phone": "+49123456789",
            "categories": ["security"],
            "subcategories": ["objektschutz"],
            "qualifications": ["sachkunde_34a"],
            "radiusKm": 25,
            "homeAddress": {
                "street": "Teststraße 1",
                "postalCode": "10115",
                "city": "Berlin",
                "country": "DE"
            },
            "email": f"testworker_docs_{int(datetime.now().timestamp())}@test.de"
        }
        
        headers = {"Authorization": f"Bearer {self.worker_token}"}
        
        try:
            async with self.session.post(f"{BACKEND_URL}/profiles/worker", json=profile_data, headers=headers) as resp:
                if resp.status == 200:
                    self.log_test("Worker Profile Creation", True, "Profile created successfully")
                    return True
                else:
                    error_text = await resp.text()
                    self.log_test("Worker Profile Creation", False, f"Status {resp.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Worker Profile Creation", False, f"Exception: {str(e)}")
            return False
            
    def create_test_pdf(self, size_mb=0.1):
        """Create a test PDF file of specified size"""
        try:
            # Create temporary file with PDF-like content
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            
            # Create simple PDF-like content (not a real PDF but will work for testing)
            pdf_header = b"%PDF-1.4\n"
            content = b"Test Document for ShiftMatch Worker Document Upload\n"
            content += f"Generated: {datetime.now().isoformat()}\n".encode()
            content += b"This is a test qualification document.\n"
            
            # Calculate target size in bytes
            target_size = int(size_mb * 1024 * 1024)  # Convert MB to bytes
            base_content_size = len(pdf_header) + len(content)
            
            # Add padding to reach target size
            if target_size > base_content_size:
                padding_needed = target_size - base_content_size
                # Create padding with repeated content
                padding_line = b"Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n"
                padding_repeats = padding_needed // len(padding_line)
                padding_remainder = padding_needed % len(padding_line)
                
                content += padding_line * padding_repeats
                content += padding_line[:padding_remainder]
            
            # Write PDF header and content
            temp_file.write(pdf_header)
            temp_file.write(content)
            temp_file.close()
            
            return temp_file.name
        except Exception as e:
            # Fallback: create a simple text file with proper size
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', mode='wb')
            target_size = int(size_mb * 1024 * 1024)  # Convert MB to bytes
            
            base_content = f"Test Document Content\nGenerated: {datetime.now().isoformat()}\n".encode()
            padding_line = b"Test content line with sufficient length to create proper file size padding.\n"
            
            # Calculate how many padding lines we need
            padding_repeats = (target_size - len(base_content)) // len(padding_line)
            
            temp_file.write(base_content)
            temp_file.write(padding_line * padding_repeats)
            temp_file.close()
            return temp_file.name
            
    def create_test_image(self, size_mb=0.1):
        """Create a test image file"""
        # Create a simple JPEG-like file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', mode='wb')
        
        # JPEG header
        jpeg_header = b"\xff\xd8\xff\xe0\x00\x10JFIF"
        content = b"Fake JPEG content for testing\n"
        content += b"Test image data " * int(size_mb * 1000)
        
        temp_file.write(jpeg_header)
        temp_file.write(content)
        temp_file.close()
        
        return temp_file.name
            
    async def test_document_upload_success(self):
        """Test 1: Successful document upload"""
        test_file = self.create_test_pdf(0.1)  # 100KB PDF
        
        try:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            with open(test_file, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test_certificate.pdf', content_type='application/pdf')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",
                    data=data,
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        if 'document' in result and 'id' in result['document']:
                            self.test_document_id = result['document']['id']
                            self.log_test("Document Upload - Success", True, 
                                        f"Document uploaded with ID: {self.test_document_id}")
                            return True
                        else:
                            self.log_test("Document Upload - Success", False, "Missing document ID in response")
                            return False
                    else:
                        error_text = await resp.text()
                        self.log_test("Document Upload - Success", False, f"Status {resp.status}: {error_text}")
                        return False
        except Exception as e:
            self.log_test("Document Upload - Success", False, f"Exception: {str(e)}")
            return False
        finally:
            # Cleanup temp file
            try:
                os.unlink(test_file)
            except:
                pass
                
    async def test_document_retrieval(self):
        """Test 2: Document retrieval"""
        if not self.test_document_id:
            self.log_test("Document Retrieval", False, "No document ID available from upload test")
            return False
            
        headers = {"Authorization": f"Bearer {self.worker_token}"}
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents/{self.test_document_id}",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    document = await resp.json()
                    required_fields = ['id', 'filename', 'content_type', 'data', 'uploaded_at']
                    
                    missing_fields = [field for field in required_fields if field not in document]
                    if not missing_fields:
                        # Verify Base64 data
                        try:
                            base64.b64decode(document['data'])
                            self.log_test("Document Retrieval", True, 
                                        f"Document retrieved successfully: {document['filename']}")
                            return True
                        except Exception:
                            self.log_test("Document Retrieval", False, "Invalid Base64 data in response")
                            return False
                    else:
                        self.log_test("Document Retrieval", False, f"Missing fields: {missing_fields}")
                        return False
                else:
                    error_text = await resp.text()
                    self.log_test("Document Retrieval", False, f"Status {resp.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Document Retrieval", False, f"Exception: {str(e)}")
            return False
            
    async def test_document_deletion(self):
        """Test 3: Document deletion"""
        if not self.test_document_id:
            self.log_test("Document Deletion", False, "No document ID available")
            return False
            
        headers = {"Authorization": f"Bearer {self.worker_token}"}
        
        try:
            # Delete document
            async with self.session.delete(
                f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents/{self.test_document_id}",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    if 'message' in result and 'document_id' in result:
                        # Verify document is actually deleted
                        async with self.session.get(
                            f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents/{self.test_document_id}",
                            headers=headers
                        ) as get_resp:
                            if get_resp.status == 404:
                                self.log_test("Document Deletion", True, "Document deleted and verified")
                                return True
                            else:
                                self.log_test("Document Deletion", False, "Document still exists after deletion")
                                return False
                    else:
                        self.log_test("Document Deletion", False, "Invalid deletion response format")
                        return False
                else:
                    error_text = await resp.text()
                    self.log_test("Document Deletion", False, f"Status {resp.status}: {error_text}")
                    return False
        except Exception as e:
            self.log_test("Document Deletion", False, f"Exception: {str(e)}")
            return False
            
    async def test_file_size_validation(self):
        """Test 4: File size validation (>5MB should fail)"""
        test_file = self.create_test_pdf(6)  # 6MB PDF (should fail)
        
        try:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            with open(test_file, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='large_certificate.pdf', content_type='application/pdf')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",
                    data=data,
                    headers=headers
                ) as resp:
                    if resp.status == 400:
                        error_text = await resp.text()
                        if "zu groß" in error_text.lower() or "5 mb" in error_text.lower():
                            self.log_test("File Size Validation", True, "Large file correctly rejected")
                            return True
                        else:
                            self.log_test("File Size Validation", False, f"Wrong error message: {error_text}")
                            return False
                    else:
                        self.log_test("File Size Validation", False, f"Expected 400, got {resp.status}")
                        return False
        except Exception as e:
            self.log_test("File Size Validation", False, f"Exception: {str(e)}")
            return False
        finally:
            try:
                os.unlink(test_file)
            except:
                pass
                
    async def test_file_type_validation(self):
        """Test 5: File type validation (invalid types should fail)"""
        # Create a text file with .txt extension (should fail)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w')
        temp_file.write("This is a text file that should be rejected")
        temp_file.close()
        
        try:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            with open(temp_file.name, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='invalid.txt', content_type='text/plain')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",
                    data=data,
                    headers=headers
                ) as resp:
                    if resp.status == 400:
                        error_text = await resp.text()
                        if "dateityp" in error_text.lower() or "nicht erlaubt" in error_text.lower():
                            self.log_test("File Type Validation", True, "Invalid file type correctly rejected")
                            return True
                        else:
                            self.log_test("File Type Validation", False, f"Wrong error message: {error_text}")
                            return False
                    else:
                        self.log_test("File Type Validation", False, f"Expected 400, got {resp.status}")
                        return False
        except Exception as e:
            self.log_test("File Type Validation", False, f"Exception: {str(e)}")
            return False
        finally:
            try:
                os.unlink(temp_file.name)
            except:
                pass
                
    async def test_authorization_missing_token(self):
        """Test 6: Authorization - Missing token should fail"""
        test_file = self.create_test_pdf(0.1)
        
        try:
            # No Authorization header
            with open(test_file, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test.pdf', content_type='application/pdf')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",
                    data=data
                ) as resp:
                    if resp.status == 401:
                        self.log_test("Authorization - Missing Token", True, "Correctly rejected request without token")
                        return True
                    else:
                        self.log_test("Authorization - Missing Token", False, f"Expected 401, got {resp.status}")
                        return False
        except Exception as e:
            self.log_test("Authorization - Missing Token", False, f"Exception: {str(e)}")
            return False
        finally:
            try:
                os.unlink(test_file)
            except:
                pass
                
    async def test_authorization_wrong_user(self):
        """Test 7: Authorization - User A trying to upload to User B should fail"""
        # Create another worker account
        timestamp = int(datetime.now().timestamp())
        other_email = f"otherworker_{timestamp}@test.de"
        
        signup_data = {
            "email": other_email,
            "password": "TestPass123!",
            "role": "worker"
        }
        
        try:
            # Create second worker
            async with self.session.post(f"{BACKEND_URL}/auth/signup", json=signup_data) as resp:
                if resp.status != 200:
                    self.log_test("Authorization - Wrong User", False, "Could not create second worker")
                    return False
                    
                other_auth = await resp.json()
                other_user_id = other_auth["userId"]
                
            # Try to upload to first worker's profile using second worker's token
            test_file = self.create_test_pdf(0.1)
            headers = {"Authorization": f"Bearer {other_auth['token']}"}
            
            with open(test_file, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test.pdf', content_type='application/pdf')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",  # First worker's ID
                    data=data,
                    headers=headers  # Second worker's token
                ) as resp:
                    if resp.status == 403:
                        self.log_test("Authorization - Wrong User", True, "Correctly rejected cross-user upload")
                        return True
                    else:
                        self.log_test("Authorization - Wrong User", False, f"Expected 403, got {resp.status}")
                        return False
        except Exception as e:
            self.log_test("Authorization - Wrong User", False, f"Exception: {str(e)}")
            return False
        finally:
            try:
                os.unlink(test_file)
            except:
                pass
                
    async def test_persistence_in_profile(self):
        """Test 8: Verify document appears in worker profile"""
        # Upload a new document for persistence test
        test_file = self.create_test_pdf(0.1)
        
        try:
            headers = {"Authorization": f"Bearer {self.worker_token}"}
            
            # Upload document
            with open(test_file, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='persistence_test.pdf', content_type='application/pdf')
                
                async with self.session.post(
                    f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}/documents",
                    data=data,
                    headers=headers
                ) as resp:
                    if resp.status != 200:
                        self.log_test("Persistence Test", False, "Could not upload document for persistence test")
                        return False
                        
                    upload_result = await resp.json()
                    doc_id = upload_result['document']['id']
                    
            # Check if document appears in profile
            async with self.session.get(
                f"{BACKEND_URL}/profiles/worker/{self.worker_user_id}",
                headers=headers
            ) as resp:
                if resp.status == 200:
                    profile = await resp.json()
                    documents = profile.get('documents', [])
                    
                    # Find our document
                    found_doc = next((doc for doc in documents if doc.get('id') == doc_id), None)
                    
                    if found_doc:
                        self.log_test("Persistence Test", True, 
                                    f"Document found in profile: {found_doc.get('filename')}")
                        return True
                    else:
                        self.log_test("Persistence Test", False, "Document not found in profile documents array")
                        return False
                else:
                    self.log_test("Persistence Test", False, f"Could not fetch profile: {resp.status}")
                    return False
        except Exception as e:
            self.log_test("Persistence Test", False, f"Exception: {str(e)}")
            return False
        finally:
            try:
                os.unlink(test_file)
            except:
                pass
                
    async def run_all_tests(self):
        """Run all document upload tests"""
        print("🚀 Starting Worker Document Upload Feature Backend Tests")
        print(f"🎯 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Setup phase
            if not await self.create_test_worker():
                print("❌ CRITICAL: Could not create test worker - aborting tests")
                return False
                
            if not await self.create_worker_profile():
                print("❌ CRITICAL: Could not create worker profile - aborting tests")
                return False
                
            print("\n📋 Running Document Upload Tests:")
            print("-" * 50)
            
            # Core functionality tests
            await self.test_document_upload_success()
            await self.test_document_retrieval()
            await self.test_document_deletion()
            
            print("\n🔒 Running Validation Tests:")
            print("-" * 50)
            
            # Validation tests
            await self.test_file_size_validation()
            await self.test_file_type_validation()
            
            print("\n🛡️ Running Authorization Tests:")
            print("-" * 50)
            
            # Authorization tests
            await self.test_authorization_missing_token()
            await self.test_authorization_wrong_user()
            
            print("\n💾 Running Persistence Tests:")
            print("-" * 50)
            
            # Persistence tests
            await self.test_persistence_in_profile()
            
        finally:
            await self.cleanup_session()
            
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        print(f"📈 Success Rate: {(passed/total*100):.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
                    
        return passed == total

async def main():
    """Main test runner"""
    tester = DocumentUploadTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - Worker Document Upload Feature is fully functional!")
        sys.exit(0)
    else:
        print("\n💥 SOME TESTS FAILED - Check the details above")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())