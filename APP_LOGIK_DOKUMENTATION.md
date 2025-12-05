# ShiftMatch App - Vollständige Logik & Entwicklungsstand
**Stand: 27. November 2025**

---

## 📱 App-Übersicht

**Name:** ShiftMatch (auch bekannt als: JobMatcher)  
**Typ:** Zwei-seitige Job-Matching-Plattform für Kurzzeit-Jobs  
**Sprache:** Deutsch  
**Technologie:** React Native (Expo) + FastAPI (Python) + MongoDB

---

## 🎯 Kernkonzept

Die App verbindet zwei Benutzergruppen:
1. **Auftraggeber (Employer)** - Erstellen Jobs und wählen Bewerber aus
2. **Auftragnehmer (Worker)** - Suchen Jobs und bewerben sich

### Hauptmerkmale:
- ✅ Intelligentes Job-Matching basierend auf Kategorie, Radius, Tags
- ✅ Token-basierte Authentifizierung (JWT)
- ✅ Bewerbungs-/Matching-System
- ✅ Chat zwischen Employer und Worker
- ✅ Bewertungs-System
- ✅ Profile für beide Rollen
- ✅ MongoDB als zentrale Datenbank

---

## 🏗️ Technische Architektur

### Frontend (Expo/React Native)
```
/app/frontend/
├── app/                          # Expo Router (file-based routing)
│   ├── (employer)/              # Employer-Screens (Tab-Layout)
│   │   ├── index.tsx            # Dashboard mit Job-Liste
│   │   ├── jobs/
│   │   │   ├── create.tsx       # Job erstellen
│   │   │   └── [id].tsx         # Job-Details mit Bewerberliste
│   │   ├── applications.tsx     # Bewerbungen verwalten
│   │   └── profile.tsx          # Employer-Profil
│   ├── (worker)/                # Worker-Screens (Tab-Layout)
│   │   ├── feed.tsx             # Gematchte Jobs (Hauptfeed)
│   │   ├── jobs/
│   │   │   ├── all.tsx          # ALLE Jobs im Radius (NEU!)
│   │   │   └── [id].tsx         # Job-Details mit Bewerben-Button
│   │   ├── matches.tsx          # Akzeptierte Jobs
│   │   └── profile.tsx          # Worker-Profil
│   ├── auth/
│   │   ├── start.tsx            # Willkommens-Screen
│   │   ├── signup.tsx           # Registrierung
│   │   └── login.tsx            # Login
│   └── chat/
│       └── [id].tsx             # Shared Chat (Employer ↔ Worker)
├── components/
│   └── AddressAutocompleteInput.tsx  # Adress-Autocomplete (Nominatim)
├── contexts/
│   └── AuthContext.tsx          # Globale Auth (React Context)
├── utils/
│   ├── api.ts                   # API-Basis-Config
│   ├── jobStore.ts              # Job-API-Funktionen
│   ├── applicationStore.ts      # Bewerbungs-API-Funktionen
│   └── profileStore.ts          # Profil-API-Funktionen
└── types/
    ├── job.ts                   # Job TypeScript Types
    ├── application.ts           # Application TypeScript Types
    └── profile.ts               # Profile TypeScript Types
```

### Backend (FastAPI/Python)
```
/app/backend/
├── server.py                    # Monolithischer FastAPI-Server (ALLE Endpoints)
└── matching_service.py          # Job-Matching-Logik (Haversine, Score)
```

---

## 🗄️ Datenbank-Struktur (MongoDB)

### Collections:

#### 1. **users**
```javascript
{
  _id: ObjectId,
  userId: "user_email_domain_tld",  // z.B. "user_john_example_de"
  email: "john@example.de",
  passwordHash: "...",
  role: "worker" | "employer",
  createdAt: ISODate
}
```

#### 2. **worker_profiles**
```javascript
{
  _id: ObjectId,
  userId: "user_...",
  firstName: "Max",
  lastName: "Mustermann",
  phone: "+491234567890",
  address: {
    street: "Straße",
    houseNumber: "1",
    postalCode: "10115",
    city: "Berlin",
    country: "Deutschland"
  },
  homeLat: 52.520008,
  homeLon: 13.404954,
  categories: ["sicherheit", "gastronomie"],      // Array von Kategorie-Keys
  selectedTags: ["sachkunde", "service-erfahrung"], // Array von Tag-Keys
  radiusKm: 20,                                   // Suchradius in km
  photoUrl: "https://...",                        // Optional
  documents: [],                                   // Optional
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### 3. **employer_profiles**
```javascript
{
  _id: ObjectId,
  userId: "user_...",
  firstName: "Anna",
  lastName: "Schmidt",
  email: "anna@firma.de",
  phone: "+491234567890",
  companyName: "Firma GmbH",                      // Optional
  address: { ... },                               // Gleiche Struktur wie Worker
  lat: 52.520008,
  lon: 13.404954,
  paymentMethod: "rechnung" | "sepa" | "kreditkarte",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### 4. **jobs**
```javascript
{
  _id: ObjectId,
  id: "job_abc123",                               // Custom ID
  employerId: "user_...",
  employerType: "private" | "business",
  employerName: "Firma GmbH",                     // Für Anzeige
  title: "Sicherheitskraft für Event",
  description: "...",
  category: "sicherheit",                         // Kategorie-Key
  timeMode: "time_exact" | "hour_package" | "project",
  startAt: ISODate,                               // Für time_exact
  endAt: ISODate,                                 // Für time_exact
  hours: 8.0,                                     // Für hour_package
  dueAt: ISODate,                                 // Für project
  address: { ... },
  lat: 52.520008,
  lon: 13.404954,
  workerAmountCents: 2000,                        // Bruttogehalt Worker (in Cent)
  paymentToWorker: "cash" | "bank" | "paypal",
  required_all_tags: ["sachkunde"],               // MUSS alle haben
  required_any_tags: ["bewacher-id", "..."],      // MUSS mindestens einen haben
  status: "open" | "matched" | "completed",
  matchedWorkerId: "user_...",                    // Null wenn open
  createdAt: ISODate
}
```

#### 5. **applications**
```javascript
{
  _id: ObjectId,
  id: "app_xyz789",
  jobId: "job_abc123",
  workerId: "user_...",
  employerId: "user_...",
  status: "pending" | "accepted" | "rejected",
  message: "Ich habe Erfahrung...",               // Optional
  createdAt: ISODate,
  respondedAt: ISODate,                           // Null wenn pending
  legalConfirmed: false,                          // Worker bestätigt Steuern/Versicherung
  legalConfirmedAt: ISODate
}
```

#### 6. **chat_messages**
```javascript
{
  _id: ObjectId,
  applicationId: "app_xyz789",
  senderId: "user_...",
  receiverId: "user_...",
  text: "Hallo, wann können Sie anfangen?",
  read: false,
  createdAt: ISODate
}
```

#### 7. **reviews**
```javascript
{
  _id: ObjectId,
  jobId: "job_abc123",
  workerId: "user_...",
  employerId: "user_...",
  reviewerId: "user_...",                         // Wer hat bewertet
  revieweeId: "user_...",                         // Wer wurde bewertet
  rating: 5,                                      // 1-5 Sterne
  comment: "Sehr zuverlässig!",
  createdAt: ISODate
}
```

---

## 🔌 Backend API-Endpoints

### Authentifizierung
- `POST /api/auth/signup` - Registrierung (email, password, role)
- `POST /api/auth/login` - Login → gibt Token zurück
- `GET /api/auth/me` - Aktuellen User abrufen (token-basiert)

### Worker-Profile
- `POST /api/profiles/worker` - Profil erstellen
- `GET /api/profiles/worker/{userId}` - Profil abrufen
- `PUT /api/profiles/worker/{userId}` - Profil aktualisieren

### Employer-Profile
- `POST /api/profiles/employer` - Profil erstellen
- `GET /api/profiles/employer/{userId}` - Profil abrufen
- `PUT /api/profiles/employer/{userId}` - Profil aktualisieren

### Jobs
- `POST /api/jobs` - Job erstellen (Employer only)
- `GET /api/jobs` - Alle offenen Jobs abrufen
- `GET /api/jobs/employer/{employerId}` - Jobs eines Employers
- `GET /api/jobs/{jobId}` - Einzelnen Job abrufen
- `PUT /api/jobs/{jobId}` - Job aktualisieren (Employer only)
- `DELETE /api/jobs/{jobId}` - Job löschen (Employer only)
- `GET /api/jobs/matches/me` - **Gematchte Jobs für Worker** (token-basiert)

### Bewerbungen
- `POST /api/applications` - Bewerbung erstellen (Worker only)
- `GET /api/applications/job/{jobId}` - Bewerbungen für einen Job (Employer)
- `GET /api/applications/worker/me` - Bewerbungen eines Workers (token-basiert)
- `GET /api/applications/employer/me` - Bewerbungen für Employer's Jobs (token-basiert)
- `GET /api/applications/{applicationId}` - Einzelne Bewerbung
- `PUT /api/applications/{applicationId}/accept` - Bewerbung akzeptieren (Employer)
- `PUT /api/applications/{applicationId}` - Bewerbung aktualisieren

### Chat
- `POST /api/chat/messages` - Nachricht senden
- `GET /api/chat/messages/{applicationId}` - Nachrichten abrufen (auto-read)

### Bewertungen
- `POST /api/reviews` - Bewertung erstellen
- `GET /api/reviews/worker/{workerId}` - Bewertungen eines Workers
- `GET /api/reviews/employer/{employerId}` - Bewertungen eines Employers
- `GET /api/reviews/job/{jobId}` - Bewertungen zu einem Job

### System
- `GET /api/` - Health Check
- `GET /api/health` - Health Check

---

## 🧠 Matching-Logik

### Worker Feed (Gematchte Jobs)
**Endpoint:** `GET /api/jobs/matches/me`

**Matching-Kriterien:**
1. ✅ **Kategorie-Match:** Job.category MUSS in Worker.categories sein
2. ✅ **Radius-Check:** Distanz zwischen Worker.home und Job.address ≤ Worker.radiusKm
3. ✅ **Tag-Matching:**
   - `required_all_tags`: Worker MUSS ALLE diese Tags haben
   - `required_any_tags`: Worker MUSS MINDESTENS EINEN dieser Tags haben

**Distanz-Berechnung:** Haversine-Formel (in `matching_service.py`)

**Sortierung:** Nach Match-Score (höher = besser)

### "Alle Jobs"-Seite (NEU!)
**Route:** `/(worker)/jobs/all`

**Filter-Logik:**
1. ✅ Job ist offen (`status === "open"`)
2. ✅ Job hat Position (`lat`, `lon`)
3. ✅ Job liegt im Radius (Haversine)
4. ❌ KEINE Kategorie-Filterung
5. ❌ KEINE Tag-Filterung

**Sortierung:** Nach Distanz (nächste zuerst)

---

## 🎨 UI/UX Design

### Design-System
**Farben:**
- Primary: `#5941FF` (Purple)
- Accent: `#C8FF16` (Neon-Lime)
- White: `#FFFFFF`
- Black: `#000000`
- Gray: `#8A8A8A`

**Tab-Navigation:**
- **Employer:** Dashboard | Bewerbungen | Profil
- **Worker:** Aktuelle Jobs | Bewerbungen | Matches | Profil | **ALLE JOBS** (NEU!)

**Job-Cards:**
- Purple Background mit Neon-Border
- Kategorie-Badge (Neon-gelb)
- Icons: Ionicons
- Shadow-Effekt mit Neon-Glow

---

## 📊 Aktueller Entwicklungsstand

### ✅ Vollständig implementiert:

1. **Authentifizierung**
   - Token-basierte Auth (JWT)
   - Signup & Login
   - `/me` Endpoints für beide Rollen
   - AuthContext (React Context)

2. **Profile**
   - Worker-Profil (vollständig)
   - Employer-Profil (vollständig)
   - Adress-Autocomplete mit Nominatim
   - Geocoding-Fallback

3. **Jobs**
   - Job-Erstellung (3 Zeit-Modi)
   - Job-Liste (Employer Dashboard)
   - Job-Details-Seite
   - Job bearbeiten/löschen

4. **Matching-System**
   - Backend: `/jobs/matches/me` Endpoint
   - Frontend: Worker Feed mit gematchten Jobs
   - **NEU:** "Alle Jobs"-Seite (nur Radius-Filter)
   - Haversine-Distanz-Berechnung
   - Tag-Matching (required_all, required_any)

5. **Bewerbungs-System**
   - Bewerbung erstellen
   - Bewerbung akzeptieren/ablehnen
   - Status-Management
   - Legal Confirmation

6. **Chat-System**
   - Shared Chat-Screen
   - Echtzeit-Polling (3 Sek)
   - Auto-Read-Funktionalität
   - iMessage-Style Design

7. **Bewertungs-System**
   - Review erstellen
   - Review anzeigen
   - Duplicate-Check

8. **Performance-Optimierungen**
   - matches.tsx: Jobs einzeln per ID laden (statt alle)
   - getJobById() Funktion implementiert

### 🔧 Kürzlich implementiert (heute):

1. ✅ Performance-Refaktorierung von `matches.tsx`
   - ALT: Alle Jobs laden → filtern
   - NEU: Jeden Job einzeln per ID laden
   - Backend-Tests: 96,2% bestanden

2. ✅ "Alle Jobs"-Feature
   - Button im Worker Feed: "Alle Jobs"
   - Neue Seite: `/(worker)/jobs/all.tsx`
   - Zeigt ALLE Jobs im Radius (ohne Kategorie/Tag-Filter)
   - Sortierung nach Distanz
   - Bug-Fix: `getUserId()` korrekt implementiert

---

## 🐛 Bekannte Probleme & Lösungen

### Problem 1: "Kein Worker-Profil gefunden" auf "Alle Jobs"-Seite
**Status:** ✅ GELÖST  
**Ursache:** `getWorkerProfile()` wurde ohne `userId` aufgerufen  
**Lösung:** `getUserId()` importiert und vor `getWorkerProfile(userId)` aufgerufen

### Problem 2: 403-Fehler bei API-Calls
**Status:** ✅ GELÖST  
**Ursache:** Token/User-ID Mismatch  
**Lösung:** Backend als Single Source of Truth, `/me` Endpoints für beide Rollen

### Problem 3: Build-Cache auf Frontend
**Status:** ✅ GELÖST  
**Lösung:** `expo start --clear` oder `sudo supervisorctl restart expo`

---

## 📁 Wichtige Dateien & Pfade

### Backend
- `/app/backend/server.py` - Haupt-API-Server
- `/app/backend/matching_service.py` - Matching-Logik

### Frontend (Key Files)
- `/app/frontend/app/(worker)/feed.tsx` - Worker Hauptfeed (gematchte Jobs)
- `/app/frontend/app/(worker)/jobs/all.tsx` - Alle Jobs im Radius (NEU!)
- `/app/frontend/app/(worker)/matches.tsx` - Akzeptierte Jobs
- `/app/frontend/utils/jobStore.ts` - Job-API-Funktionen
- `/app/frontend/utils/applicationStore.ts` - Bewerbungs-API-Funktionen
- `/app/frontend/contexts/AuthContext.tsx` - Globale Auth

### Config
- `/app/frontend/.env` - Umgebungsvariablen
- `/app/frontend/config.ts` - API_URL Export

---

## 🚀 Deployment

**URLs:**
- Frontend: `https://worklink-30.preview.emergentagent.com`
- Backend: `https://worklink-30.preview.emergentagent.com/api`

**Services:**
- Backend: Port 8001 (FastAPI/Uvicorn)
- Frontend: Port 3000 (Expo Metro)
- MongoDB: Port 27017 (lokal)

**Restart Commands:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart expo
```

---

## 📝 Taxonomie (Kategorien & Tags)

### Aktuelle Struktur (vereinfacht):
- **Kategorien:** Array von Strings (z.B. `["sicherheit", "gastronomie"]`)
- **Tags:** Array von Strings (z.B. `["sachkunde", "service-erfahrung"]`)

### Alte Struktur (Backup):
- Gespeichert in: `/app/frontend/shared/taxonomy-old-backup.json`
- Enthält 19 Kategorien mit detaillierten Tags (role, qual, license, doc, skill, tool, vehicle)

**Aktuelle Kategorien:**
- sicherheit
- gastronomie
- lieferservice
- lager_logistik
- einzelhandel
- event_messe
- reinigung
- bau_helfer
- haus_garten
- babysitting_kinder
- kleinstreparaturen_handwerk
- haustiere
- umzug_transport
- buero_service
- it_support
- foto_video
- nachhilfe
- fahrdienst
- hauswirtschaft

---

## 💡 Wichtige Hinweise für Entwicklung

1. **Token-basiert:** ALLE API-Calls verwenden `Authorization: Bearer {token}`
2. **User-ID aus Token:** Backend leitet User-ID aus Token ab (nicht aus Request-Body)
3. **File-based Routing:** Expo Router nutzt Dateistruktur als Routing
4. **MongoDB IDs:** Custom IDs (z.B. `job_abc123`, `user_email_domain`)
5. **Distanz in km:** Alle Radius-Angaben in Kilometern
6. **Preise in Cent:** `workerAmountCents` (z.B. 2000 = 20,00 €)
7. **3 Zeit-Modi:** time_exact, hour_package, project

---

## 🎯 Nächste mögliche Features

1. ⏳ Push-Benachrichtigungen
2. ⏳ Job-Favoriten
3. ⏳ Erweiterte Filter (Preis, Datum, etc.)
4. ⏳ Employer kann mehrere Jobs gleichzeitig verwalten
5. ⏳ Worker kann gleichzeitig auf mehrere Jobs bewerben
6. ⏳ Statistiken/Analytics
7. ⏳ Export-Funktionen (PDF, etc.)

---

## 📞 Support & Dokumentation

- Test-Result-Protokoll: `/app/test_result.md`
- Backend-Logs: `/var/log/supervisor/backend.out.log`
- Frontend-Logs: `/var/log/supervisor/expo.out.log`

---

**Ende der Dokumentation**  
**Letzte Aktualisierung:** 27. November 2025, 16:45 Uhr
