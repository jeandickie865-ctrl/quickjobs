# Job Matching Implementation - Vollständige Dokumentation

## 1. Matching Service (`matching_service.py`)

```python
"""
Job Matching Service
Implements worker-to-job matching logic with Haversine distance calculation
"""

from math import radians, sin, cos, asin, sqrt
from typing import Dict, Any


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    
    Returns:
        Distance in kilometers
    """
    # Convert to float and radians
    lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    
    # Earth radius in kilometers
    r = 6371
    
    # Differences
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    
    # Haversine formula
    a = sin(d_lat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon/2)**2
    c = 2 * asin(sqrt(a))
    
    return r * c


def match_worker_with_job(worker: Dict[str, Any], job: Dict[str, Any]) -> bool:
    """
    Check if a worker matches a job
    
    Matching Rules:
    1. Category (must be identical)
    2. Radius (Haversine distance)
    3. Required all tags (all must be present)
    4. Required any tags (at least one must be present if specified)
    """
    
    # 1. Category check (must be identical)
    if job.get("category") != worker.get("category"):
        return False
    
    # 2. Radius check (Haversine distance)
    try:
        worker_lat = float(worker.get("lat", 0))
        worker_lon = float(worker.get("lon", 0))
        job_lat = float(job.get("lat", 0))
        job_lon = float(job.get("lon", 0))
        worker_radius = float(worker.get("radius", 0))
        
        distance = haversine(worker_lat, worker_lon, job_lat, job_lon)
        
        if distance > worker_radius:
            return False
    except (ValueError, TypeError):
        return False
    
    # Normalize tags to lowercase
    job_tags = [t.lower() for t in job.get("tags", [])]
    req_all = [t.lower() for t in worker.get("tags_required_all", [])]
    req_any = [t.lower() for t in worker.get("tags_required_any", [])]
    
    # 3. Required all tags (all must be present in job)
    for tag in req_all:
        if tag not in job_tags:
            return False
    
    # 4. Required any tags (at least one must be present if specified)
    if len(req_any) > 0:
        if not any(tag in job_tags for tag in req_any):
            return False
    
    return True
```

## 2. Import in server.py

```python
# Am Anfang von server.py (nach anderen Imports)
from matching_service import match_worker_with_job
```

## 3. Endpoint in server.py

```python
@api_router.get("/jobs/matches/me", response_model=List[Job])
async def get_matched_jobs_for_me(
    authorization: Optional[str] = Header(None)
):
    """
    Get all jobs that match the current worker's profile
    
    Token-based: workerId is derived from authentication token
    No workerId accepted from client
    """
    # Get workerId from token (validates token)
    worker_id = await get_user_id_from_token(authorization)
    logger.info(f"✅ /jobs/matches/me called for worker: {worker_id}")
    
    # Load worker profile from database
    worker_profile = await db.profiles.find_one({"userId": worker_id})
    if not worker_profile:
        logger.error(f"❌ Worker profile not found for user {worker_id}")
        raise HTTPException(status_code=404, detail="Worker profile not found")
    
    logger.info(f"📋 Worker: category={worker_profile.get('category')}, radius={worker_profile.get('radius')} km")
    
    # Load all active jobs (status = 'open')
    all_jobs = await db.jobs.find({"status": "open"}).to_list(9999)
    logger.info(f"📊 Found {len(all_jobs)} open jobs to match against")
    
    # Apply matching logic
    matched_jobs = []
    for job in all_jobs:
        if match_worker_with_job(worker_profile, job):
            job.pop("_id", None)
            matched_jobs.append(Job(**job))
    
    logger.info(f"✅ Found {len(matched_jobs)} matching jobs for worker {worker_id}")
    return matched_jobs
```

## 4. Worker-Dokument Beispiel

```json
{
  "_id": "ObjectId(...)",
  "userId": "user_john_doe",
  "category": "Lagerhelfer",
  "lat": 52.520008,
  "lon": 13.404954,
  "radius": 25.0,
  "tags_required_all": ["Gabelstapler", "Schichtarbeit"],
  "tags_required_any": ["Lager", "Logistik"],
  
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+49123456789",
  "bio": "Erfahrener Lagerhelfer",
  "address": {
    "street": "Musterstraße 123",
    "city": "Berlin",
    "zip": "10115",
    "country": "Deutschland"
  },
  "availability": "sofort",
  "createdAt": "2025-11-27T10:00:00Z"
}
```

### Erforderliche Felder für Matching:

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `userId` | string | ✅ | User-ID aus Auth-System |
| `category` | string | ✅ | Jobkategorie (z.B. "Lagerhelfer") |
| `lat` | number | ✅ | Breitengrad (Dezimalgrad) |
| `lon` | number | ✅ | Längengrad (Dezimalgrad) |
| `radius` | number | ✅ | Maximale Entfernung in km |
| `tags_required_all` | array[string] | ❌ | Alle müssen vorhanden sein |
| `tags_required_any` | array[string] | ❌ | Mind. einer muss vorhanden sein |

## 5. Job-Dokument Beispiel

```json
{
  "_id": "ObjectId(...)",
  "id": "job_abc123",
  "employerId": "user_employer_456",
  "category": "Lagerhelfer",
  "lat": 52.530008,
  "lon": 13.394954,
  "tags": ["Gabelstapler", "Lager", "Schichtarbeit"],
  "status": "open",
  
  "title": "Lagerhelfer für Spätschicht gesucht",
  "description": "Wir suchen einen zuverlässigen Lagerhelfer...",
  "hourlyRate": 15.50,
  "currency": "EUR",
  "startAt": "2025-12-01T14:00:00Z",
  "endAt": "2025-12-01T22:00:00Z",
  "address": {
    "street": "Industriestraße 45",
    "city": "Berlin",
    "zip": "10245",
    "country": "Deutschland"
  },
  "timeMode": "fixed_time",
  "createdAt": "2025-11-27T09:00:00Z"
}
```

### Erforderliche Felder für Matching:

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `category` | string | ✅ | Jobkategorie (z.B. "Lagerhelfer") |
| `lat` | number | ✅ | Breitengrad (Dezimalgrad) |
| `lon` | number | ✅ | Längengrad (Dezimalgrad) |
| `tags` | array[string] | ❌ | Tags für Skills/Anforderungen |
| `status` | string | ✅ | Muss "open" sein für Matching |

## 6. API-Request Beispiel

### Request

```http
GET /api/jobs/matches/me HTTP/1.1
Host: api.shiftmatch.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response (Success)

```json
[
  {
    "id": "job_abc123",
    "employerId": "user_employer_456",
    "category": "Lagerhelfer",
    "title": "Lagerhelfer für Spätschicht gesucht",
    "description": "Wir suchen einen zuverlässigen Lagerhelfer...",
    "lat": 52.530008,
    "lon": 13.394954,
    "tags": ["Gabelstapler", "Lager", "Schichtarbeit"],
    "status": "open",
    "hourlyRate": 15.50,
    "currency": "EUR",
    "startAt": "2025-12-01T14:00:00Z",
    "endAt": "2025-12-01T22:00:00Z",
    "address": {
      "street": "Industriestraße 45",
      "city": "Berlin",
      "zip": "10245",
      "country": "Deutschland"
    },
    "timeMode": "fixed_time",
    "createdAt": "2025-11-27T09:00:00Z"
  },
  {
    "id": "job_def456",
    "employerId": "user_employer_789",
    "category": "Lagerhelfer",
    "title": "Aushilfe im Warenlager",
    ...
  }
]
```

### Response (No Matches)

```json
[]
```

### Response (Error: No Profile)

```json
{
  "detail": "Worker profile not found"
}
```
Status: 404

### Response (Error: Unauthorized)

```json
{
  "detail": "Invalid or expired token"
}
```
Status: 401

## 7. Matching-Logik Flussdiagramm

```
START
  ↓
[Token validieren] → FEHLER 401: Invalid token
  ↓
[Worker-Profil laden] → FEHLER 404: Profile not found
  ↓
[Alle offenen Jobs laden (status="open")]
  ↓
[Für jeden Job:]
  ↓
  [1. Kategorie-Check]
  job.category == worker.category? 
    NEIN → Nächster Job
    JA ↓
  [2. Distanz-Check]
  haversine(worker_lat, worker_lon, job_lat, job_lon) <= worker.radius?
    NEIN → Nächster Job
    JA ↓
  [3. Tags Required All Check]
  Alle worker.tags_required_all in job.tags?
    NEIN → Nächster Job
    JA ↓
  [4. Tags Required Any Check]
  Mind. ein worker.tags_required_any in job.tags?
    NEIN → Nächster Job
    JA ↓
  [✅ MATCH] → Zur Liste hinzufügen
  ↓
[Matched Jobs zurückgeben]
  ↓
END
```

## 8. Beispiel-Szenarien

### Szenario 1: Perfect Match ✅

**Worker:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.520008,
  "lon": 13.404954,
  "radius": 10.0,
  "tags_required_all": ["Gabelstapler"],
  "tags_required_any": ["Lager"]
}
```

**Job:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.525008,
  "lon": 13.404954,
  "tags": ["Gabelstapler", "Lager", "Schichtarbeit"],
  "status": "open"
}
```

**Ergebnis:** ✅ MATCH
- ✅ Kategorie: "Lagerhelfer" == "Lagerhelfer"
- ✅ Distanz: ~0.56 km < 10 km
- ✅ Required All: "Gabelstapler" ✓
- ✅ Required Any: "Lager" ✓

### Szenario 2: Zu weit entfernt ❌

**Worker:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.520008,
  "lon": 13.404954,
  "radius": 5.0
}
```

**Job:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.620008,
  "lon": 13.404954,
  "status": "open"
}
```

**Ergebnis:** ❌ NO MATCH
- ✅ Kategorie: Match
- ❌ Distanz: ~11.1 km > 5 km (FAIL)

### Szenario 3: Fehlender Required Tag ❌

**Worker:**
```json
{
  "category": "Lagerhelfer",
  "radius": 50.0,
  "tags_required_all": ["Gabelstapler", "Kranschein"]
}
```

**Job:**
```json
{
  "category": "Lagerhelfer",
  "tags": ["Gabelstapler", "Lager"],
  "status": "open"
}
```

**Ergebnis:** ❌ NO MATCH
- ✅ Kategorie: Match
- ✅ Distanz: OK
- ✅ "Gabelstapler" vorhanden
- ❌ "Kranschein" FEHLT (Required All FAIL)

## 9. Logging-Ausgabe

Bei einem erfolgreichen Request siehst du im Backend-Log:

```
2025-11-27 11:30:00,123 - INFO - ✅ /jobs/matches/me called for worker: user_john_doe
2025-11-27 11:30:00,125 - INFO - 📋 Worker: category=Lagerhelfer, radius=25.0 km
2025-11-27 11:30:00,145 - INFO - 📊 Found 12 open jobs to match against
2025-11-27 11:30:00,178 - INFO - ✅ Found 3 matching jobs for worker user_john_doe
```

## 10. Status

- ✅ `matching_service.py` - IMPLEMENTIERT
- ✅ Endpoint `/api/jobs/matches/me` - AKTIV
- ✅ Token-basierte Authentifizierung - IMPLEMENTIERT
- ✅ Haversine-Distanzberechnung - FUNKTIONIERT
- ✅ Tag-Matching (case-insensitive) - FUNKTIONIERT
- ✅ Logging - AKTIVIERT (INFO-Level)
