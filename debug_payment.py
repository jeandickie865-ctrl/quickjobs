#!/usr/bin/env python3
"""
Debug script to check payment status and chat unlock
"""

import asyncio
import httpx
from datetime import datetime

BACKEND_URL = "https://shiftmatch-dev.preview.emergentagent.com/api"

async def debug_payment_status():
    client = httpx.AsyncClient(timeout=30.0)
    
    try:
        # Create test users
        timestamp = int(datetime.now().timestamp())
        worker_email = f"debugworker_{timestamp}@test.de"
        employer_email = f"debugemployer_{timestamp}@test.de"
        password = "Test123!"
        
        # Register users
        print("🔧 Creating test users...")
        worker_resp = await client.post(f"{BACKEND_URL}/auth/signup", json={
            "email": worker_email, "password": password, "role": "worker"
        })
        employer_resp = await client.post(f"{BACKEND_URL}/auth/signup", json={
            "email": employer_email, "password": password, "role": "employer"
        })
        
        worker_data = worker_resp.json()
        employer_data = employer_resp.json()
        
        print(f"✅ Users created: {worker_data['userId']}, {employer_data['userId']}")
        
        # Create worker profile
        worker_headers = {"Authorization": f"Bearer {worker_data['token']}"}
        profile_resp = await client.post(f"{BACKEND_URL}/profiles/worker", json={
            "firstName": "Debug", "lastName": "Worker", "phone": "+49123456789",
            "email": worker_email, "categories": ["sicherheit"], "radiusKm": 25,
            "homeAddress": {"street": "Test 1", "postalCode": "10115", "city": "Berlin", "country": "DE"},
            "homeLat": 52.5200, "homeLon": 13.4050
        }, headers=worker_headers)
        
        print("✅ Worker profile created")
        
        # Create job
        employer_headers = {"Authorization": f"Bearer {employer_data['token']}"}
        job_resp = await client.post(f"{BACKEND_URL}/jobs", json={
            "title": "Debug Job", "category": "sicherheit", "timeMode": "fixed_time",
            "date": "2025-12-15", "start_at": "18:00", "end_at": "22:00",
            "address": {"street": "Test 1", "postalCode": "10785", "city": "Berlin", "country": "DE"},
            "lat": 52.5096, "lon": 13.3765, "workerAmountCents": 15000
        }, headers=employer_headers)
        
        job_data = job_resp.json()
        print(f"✅ Job created: {job_data['id']}")
        
        # Create application
        app_resp = await client.post(f"{BACKEND_URL}/applications", json={
            "jobId": job_data['id']
        }, headers=worker_headers)
        
        app_data = app_resp.json()
        print(f"✅ Application created: {app_data['id']}")
        
        # Check initial application status
        print(f"📊 Initial application status:")
        print(f"   status: {app_data.get('status')}")
        print(f"   paymentStatus: {app_data.get('paymentStatus')}")
        print(f"   chatUnlocked: {app_data.get('chatUnlocked')}")
        print(f"   isPaid: {app_data.get('isPaid')}")
        
        # Accept application
        accept_resp = await client.put(f"{BACKEND_URL}/applications/{app_data['id']}/accept", 
                                     headers=employer_headers)
        
        accepted_data = accept_resp.json()
        print(f"✅ Application accepted")
        print(f"📊 After acceptance:")
        print(f"   status: {accepted_data.get('status')}")
        print(f"   paymentStatus: {accepted_data.get('paymentStatus')}")
        print(f"   chatUnlocked: {accepted_data.get('chatUnlocked')}")
        print(f"   isPaid: {accepted_data.get('isPaid')}")
        
        # Pay for application
        pay_resp = await client.post(f"{BACKEND_URL}/applications/{app_data['id']}/pay", 
                                   headers=employer_headers)
        
        if pay_resp.status_code == 200:
            paid_data = pay_resp.json()
            print(f"✅ Payment successful")
            print(f"📊 After payment:")
            print(f"   status: {paid_data.get('status')}")
            print(f"   paymentStatus: {paid_data.get('paymentStatus')}")
            print(f"   chatUnlocked: {paid_data.get('chatUnlocked')}")
            print(f"   isPaid: {paid_data.get('isPaid')}")
        else:
            print(f"❌ Payment failed: {pay_resp.status_code} - {pay_resp.text}")
        
        # Get fresh application data
        fresh_resp = await client.get(f"{BACKEND_URL}/applications/{app_data['id']}", 
                                    headers=worker_headers)
        fresh_data = fresh_resp.json()
        print(f"📊 Fresh application data:")
        print(f"   status: {fresh_data.get('status')}")
        print(f"   paymentStatus: {fresh_data.get('paymentStatus')}")
        print(f"   chatUnlocked: {fresh_data.get('chatUnlocked')}")
        print(f"   isPaid: {fresh_data.get('isPaid')}")
        
        # Try to create a chat message
        print("💬 Attempting to create chat message...")
        msg_resp = await client.post(f"{BACKEND_URL}/chat/messages", json={
            "applicationId": app_data['id'],
            "text": "Debug test message"
        }, headers=employer_headers)
        
        if msg_resp.status_code == 200:
            print("✅ Chat message created successfully!")
        else:
            print(f"❌ Chat message failed: {msg_resp.status_code} - {msg_resp.text}")
        
        # Test unread count
        print("📊 Testing unread count...")
        count_resp = await client.get(f"{BACKEND_URL}/chat/unread-count/{app_data['id']}", 
                                    headers=worker_headers)
        
        if count_resp.status_code == 200:
            count_data = count_resp.json()
            print(f"✅ Unread count: {count_data.get('unreadCount', 0)}")
        else:
            print(f"❌ Unread count failed: {count_resp.status_code} - {count_resp.text}")
        
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(debug_payment_status())