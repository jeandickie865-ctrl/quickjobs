# Debug-Änderungen für Bewerbungsflow

## Problem
"Bewerbung konnte nicht gespeichert werden" - roter Balken beim Klick auf "Ich habe Zeit"

## Implementierte Änderungen

### 1. utils/applicationStore.ts
- **Neue Funktion `applyForJob` hinzugefügt** als Alias für `addApplication`
- Erweiterte Logging-Funktionalität:
  - `console.log('🔍 applyForJob called', { jobId, workerId, employerId })`
  - Prüfung ob `employerId` vorhanden ist
  - Error-Logging bei Fehlern: `console.log('❌ applyForJob: ERROR', e)`

### 2. app/(worker)/feed.tsx
- **handleApply Funktion erweitert** mit detailliertem Logging:
  - Prüfung ob `user` vorhanden: `console.log('❌ handleApply: no user')`
  - Prüfung ob `profile` vorhanden: `console.log('❌ handleApply: no profile')`
  - Start-Log: `console.log('🚀 handleApply: start', { jobId, workerId, employerId })`
  - Success-Log: `console.log('✅ handleApply: success')`
  - Error-Log: `console.log('❌ handleApply: ERROR', e)`
  - Verbesserte Fehlermeldung: Zeigt den konkreten Error-Text an

### 3. types/job.ts
- **lat und lon als optional markiert** (`lat?: number`, `lon?: number`)
- Grund: Jobs werden ohne Koordinaten erstellt, erst später per Geocoding hinzugefügt

## Wie man die Logs prüft

### Browser-Konsole (Web):
1. Öffne die App im Browser
2. Drücke F12 (Developer Tools)
3. Gehe zum "Console" Tab
4. Klicke als Arbeitnehmer auf "Ich habe Zeit"
5. Suche nach Logs mit:
   - `handleApply:`
   - `applyForJob:`

### Terminal (Expo Logs):
```bash
sudo supervisorctl tail -f expo
```

## Erwartete Log-Ausgabe (Erfolgsfall)

```
🚀 handleApply: start { jobId: 'job-123...', workerId: 'u-456...', employerId: 'u-789...' }
🔍 applyForJob called { jobId: 'job-123...', workerId: 'u-456...', employerId: 'u-789...' }
📋 Application already exists (oder)
✅ New application created { appId: 'app-...', jobId: 'job-123...', ... }
✅ applyForJob: success
✅ handleApply: success
```

## Erwartete Log-Ausgabe (Fehlerfall)

```
🚀 handleApply: start { jobId: 'job-123...', workerId: 'u-456...', employerId: 'UNDEFINED' }
🔍 applyForJob called { jobId: 'job-123...', workerId: 'u-456...', employerId: undefined }
❌ applyForJob: employerId fehlt beim Bewerben
❌ applyForJob: ERROR Error: employerId fehlt beim Bewerben.
❌ handleApply: ERROR Error: employerId fehlt beim Bewerben.
```

## Nächste Schritte zum Debuggen

1. App neu laden (Hard Refresh)
2. Als Arbeitgeber einloggen
3. Neuen Job erstellen (mit allen Pflichtfeldern)
4. Als Arbeitnehmer einloggen
5. Auf "Ich habe Zeit" klicken
6. Konsole prüfen - welcher Log erscheint?

## Mögliche Fehlerursachen

### Falls `employerId: 'UNDEFINED'` in Logs:
- Job wurde ohne `employerId` gespeichert
- Lösung: Job neu erstellen (als Arbeitgeber eingeloggt)

### Falls `no user` oder `no profile`:
- Authentifizierung fehlgeschlagen
- Lösung: Neu einloggen, Profil ausfüllen

### Falls keine Logs erscheinen:
- JavaScript-Fehler vor dem Aufruf
- Lösung: Browser-Konsole auf andere Fehler prüfen
