# ShiftMatch - Test Accounts & Anleitung

## 🔑 Test Accounts

### Employer Account
- **Email:** katharina@dickies-helden.de
- **Password:** test123
- **Role:** employer
- **User ID:** user_katharina_dickies-helden_de

### Worker Account ✅ NEU!
- **Email:** worker@test.de  
- **Password:** test123
- **Role:** worker
- **User ID:** user_worker_test_de

---

## 🧪 WICHTIG: Token-Reset bei Problemen

Wenn der "Ich habe Zeit" Button nicht funktioniert:

### Option 1: Debug-Seite nutzen (EMPFOHLEN)
1. Gehe zu: `/debug-reset` 
2. Klicke auf "🗑️ Alle Daten löschen"
3. Neu einloggen als Worker

### Option 2: Browser-Cache manuell löschen
1. Browser-DevTools öffnen (F12)
2. Application → Storage → "Clear site data"
3. Seite neu laden

---

## ✅ TEST-ANLEITUNG (Kompletter Flow)

### 1. Als Employer testen
```
1. Gehe zu /debug-reset und lösche alle Daten
2. Einloggen: katharina@dickies-helden.de / test123
3. Job erstellen:
   - Titel, Beschreibung, Kategorie auswählen
   - Adresse KOMPLETT ausfüllen (Straße, Hausnummer, PLZ, Stadt)
   - "📍 Koordinaten jetzt berechnen" drücken
   - Warten bis "Koordinaten gefunden" erscheint
   - Datum/Zeit wählen
   - Vergütung eingeben
   - Job veröffentlichen
```

### 2. Als Worker testen
```
1. Ausloggen (Profil → Logout Icon)
2. Neu einloggen: worker@test.de / test123
3. Job in der Liste sehen
4. Auf Job klicken
5. "✓ Ich habe Zeit" drücken
6. Erfolgs-Alert sollte erscheinen
7. Weiterleitung zu "Meine Bewerbungen"
```

### 3. Als Employer Bewerbung sehen
```
1. Ausloggen und als Employer einloggen
2. "Matches" öffnen
3. Neue Bewerbung sollte sichtbar sein
4. Akzeptieren/Ablehnen
```

---

## ✅ Verifiziert funktionierende Features (28.11.2024)

✅ Job-Erstellung mit Geocoding (Backend-Test bestätigt)
✅ Worker kann Bewerbung erstellen (curl-Test erfolgreich)
✅ Backend erstellt Applications korrekt
✅ `addJob()` Funktion in jobStore.ts
✅ Geocoding mit manuellem Button
✅ 19 Backup-Dateien entfernt
✅ Debug-Reset-Seite erstellt

## 🔧 Technische Details

### Backend-Test (erfolgreich)
```bash
curl -X POST http://localhost:8001/api/applications \
  -H "Authorization: Bearer token_1764349746.4289_ab044c5c" \
  -d '{"jobId": "job_b3fbac4c-6af5-4fd9-a9bd-98424642c0cc"}'
  
→ ✅ Application created: app_5a5fff51acf7
```

### Bekanntes Problem
Das Frontend speichert manchmal den alten Employer-Token, daher:
- **Immer /debug-reset nutzen vor neuem Login**
- Oder Browser-Cache manuell löschen

---

## 📝 Offene Punkte

⚠️ DateTime Picker - funktioniert, könnte später optimiert werden
⚠️ Frontend-Token-Persistenz - manchmal bleibt alter Token
✅ Lösung: Debug-Reset-Seite nutzen!
