# Worker Profile Structure for Job Matching

## Required Fields for Matching

A Worker profile document in the `profiles` collection must have the following structure for the matching algorithm to work:

```json
{
  "userId": "user_john_doe",
  "category": "Lagerhelfer",
  "lat": 52.520008,
  "lon": 13.404954,
  "radius": 25.0,
  "tags_required_all": ["Gabelstapler", "Schichtarbeit"],
  "tags_required_any": ["Lager", "Logistik"],
  
  // ... other profile fields ...
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+49123456789",
  "address": {
    "street": "Musterstraße 123",
    "city": "Berlin",
    "zip": "10115"
  }
}
```

## Field Descriptions

### Core Matching Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | ✅ | User ID from auth system |
| `category` | String | ✅ | Job category (must match exactly with job category) |
| `lat` | Float | ✅ | Latitude of worker's location |
| `lon` | Float | ✅ | Longitude of worker's location |
| `radius` | Float | ✅ | Maximum distance in kilometers the worker is willing to travel |
| `tags_required_all` | Array[String] | ❌ | All these tags MUST be present in the job |
| `tags_required_any` | Array[String] | ❌ | At least ONE of these tags must be present in the job |

### Example Categories

Common categories in ShiftMatch:
- `"Lagerhelfer"` - Warehouse worker
- `"Produktionshelfer"` - Production worker
- `"Fahrer"` - Driver
- `"Reinigungskraft"` - Cleaning staff
- `"Monteur"` - Assembly worker
- `"Bauhelfer"` - Construction worker

### Example Tags

Common tags for matching:
- Skills: `"Gabelstapler"`, `"Führerschein B"`, `"Kranschein"`
- Work types: `"Schichtarbeit"`, `"Nachtschicht"`, `"Wochenende"`
- Industries: `"Lager"`, `"Logistik"`, `"Produktion"`, `"Bau"`
- Requirements: `"Erfahrung"`, `"Einarbeitung möglich"`

## Job Structure for Matching

A Job document must have these fields for matching:

```json
{
  "id": "job_abc123",
  "employerId": "user_employer_123",
  "category": "Lagerhelfer",
  "lat": 52.530008,
  "lon": 13.394954,
  "tags": ["Gabelstapler", "Lager", "Schichtarbeit"],
  "status": "open",
  
  // ... other job fields ...
  "title": "Lagerhelfer gesucht",
  "description": "Wir suchen...",
  "hourlyRate": 15.50,
  "startAt": "2025-01-15T08:00:00Z"
}
```

## Matching Logic

### 1. Category Match (Required)
```python
job["category"] == worker["category"]
```
Must be **exact match** (case-sensitive).

### 2. Radius Check (Required)
```python
distance = haversine(worker["lat"], worker["lon"], job["lat"], job["lon"])
distance <= worker["radius"]
```
Uses Haversine formula to calculate great-circle distance.

### 3. Required All Tags (Optional)
```python
# If worker has tags_required_all, ALL must be in job
for tag in worker["tags_required_all"]:
    if tag.lower() not in [t.lower() for t in job["tags"]]:
        return False
```
Case-insensitive comparison.

### 4. Required Any Tags (Optional)
```python
# If worker has tags_required_any, at least ONE must be in job
if len(worker["tags_required_any"]) > 0:
    if not any(tag.lower() in [t.lower() for t in job["tags"]] 
               for tag in worker["tags_required_any"]):
        return False
```
Case-insensitive comparison.

## Example Matching Scenarios

### Scenario 1: Perfect Match ✅

**Worker:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.520008,
  "lon": 13.404954,
  "radius": 10.0,
  "tags_required_all": ["Gabelstapler"],
  "tags_required_any": ["Lager", "Logistik"]
}
```

**Job:**
```json
{
  "category": "Lagerhelfer",
  "lat": 52.525008,
  "lon": 13.404954,
  "tags": ["Gabelstapler", "Lager", "Schichtarbeit"]
}
```

**Result:** ✅ MATCH
- ✅ Category matches
- ✅ Distance ≈ 0.56 km < 10 km
- ✅ "Gabelstapler" is in job tags
- ✅ "Lager" is in job tags

### Scenario 2: Category Mismatch ❌

**Worker:**
```json
{
  "category": "Lagerhelfer",
  "radius": 50.0
}
```

**Job:**
```json
{
  "category": "Fahrer"
}
```

**Result:** ❌ NO MATCH
- ❌ Category doesn't match

### Scenario 3: Too Far Away ❌

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
  "lon": 13.404954
}
```

**Result:** ❌ NO MATCH
- ✅ Category matches
- ❌ Distance ≈ 11.1 km > 5 km radius

### Scenario 4: Missing Required Tag ❌

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
  "tags": ["Gabelstapler", "Lager"]
}
```

**Result:** ❌ NO MATCH
- ✅ Category matches
- ✅ "Gabelstapler" is in job tags
- ❌ "Kranschein" is NOT in job tags (required_all check fails)

## Using the Endpoint

### Request
```bash
GET /api/jobs/matches/me
Headers:
  Authorization: Bearer <token>
```

### Response
```json
[
  {
    "id": "job_abc123",
    "employerId": "user_employer_123",
    "category": "Lagerhelfer",
    "title": "Lagerhelfer gesucht",
    "lat": 52.530008,
    "lon": 13.394954,
    "tags": ["Gabelstapler", "Lager"],
    "status": "open",
    // ... other job fields
  }
]
```

## Notes

- Only jobs with `status: "open"` are considered for matching
- The `workerId` is derived from the authentication token
- All tag comparisons are case-insensitive
- If a worker has no `tags_required_all` or `tags_required_any`, only category and radius are checked
- The endpoint returns an empty array `[]` if no matches are found
