#!/usr/bin/env python3
"""
Debug test to understand the backend API issues
"""

import asyncio
import httpx
import json

BACKEND_URL = "https://shiftmatch-dark.preview.emergentagent.com/api"

async def debug_test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("🔍 DEBUGGING BACKEND API ISSUES")
        print("=" * 50)
        
        # Test 1: Login existing user
        print("\n1. Testing login with existing user...")
        login_data = {
            "email": "max.mueller@test.de",
            "password": "TestPass123!"
        }
        
        response = await client.post(f"{BACKEND_URL}/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Login data: {data}")
            worker_token = data.get("userId")
            worker_user_id = data.get("userId")
            print(f"Worker token: {worker_token}")
            print(f"Worker user_id: {worker_user_id}")
            
            # Test 2: Get worker profile
            print(f"\n2. Testing get worker profile...")
            headers = {"Authorization": f"Bearer {worker_token}"}
            response = await client.get(f"{BACKEND_URL}/profiles/worker/{worker_user_id}", headers=headers)
            print(f"Get profile response: {response.status_code}")
            if response.status_code == 200:
                profile_data = response.json()
                print(f"Profile data: {json.dumps(profile_data, indent=2)}")
            else:
                print(f"Error: {response.text}")
        
        # Test 3: Login employer
        print(f"\n3. Testing employer login...")
        login_data = {
            "email": "anna.schmidt@firma.de",
            "password": "SicherPass456!"
        }
        
        response = await client.post(f"{BACKEND_URL}/auth/login", json=login_data)
        print(f"Employer login response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Employer login data: {data}")
            employer_token = data.get("userId")
            employer_user_id = data.get("userId")
            
            # Test 4: Get employer profile
            print(f"\n4. Testing get employer profile...")
            headers = {"Authorization": f"Bearer {employer_token}"}
            response = await client.get(f"{BACKEND_URL}/profiles/employer/{employer_user_id}", headers=headers)
            print(f"Get employer profile response: {response.status_code}")
            if response.status_code == 200:
                profile_data = response.json()
                print(f"Employer profile data: {json.dumps(profile_data, indent=2)}")
            else:
                print(f"Error: {response.text}")
            
            # Test 5: Get employer jobs
            print(f"\n5. Testing get employer jobs...")
            response = await client.get(f"{BACKEND_URL}/jobs/employer/{employer_user_id}", headers=headers)
            print(f"Get employer jobs response: {response.status_code}")
            if response.status_code == 200:
                jobs_data = response.json()
                print(f"Employer jobs: {len(jobs_data)} jobs found")
                if jobs_data:
                    print(f"First job: {jobs_data[0].get('title')}")
            else:
                print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(debug_test())