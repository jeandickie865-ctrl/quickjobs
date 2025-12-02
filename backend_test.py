#!/usr/bin/env python3
"""
Backend API Testing für ShiftMatch App
Testet den /api/jobs Endpoint wie in der Review-Anfrage spezifiziert
"""

import requests
import json
import time
from datetime import datetime

# Backend URL aus frontend/.env
BACKEND_URL = "https://shiftmatch-1.preview.emergentagent.com/api"

def test_jobs_endpoint():
    """
    Testet den Backend-Endpoint /api/jobs um zu verifizieren, 
    dass er alle offenen Jobs zurückgibt.
    
    Test-Szenario:
    1. Erstelle einen Worker-Token (falls nicht vorhanden)
    2. Rufe GET /api/jobs mit diesem Token auf
    3. Verifiziere, dass eine Liste von Jobs zurückgegeben wird
    4. Stelle sicher, dass der Status 200 ist
    """
    
    print("🚀 BACKEND TEST: /api/jobs Endpoint")
    print("=" * 50)
    
    # Schritt 1: Worker-Token erstellen
    print("\n📝 Schritt 1: Worker-Token erstellen...")
    
    # Eindeutige E-Mail für Test
    timestamp = int(time.time())
    test_email = f"testworker_{timestamp}@test.de"
    test_password = "Test123!"
    
    # Worker registrieren
    signup_data = {
        "email": test_email,
        "password": test_password,
        "role": "worker"
    }
    
    try:
        signup_response = requests.post(
            f"{BACKEND_URL}/auth/signup",
            json=signup_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   📤 POST /auth/signup: {signup_response.status_code}")
        
        if signup_response.status_code == 200:
            signup_result = signup_response.json()
            token = signup_result.get("token")
            user_id = signup_result.get("userId")
            print(f"   ✅ Worker registriert: {test_email}")
            print(f"   🔑 Token erhalten: {token[:20]}...")
            print(f"   👤 User ID: {user_id}")
        else:
            print(f"   ❌ Signup fehlgeschlagen: {signup_response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Signup Error: {e}")
        return False
    
    # Schritt 2: GET /api/jobs mit Token aufrufen
    print(f"\n🎯 Schritt 2: GET /api/jobs mit Worker-Token aufrufen...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        jobs_response = requests.get(
            f"{BACKEND_URL}/jobs",
            headers=headers,
            timeout=10
        )
        
        print(f"   📤 GET /api/jobs: {jobs_response.status_code}")
        
        # Schritt 3: Response validieren
        print(f"\n✅ Schritt 3: Response validieren...")
        
        # Status Code prüfen
        if jobs_response.status_code == 200:
            print(f"   ✅ Status: 200 OK")
        else:
            print(f"   ❌ Status: {jobs_response.status_code} (erwartet: 200)")
            print(f"   📄 Response: {jobs_response.text}")
            return False
        
        # JSON Response prüfen
        try:
            jobs_data = jobs_response.json()
            print(f"   ✅ JSON Response erhalten")
            
            # Array prüfen
            if isinstance(jobs_data, list):
                print(f"   ✅ Response ist JSON-Array")
                print(f"   📊 Anzahl Jobs: {len(jobs_data)}")
                
                # Beispiel-Job anzeigen (falls vorhanden)
                if len(jobs_data) > 0:
                    first_job = jobs_data[0]
                    print(f"   📋 Beispiel-Job:")
                    print(f"      - ID: {first_job.get('id', 'N/A')}")
                    print(f"      - Title: {first_job.get('title', 'N/A')}")
                    print(f"      - Status: {first_job.get('status', 'N/A')}")
                    print(f"      - Date: {first_job.get('date', 'N/A')}")
                    print(f"      - Category: {first_job.get('category', 'N/A')}")
                else:
                    print(f"   ℹ️  Keine Jobs gefunden (leeres Array)")
                
            else:
                print(f"   ❌ Response ist kein Array: {type(jobs_data)}")
                return False
                
        except json.JSONDecodeError as e:
            print(f"   ❌ Ungültiges JSON: {e}")
            print(f"   📄 Raw Response: {jobs_response.text}")
            return False
        
        # Schritt 4: Erwartetes Ergebnis bestätigen
        print(f"\n🎉 Schritt 4: Test erfolgreich!")
        print(f"   ✅ Status: 200 OK")
        print(f"   ✅ Body: JSON-Array mit {len(jobs_data)} Job-Objekten")
        print(f"   ✅ Keine Fehler")
        
        return True
        
    except Exception as e:
        print(f"   ❌ GET /api/jobs Error: {e}")
        return False

def test_backend_health():
    """Teste grundlegende Backend-Erreichbarkeit"""
    print("\n🏥 Backend Health Check...")
    
    try:
        health_response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"   📤 GET /api/health: {health_response.status_code}")
        
        if health_response.status_code == 200:
            print(f"   ✅ Backend erreichbar")
            return True
        else:
            print(f"   ❌ Backend nicht erreichbar: {health_response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Health Check Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 SHIFTMATCH BACKEND API TEST")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"⏰ Test Zeit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Health Check
    if not test_backend_health():
        print("\n❌ Backend nicht erreichbar - Test abgebrochen")
        exit(1)
    
    # Haupttest
    success = test_jobs_endpoint()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ALLE TESTS BESTANDEN!")
        print("✅ /api/jobs Endpoint funktioniert korrekt")
    else:
        print("❌ TEST FEHLGESCHLAGEN!")
        print("❌ /api/jobs Endpoint hat Probleme")
    
    print("=" * 50)