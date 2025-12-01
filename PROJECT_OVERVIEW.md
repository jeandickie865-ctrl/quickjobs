# ShiftMatch - Projekt-Übersicht

## 📋 Projekt-Beschreibung

**ShiftMatch** ist eine deutsche, zweiseitige mobile Job-Plattform, die Arbeitgeber (Auftraggeber) mit Arbeitnehmern (Auftragnehmer) für kurzfristige Jobs verbindet.

### Kernfunktionen:
- Arbeitgeber erstellen Jobs mit detaillierten Zeitangaben und Adressen
- Worker sehen passende Jobs basierend auf Matching-Algorithmus
- Bewerbungssystem mit Chat-Funktion
- Automatische Job-Bereinigung (alte Jobs werden gelöscht)
- PDF-Generierung für Verträge, Sofortmeldung und Lohnabrechnung

---

## 🛠️ Tech-Stack

### Backend:
- **Framework:** FastAPI (Python)
- **Datenbank:** MongoDB (Motor async driver)
- **Port:** 8001
- **API-Prefix:** `/api`

### Frontend:
- **Framework:** React Native mit Expo
- **Router:** expo-router (file-based routing)
- **Port:** 3000
- **Sprache:** TypeScript

### Deployment:
- **Container:** Kubernetes
- **Supervisor:** Prozessmanagement für Backend/Frontend
- **MongoDB:** Lokale Instanz

---

## 📁 Projekt-Struktur

```
/app
├── backend/
│   ├── server.py                    # Haupt-Backend-Datei (3300+ Zeilen)
│   ├── .env                         # Backend-Umgebungsvariablen
│   ├── requirements.txt             # Python-Dependencies
│   ├── matching_service.py          # Job-Matching-Algorithmus
│   ├── generated_contracts/         # Generierte PDFs
│   ├── jobs/                        # SQLAlchemy-Version (NICHT VERWENDET)
│   │   ├── router.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── profiles/                    # (eventuell vorhanden)
│
├── frontend/
│   ├── app/                         # Expo Router Screens
│   │   ├── (employer)/              # Employer-Screens
│   │   │   ├── index.tsx            # Dashboard
│   │   │   ├── applications.tsx     # Bewerbungen anzeigen
│   │   │   └── jobs/
│   │   │       ├── create.tsx       # Job erstellen
│   │   │       └── [id].tsx         # Job-Details
│   │   ├── (worker)/                # Worker-Screens
│   │   │   ├── feed.tsx             # Job-Feed
│   │   │   ├── applications.tsx     # Eigene Bewerbungen
│   │   │   └── jobs/
│   │   │       └── [id].tsx         # Job-Details
│   │   ├── chat/
│   │   │   └── [id].tsx             # Chat zwischen Employer/Worker
│   │   ├── _layout.tsx              # Root-Layout
│   │   └── index.tsx                # Entry Point
│   ├── utils/
│   │   ├── api.ts                   # API-Funktionen
│   │   ├── jobStore.ts              # Job-bezogene API-Calls
│   │   ├── chatStore.ts             # Chat-Funktionen
│   │   └── auth.ts                  # Authentication
│   ├── constants/
│   │   └── colors.ts                # Design-System
│   ├── types/
│   │   └── address.ts               # TypeScript-Typen
│   ├── .env                         # Frontend-Umgebungsvariablen
│   └── package.json
│
└── test_result.md                   # Testing-Protokoll und Historie

```

---

## 🗄️ Datenmodelle (MongoDB)

### Collections:

#### 1. **jobs**
```javascript
{
  id: "job_uuid",
  employerId: "user_id",
  employerType: "private" | "business",
  title: string,
  description: string,
  category: string,
  
  // ZEIT-FELDER (WICHTIG!)
  date: "YYYY-MM-DD",              // Hauptfeld
  start_at: "HH:MM",               // z.B. "09:00"
  end_at: "HH:MM",                 // z.B. "17:00"
  timeMode: "fixed_time",          // Standardwert
  
  // Legacy-Felder (für Kompatibilität)
  startAt: "HH:MM",
  endAt: "HH:MM",
  
  // ADRESSE
  address: {
    street: string,
    houseNumber: string,          // camelCase UND
    house_number: string,          // snake_case (beide unterstützt)
    postalCode: string,
    postal_code: string,
    city: string
  },
  
  lat: number,
  lon: number,
  
  workerAmountCents: number,
  paymentToWorker: "cash" | "bank" | "paypal",
  
  required_all_tags: string[],
  required_any_tags: string[],
  
  status: "open" | "matched" | "done" | "canceled",
  matchedWorkerId: string | null,
  
  createdAt: ISO-string
}
```

#### 2. **applications**
```javascript
{
  id: "app_uuid",
  jobId: string,
  workerId: string,
  status: "pending" | "accepted" | "rejected",
  message: string,
  createdAt: ISO-string
}
```

#### 3. **employer_profiles**
```javascript
{
  userId: string,
  firstName: string,
  lastName: string,
  company: string,
  companyName: string,
  email: string,
  phone: string,
  
  // Adresse (ROOT-LEVEL, nicht homeAddress!)
  street: string,
  houseNumber: string,
  postalCode: string,
  city: string
}
```

#### 4. **worker_profiles**
```javascript
{
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  birthDate: "YYYY-MM-DD",
  
  // Adresse (ROOT-LEVEL)
  street: string,
  houseNumber: string,
  postalCode: string,
  city: string,
  
  // Matching-Felder
  category: string,
  radius: number,
  required_all_tags: string[],
  required_any_tags: string[],
  
  // Optional
  steuerId: string,
  sozialversicherungsnummer: string,
  krankenkasse: string
}
```

#### 5. **chat_messages**
```javascript
{
  id: string,
  applicationId: string,
  senderId: string,
  message: string,
  createdAt: ISO-string
}
```

#### 6. **official_registrations**
```javascript
{
  id: string,
  jobId: string,
  employerId: string,
  workerId: string,
  registrationType: "kurzfristig" | "minijob",
  officialRegistrationStatus: "pending" | "complete",
  contractUrl: string,
  sofortmeldungUrl: string,
  createdAt: ISO-string
}
```

---

## 🔌 Wichtige API-Endpunkte

### Jobs:
- `GET /api/jobs` - Alle offenen Jobs (date >= heute)
- `GET /api/jobs/{job_id}` - Einzelner Job
- `GET /api/jobs/employer/{employer_id}` - Jobs eines Employers
- `POST /api/jobs` - Job erstellen
- `PUT /api/jobs/{job_id}` - Job aktualisieren
- `GET /api/jobs/matches/me` - Matching-Jobs für Worker
- `GET /api/matching/worker/{worker_id}` - B3 Matching mit Filtern

### Applications:
- `GET /api/applications/worker/me` - Eigene Bewerbungen (Worker)
- `GET /api/applications/job/{job_id}` - Bewerbungen für Job (Employer)
- `POST /api/applications` - Bewerbung erstellen
- `PUT /api/applications/{app_id}` - Status ändern (accept/reject)

### Chat:
- `GET /api/chat/messages/{application_id}` - Chat-Nachrichten
- `POST /api/chat/messages` - Nachricht senden

### Profiles:
- `GET /api/profiles/employer/{user_id}` - Employer-Profil
- `POST /api/profiles/employer` - Employer-Profil erstellen
- `GET /api/profiles/worker/{user_id}` - Worker-Profil
- `POST /api/profiles/worker` - Worker-Profil erstellen

### PDFs:
- Contract PDF wird bei Match-Akzeptanz generiert
- Sofortmeldung PDF
- Payroll PDF (Lohnabrechnung)

---

## ⚙️ Wichtige Backend-Funktionen

### 1. **Auto-Cleanup (B1)**
```python
async def delete_expired_jobs():
    # Läuft stündlich via Background Scheduler
    # Löscht Jobs mit date < HEUTE
    # Status: "open" oder "matched"
```

### 2. **Job-Matching**
```python
def match_worker_with_job(worker_profile, job):
    # Matching basierend auf:
    # - Kategorie (exakt)
    # - Radius (Haversine-Distanz)
    # - Required Tags (ALL tags müssen vorhanden sein)
    # - Optional Tags (mindestens einer muss vorhanden sein)
```

### 3. **PDF-Generierung**
- `generate_contract_pdf()` - Arbeitsvertrag
- `generate_sofortmeldung_pdf()` - Sofortmeldung
- `generate_payroll_pdf()` - Lohnabrechnung

**Wichtig:** Alle PDFs unterstützen:
- `homeAddress`-Objekte UND Root-Level Adressfelder
- Neue Zeitfelder (`date`, `start_at`, `end_at`)
- Saubere Formatierung ohne "None" oder "Invalid Date"

### 4. **Background Scheduler**
```python
@app.on_event("startup")
async def start_cleanup_task():
    # Startet stündlichen Cleanup
    asyncio.create_task(cleanup_scheduler())
```

---

## 🎨 Frontend-Struktur

### Routing (expo-router):
- `(employer)` - Employer-spezifische Screens
- `(worker)` - Worker-spezifische Screens
- File-based routing: `app/path/[id].tsx` → `/path/:id`

### State Management:
- React Hooks (`useState`, `useEffect`)
- `useFocusEffect` für Screen-Focus-Events
- `useIsFocused` für Polling-Kontrolle

### API-Calls:
- Zentrale Funktionen in `/utils/api.ts`, `jobStore.ts`
- Auth-Headers automatisch hinzugefügt
- Base URL: `EXPO_PUBLIC_BACKEND_URL` aus `.env`

### Design:
- Farben in `/constants/colors.ts`
- Native Komponenten (React Native)
- Responsive für Web und Mobile

---

## 🔧 Umgebungsvariablen

### Backend (`.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
SECRET_KEY=...
```

**PROTECTED:** `MONGO_URL` nicht ändern!

### Frontend (`.env`):
```env
EXPO_PACKAGER_PROXY_URL=...
EXPO_PACKAGER_HOSTNAME=...
EXPO_PUBLIC_BACKEND_URL=http://backend:8001
```

**PROTECTED:** Die EXPO_PACKAGER Variablen nicht ändern!

---

## 📝 Wichtige Implementierungsdetails

### Zeitfelder-Konvention:
- **Datenbank:** `date` (YYYY-MM-DD), `start_at` (HH:MM), `end_at` (HH:MM)
- **Frontend-Anzeige:** DD.MM.YYYY, HH:MM – HH:MM Uhr
- **Legacy-Support:** `startAt`/`endAt` werden parallel gespeichert

### Adressfelder-Konvention:
- **Jobs:** `address` Objekt mit `street`, `houseNumber`, `postalCode`, `city`
- **Profiles:** Root-Level Felder: `street`, `houseNumber`, `postalCode`, `city`
- **PDFs:** Unterstützen beide Formate mit Fallback-Logik

### B1 Cleanup-Regeln:
- Jobs mit `date < HEUTE` werden gelöscht
- Beide Status: `"open"` und `"matched"`
- Jobs von HEUTE bleiben bestehen (auch wenn Endzeit vorbei)
- Läuft automatisch jede Stunde

### B3 Matching-Filter:
- `status == "open"`
- `date >= HEUTE`
- `matchedWorkerId == None`
- `lat` und `lon` vorhanden

### Authentifizierung:
- Token-basiert (Bearer Token)
- `get_user_id_from_token()` für User-Identifikation
- Employer kann nur eigene Jobs sehen/bearbeiten

---

## 🚨 Bekannte Einschränkungen

1. **SQLAlchemy-Version nicht verwendet:**
   - `/backend/jobs/router.py` existiert, wird aber NICHT genutzt
   - Alle Logik ist in `server.py` (MongoDB)

2. **Keine echte Authentifizierung:**
   - Tokens werden einfach validiert, aber nicht mit einer Auth-Datenbank abgeglichen
   - User-IDs werden direkt aus Tokens extrahiert

3. **PDF-Stunden-Berechnung:**
   - Wenn `start_at` und `end_at` vorhanden, wird Differenz berechnet
   - Sonst Standard: 8 Stunden

4. **Geocoding:**
   - Frontend macht Geocoding-Anfragen
   - Lat/Lon werden im Job gespeichert

---

## 🔄 Letzte Änderungen (Stand: 01.12.2025)

### B1 - Backend Cleanup & Konsistenz:
- ✅ Auto-Cleanup-Funktion implementiert
- ✅ Stündlicher Background Scheduler
- ✅ Matching API mit strikten Filtern
- ✅ Zeitfelder vereinheitlicht

### PDF-Modernisierung:
- ✅ Alle 3 PDFs aktualisiert (Contract, Sofortmeldung, Payroll)
- ✅ Neue Zeitfelder (`date`, `start_at`, `end_at`)
- ✅ Fallback für Root-Level Adressen
- ✅ Keine "None" oder "Invalid Date" mehr

### Frontend-Fixes:
- ✅ Worker Job-Detail-Seite: Zeit korrekt anzeigen
- ✅ Employer Job-Detail-Seite: Zeit korrekt anzeigen
- ✅ Create-Job-Formular: Native Date/Time Picker (Web)
- ✅ State-Cache-Bug behoben mit `useFocusEffect`

### Datenbank-Cleanup:
- ✅ 22 verwaiste Applications gelöscht
- ✅ Zeit-Felder synchronisiert (`startAt` ↔ `start_at`)

---

## 📞 Service-Befehle

```bash
# Backend neu starten
sudo supervisorctl restart backend

# Frontend neu starten
sudo supervisorctl restart expo

# Status prüfen
sudo supervisorctl status

# Logs anzeigen
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/expo.err.log
```

---

## 🧪 Testing

- Test-Protokoll: `/app/test_result.md`
- Backend-Tests: `deep_testing_backend_v2`
- Frontend-Tests: `expo_frontend_testing_agent`
- Immer Backend vor Frontend testen!

---

## 💡 Tipps für Weiterentwicklung

1. **Nie `MONGO_URL` oder `EXPO_PACKAGER_*` Variablen ändern**
2. **SQLAlchemy-Code in `jobs/router.py` ignorieren**
3. **Beide Zeitfeld-Formate parallel speichern** (startAt + start_at)
4. **Beide Adress-Formate unterstützen** (homeAddress + Root-Level)
5. **Immer Cache löschen** bei Frontend-Problemen: `rm -rf /app/frontend/.expo`
6. **Bei 403/404 Fehlern:** Prüfen ob Job/Application existiert
7. **PDF-Tests:** Match akzeptieren, um PDF zu generieren

---

Ende der Dokumentation
