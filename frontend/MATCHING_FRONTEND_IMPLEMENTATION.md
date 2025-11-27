# Frontend-Integration: Job-Matching-Endpoint

## 1. Neue API-Funktion (`utils/jobStore.ts`)

```typescript
// ===== GET MATCHED JOBS FOR CURRENT WORKER =====
export async function getMatchedJobs(): Promise<Job[]> {
  console.log('🎯 getMatchedJobs: Fetching matched jobs for current worker');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/matches/me`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 401) {
      console.error('❌ getMatchedJobs: Unauthorized (401) - Invalid token');
      throw new Error('UNAUTHORIZED');
    }
    
    if (response.status === 404) {
      console.warn('⚠️ getMatchedJobs: Worker profile not found (404)');
      throw new Error('PROFILE_NOT_FOUND');
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getMatchedJobs: Failed', response.status, error);
      throw new Error(`Failed to fetch matched jobs: ${response.status}`);
    }
    
    const jobs: Job[] = await response.json();
    console.log('✅ getMatchedJobs: Found', jobs.length, 'matching jobs');
    return jobs;
  } catch (error) {
    console.error('❌ getMatchedJobs: Error', error);
    throw error;
  }
}
```

### Error Handling

| Status Code | Error | Beschreibung |
|-------------|-------|--------------|
| 401 | `UNAUTHORIZED` | Token ungültig oder abgelaufen |
| 404 | `PROFILE_NOT_FOUND` | Worker-Profil nicht gefunden |
| Other | Generic Error | Andere Backend-Fehler |

## 2. Worker-Feed-Screen Anpassungen (`app/(worker)/feed.tsx`)

### Imports geändert

**Alt:**
```typescript
import { getJobs } from '../../utils/jobStore';
import { getMatchingJobs } from '../../utils/matchingSimple';
import { nearbyJobs } from '../../utils/nearbyJobs';
```

**Neu:**
```typescript
import { getMatchedJobs } from '../../utils/jobStore';
```

### loadData() Funktion angepasst

**Alt (Client-Side Matching):**
```typescript
const allJobs = await getJobs();
const openJobs = allJobs.filter(j => j.status === 'open');
const matchedJobs = getMatchingJobs(openJobs, workerProfile);
```

**Neu (Server-Side Matching):**
```typescript
// Get matched jobs from backend (Haversine + Tag matching)
const matchedJobs = await getMatchedJobs();

// Filter out already applied jobs
const applications = await getWorkerApplications();
const jobIdsSet = new Set(applications.map(app => app.jobId));
const notAppliedJobs = matchedJobs.filter(job => !jobIdsSet.has(job.id));
```

### Error Handling

```typescript
} catch (e: any) {
  console.error('Error loading feed:', e);
  
  // Handle specific errors
  if (e.message === 'UNAUTHORIZED') {
    console.error('❌ Unauthorized - logging out');
    setError('Sitzung abgelaufen. Bitte erneut anmelden.');
  } else if (e.message === 'PROFILE_NOT_FOUND') {
    setError('Worker-Profil nicht gefunden. Bitte Profil vervollständigen.');
  } else {
    if (!silent) {
      setError('Fehler beim Laden der Aufträge.');
    }
  }
}
```

## 3. Job Type Definition (`types/job.ts`)

```typescript
export interface Job {
  id: string;
  employerId: string;
  category: string;
  title: string;
  description: string;
  hourlyRate: number;
  currency: string;
  lat: number;
  lon: number;
  tags: string[];
  status: 'open' | 'matched' | 'closed';
  
  // Time mode fields
  timeMode: 'fixed_time' | 'hour_package' | 'project';
  startAt?: string; // ISO string
  endAt?: string; // ISO string
  hours?: number;
  dueAt?: string; // ISO string
  
  // Address
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  
  createdAt: string;
}
```

## 4. UI-Verhalten

### Empty State

Wenn `matchedJobs.length === 0`:

```typescript
<View style={{
  padding: 32,
  backgroundColor: COLORS.white,
  borderRadius: 18,
  alignItems: 'center',
  gap: 12,
}}>
  <Text style={{ color: COLORS.black, fontSize: 18, fontWeight: '700' }}>
    Keine passenden Aufträge
  </Text>
  <Text style={{ color: COLORS.darkGray, fontSize: 14 }}>
    Aktuell gibt es keine Aufträge, die zu deinem Profil passen.
  </Text>
</View>
```

### Error Display

```typescript
{error && (
  <View style={{
    padding: 16,
    backgroundColor: COLORS.errorBg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  }}>
    <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>
      ⚠️ {error}
    </Text>
  </View>
)}
```

### Loading State

```typescript
if (isLoading) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ color: COLORS.white, marginTop: 16 }}>
          Lädt Aufträge...
        </Text>
      </SafeAreaView>
    </View>
  );
}
```

## 5. API Request Flow

```
┌─────────────────┐
│  Worker öffnet  │
│   Feed-Screen   │
└────────┬────────┘
         │
         ▼
┌────────────────────────┐
│  loadData() aufgerufen │
└────────┬───────────────┘
         │
         ▼
┌──────────────────────────┐
│ getMatchedJobs()         │
│ → GET /api/jobs/matches/me│
│ → Authorization: Bearer   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│   Backend prüft Token    │
│   Lädt Worker-Profil     │
│   Lädt offene Jobs       │
│   Wendet Matching an     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Matched Jobs Array      │
│  zurück ans Frontend     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Filtert bereits           │
│ bewarb Jobs aus          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Job-Karten rendern      │
│  oder "Keine passenden"  │
└──────────────────────────┘
```

## 6. Nicht mehr verwendete Funktionen (für Worker)

Diese Funktionen werden **NICHT MEHR** im Worker-Feed verwendet:

- ❌ `getAllJobs()` - Liefert alle Jobs ohne Matching
- ❌ `getJobsByCategory()` - Nur Kategorie-Filter
- ❌ `getMatchingJobs()` (Client-Side) - Veraltetes lokales Matching
- ❌ `nearbyJobs()` (Client-Side) - Veraltete Distanzberechnung

**Nur noch:** ✅ `getMatchedJobs()` - Server-Side Haversine + Tag-Matching

## 7. Vorteile des neuen Ansatzes

| Aspekt | Alt (Client-Side) | Neu (Server-Side) |
|--------|-------------------|-------------------|
| **Matching-Logik** | JavaScript (ungenau) | Python Haversine (präzise) |
| **Performance** | Alle Jobs laden | Nur passende Jobs laden |
| **Daten-Transfer** | Hoch (alle Jobs) | Niedrig (gefiltert) |
| **Tag-Matching** | Einfach | Komplex (all + any) |
| **Radius-Check** | Vereinfacht | Haversine-Formel |
| **Sicherheit** | Client kann manipulieren | Server-validiert |

## 8. Testing

### Manual Test

1. Als Worker anmelden
2. Feed-Screen öffnen
3. Überprüfen:
   - ✅ Nur passende Jobs werden angezeigt
   - ✅ "Keine passenden Aufträge" wenn Liste leer
   - ✅ Error-Message bei 401 oder anderen Fehlern
   - ✅ Loading-Spinner beim ersten Laden

### Console Logs

Erfolgreicher Request:
```
🎯 getMatchedJobs: Fetching matched jobs for current worker
✅ getMatchedJobs: Found 3 matching jobs
```

401 Fehler:
```
🎯 getMatchedJobs: Fetching matched jobs for current worker
❌ getMatchedJobs: Unauthorized (401) - Invalid token
❌ Unauthorized - logging out
```

Keine Matches:
```
🎯 getMatchedJobs: Fetching matched jobs for current worker
✅ getMatchedJobs: Found 0 matching jobs
```

## 9. Status

- ✅ `getMatchedJobs()` Funktion implementiert
- ✅ Worker-Feed-Screen angepasst
- ✅ Error Handling implementiert (401, 404, generic)
- ✅ UI für leere Liste vorhanden
- ✅ Loading States korrekt
- ✅ Auto-Refresh funktioniert (5 Sekunden)
- ✅ Frontend neu gestartet

Das System ist vollständig integriert und einsatzbereit! 🎉
