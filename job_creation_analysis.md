# Job Creation API Analyse (POST /jobs)

**Datum:** 26. November 2025  
**Status:** ✅ **API FUNKTIONIERT KORREKT**

---

## 🎯 ZUSAMMENFASSUNG

Die Backend-API `POST /api/jobs` **funktioniert einwandfrei**. Der Test zeigt:
- ✅ Token-Authentifizierung funktioniert korrekt
- ✅ employerId wird korrekt aus dem Token extrahiert
- ✅ JobSchema Validierung funktioniert
- ✅ Job wird erfolgreich in MongoDB gespeichert
- ✅ Koordinaten (lat/lon) werden korrekt verarbeitet
- ✅ paymentToWorker wird korrekt gespeichert

---

## 📡 API ENDPOINT DETAILS

### **Route:** `POST /api/jobs`
**Datei:** `/app/backend/server.py` (Zeile 720-748)

```python
@api_router.post("/jobs", response_model=Job)
async def create_job(
    job_data: JobCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new job"""
    logger.info("Creating new job")
    
    employerId = await get_user_id_from_token(authorization)  # ✅ Token → userId
    
    # Create job document
    job_dict = job_data.dict()
    job_dict["id"] = f"job_{str(uuid.uuid4())}"
    job_dict["employerId"] = employerId  # ✅ employerId korrekt gesetzt
    job_dict["createdAt"] = datetime.utcnow().isoformat()
    
    # Convert nested Address to dict if needed
    if isinstance(job_dict.get("address"), Address):
        job_dict["address"] = job_dict["address"].dict()
    
    # Insert into MongoDB
    result = await db.jobs.insert_one(job_dict)
    
    # Fetch and return created job
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    created_job.pop("_id", None)
    
    logger.info(f"Job created: {job_dict['id']} by employer {employerId}")
    return Job(**created_job)
```

---

## 📋 JOBCREATE SCHEMA

**Datei:** `/app/backend/server.py` (Zeile 144-162)

```python
class JobCreate(BaseModel):
    employerType: str = "private"
    title: str                          # ✅ PFLICHT
    description: Optional[str] = None
    category: str                       # ✅ PFLICHT
    timeMode: str                       # ✅ PFLICHT
    startAt: Optional[str] = None
    endAt: Optional[str] = None
    hours: Optional[float] = None
    dueAt: Optional[str] = None
    address: Address                    # ✅ PFLICHT (Objekt)
    lat: Optional[float] = None         # ✅ Optional (für Geocoding)
    lon: Optional[float] = None         # ✅ Optional (für Geocoding)
    workerAmountCents: int              # ✅ PFLICHT
    paymentToWorker: str = "cash"       # ✅ Default: "cash"
    required_all_tags: List[str] = []
    required_any_tags: List[str] = []
    status: str = "open"
```

### **Pflichtfelder:**
1. `title` - String
2. `category` - String
3. `timeMode` - String ('fixed_time', 'hour_package', 'project')
4. `address` - Address Objekt mit {street, postalCode, city}
5. `workerAmountCents` - Integer (Centbeträge)

### **Optionale Felder:**
- `description` - String
- `startAt`, `endAt` - ISO DateTime Strings
- `hours` - Float
- `dueAt` - ISO DateTime String
- `lat`, `lon` - Float (Koordinaten für Radius-Matching)
- `paymentToWorker` - String (default: "cash")

---

## 🧪 TEST-ERGEBNISSE

### **Test Request:**

```json
POST http://localhost:8001/api/jobs
Authorization: Bearer token_1764185845.166279_3a286ec7
Content-Type: application/json

{
  "employerType": "private",
  "title": "Test Job",
  "description": "This is a test job",
  "category": "gastronomie",
  "timeMode": "fixed_time",
  "startAt": "2025-12-01T10:00:00Z",
  "endAt": "2025-12-01T18:00:00Z",
  "address": {
    "street": "Hauptstraße",
    "postalCode": "10115",
    "city": "Berlin"
  },
  "lat": 52.52,
  "lon": 13.405,
  "workerAmountCents": 5000,
  "paymentToWorker": "cash",
  "required_all_tags": ["kellnern"],
  "required_any_tags": [],
  "status": "open"
}
```

### **Test Response:**

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "job_c681575c-16a9-4afd-bbe1-b56ca80c2988",
  "employerId": "user_jobtest_test_de",  // ✅ Korrekt aus Token extrahiert
  "employerType": "private",
  "title": "Test Job",
  "description": "This is a test job",
  "category": "gastronomie",
  "timeMode": "fixed_time",
  "startAt": "2025-12-01T10:00:00Z",
  "endAt": "2025-12-01T18:00:00Z",
  "hours": null,
  "dueAt": null,
  "address": {
    "street": "Hauptstraße",
    "houseNumber": null,
    "postalCode": "10115",
    "city": "Berlin",
    "country": "DE"
  },
  "lat": 52.52,                         // ✅ Koordinaten korrekt gesetzt
  "lon": 13.405,                        // ✅ Koordinaten korrekt gesetzt
  "workerAmountCents": 5000,
  "paymentToWorker": "cash",            // ✅ paymentMethod korrekt gesetzt
  "required_all_tags": ["kellnern"],
  "required_any_tags": [],
  "status": "open",
  "matchedWorkerId": null,
  "createdAt": "2025-11-26T19:37:25.301732"
}
```

---

## ✅ VERIFIZIERTE PUNKTE

### 1. **employerId wird korrekt aus Token geladen** ✅
- Backend extrahiert User-ID aus Authorization Header
- Funktion: `get_user_id_from_token(authorization)`
- Ergebnis: `"employerId": "user_jobtest_test_de"`

### 2. **paymentMethod im Payload ankommt** ✅
- Frontend sendet: `"paymentToWorker": "cash"`
- Backend empfängt: `"paymentToWorker": "cash"`
- Im Response: `"paymentToWorker": "cash"`

### 3. **geocodingCoordinates gesetzt** ✅
- Frontend sendet: `"lat": 52.52, "lon": 13.405`
- Backend speichert: `"lat": 52.52, "lon": 13.405`
- Im Response: `"lat": 52.52, "lon": 13.405`

### 4. **Validierungs-Fehler** ✅
- **Keine** Validierungsfehler aufgetreten
- JobSchema akzeptiert alle Felder korrekt
- Pydantic Validierung funktioniert einwandfrei

### 5. **Request-Header korrekt** ✅
```http
Content-Type: application/json
Authorization: Bearer token_1764185845.166279_3a286ec7
```

### 6. **Backend-Logs** ✅
```
INFO:     127.0.0.1:47194 - "POST /api/jobs HTTP/1.1" 200 OK
```
Keine Fehler in Backend-Logs.

---

## 🔍 FRONTEND-ANALYSE

### **Frontend Code:** `/app/frontend/app/(employer)/jobs/create.tsx`

**Job-Erstellung Flow:**
1. User füllt Formular aus (Zeile 24-56)
2. Validierung durchgeführt (Zeile 69-103)
3. Job-Objekt erstellt (Zeile 185-207)
4. `addJob(job)` aufgerufen (Zeile 212)

**Frontend sendet korrekte Daten:**
```typescript
const job: Job = {
  id: 'job-' + Date.now().toString(),    // Frontend-seitige ID (wird überschrieben)
  employerId: user.id,                   // ✅ User ID aus AuthContext
  employerType: user.accountType === 'business' ? 'business' : 'private',
  title: title.trim(),
  description: description.trim() || '',
  category,
  timeMode,
  startAt: startAtIso,
  endAt: endAtIso,
  hours: hoursNumber,
  dueAt: dueAtIso,
  address: location,                     // ✅ Strukturierte Adresse
  lat: lat,                              // ✅ Koordinaten aus Geocoder
  lon: lon,                              // ✅ Koordinaten aus Geocoder
  workerAmountCents,
  paymentToWorker: paymentMethod,        // ✅ "cash", "bank", oder "paypal"
  required_all_tags: requiredAllTags,
  required_any_tags: requiredAnyTags,
  status: 'open',
  matchedWorkerId: undefined,
  createdAt: new Date().toISOString(),
};
```

### **Frontend API Call:** `/app/frontend/utils/jobStore.ts`

```typescript
export async function addJob(job: Job): Promise<void> {
  console.log('➕ addJob: Creating job', job.title);
  
  try {
    const headers = await getAuthHeaders();  // ✅ Authorization: Bearer ${token}
    
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers,                              // ✅ Content-Type + Authorization
      body: JSON.stringify(job),            // ✅ Job als JSON
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addJob: Failed', response.status, error);
      throw new Error(`Failed to create job: ${response.status}`);
    }
    
    const createdJob = await response.json();
    console.log('✅ addJob: Job created', createdJob.id);
  } catch (error) {
    console.error('❌ addJob: Error', error);
    throw error;
  }
}
```

---

## 🤔 MÖGLICHE FEHLERQUELLEN (WENN FEHLER AUFTRETEN)

Falls der User einen Fehler meldet, könnte es folgende Ursachen haben:

### 1. **Frontend-Validierung schlägt fehl**
**Zeile 99-103 in create.tsx:**
```typescript
if (!lat || !lon) {
  setError('Bitte wähle eine Adresse aus der Vorschlagsliste...');
  return;
}
```
- **Problem:** User hat Adresse manuell eingegeben ohne Geocoding
- **Lösung:** Adresse aus Autocomplete-Vorschlägen auswählen

### 2. **Token abgelaufen oder ungültig**
- Backend wirft 401 Unauthorized
- User muss sich neu anmelden

### 3. **Fehlende Pflichtfelder**
- title, category, timeMode, address, workerAmountCents
- Frontend sollte diese validieren (tut es bereits)

### 4. **Ungültige Daten-Typen**
- z.B. workerAmountCents als String statt Number
- Pydantic wirft Validation Error 422

### 5. **Backend nicht erreichbar**
- Network error im Frontend
- Backend-Service down

---

## 📊 BACKEND-LOGS ÜBERWACHEN

Um zukünftige Fehler zu diagnostizieren:

```bash
# Alle Job-Creation Logs
tail -f /var/log/supervisor/backend.out.log | grep "POST /api/jobs"

# Fehler-Logs
tail -f /var/log/supervisor/backend.err.log | grep -A 10 "jobs\|ValidationError\|422\|500"

# Alle Logs
tail -f /var/log/supervisor/backend.err.log
```

---

## ✅ FAZIT

**Die API funktioniert korrekt:**

1. ✅ Request-Body wird korrekt verarbeitet
2. ✅ Request-Header (Authorization) funktioniert
3. ✅ Backend-Validierung (JobSchema) akzeptiert alle Felder
4. ✅ employerId wird korrekt aus Token extrahiert
5. ✅ paymentMethod (paymentToWorker) kommt korrekt an
6. ✅ geocodingCoordinates (lat/lon) werden gesetzt
7. ✅ Job wird erfolgreich in MongoDB gespeichert
8. ✅ Keine Fehler in Backend-Logs

**Falls User einen Fehler meldet:**
- Wahrscheinlich Frontend-Validierung (fehlende Koordinaten)
- Oder Token-Problem (abgelaufen/ungültig)
- Oder Network-Error

**Empfehlung:** User bitten, Frontend-Konsole-Logs zu teilen, um genauen Fehler zu identifizieren.

---

**Test durchgeführt am:** 26.11.2025, 19:37 UTC  
**Backend-Version:** FastAPI mit MongoDB  
**Test-Status:** ✅ ERFOLGREICH
