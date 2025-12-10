# Railway Deployment - Schritt-für-Schritt Anleitung

## ⚠️ WICHTIG: Diese Schritte MUSST du in DEINEM lokalen Terminal ausführen!

Ich kann das Backend nicht von hier aus deployen, da Railway mit deinem lokalen System verbunden sein muss.

---

## Schritt 1: MongoDB Atlas einrichten (5 Minuten)

1. Gehe zu: https://www.mongodb.com/cloud/atlas/register
2. Erstelle einen **kostenlosen Account**
3. Klicke auf **"Create"** → **"Shared Cluster"** (M0 - Free)
4. Wähle eine Region (z.B. Frankfurt/Europe)
5. Klicke **"Create Cluster"** (dauert 3-5 Minuten)

### Netzwerk-Zugriff konfigurieren:
6. Gehe zu **"Network Access"** im linken Menü
7. Klicke **"Add IP Address"**
8. Wähle **"Allow Access from Anywhere"**
9. Gib ein: `0.0.0.0/0`
10. Klicke **"Confirm"**

### Datenbank-User erstellen:
11. Gehe zu **"Database Access"**
12. Klicke **"Add New Database User"**
13. Username: `quickjobs`
14. Password: Generiere ein sicheres Passwort (z.B. `QuickJobs2025!Secure`)
15. **SPEICHERE das Passwort irgendwo sicher!**
16. Klicke **"Add User"**

### Connection String kopieren:
17. Gehe zurück zu **"Database"** → Klicke **"Connect"** auf deinem Cluster
18. Wähle **"Connect your application"**
19. Kopiere die **Connection String**
   - Format: `mongodb+srv://quickjobs:<password>@cluster0.xxxxx.mongodb.net/shiftmatch?retryWrites=true&w=majority`
20. **Ersetze `<password>` mit deinem echten Passwort!**
21. **SPEICHERE diesen Connection String** - du brauchst ihn gleich!

---

## Schritt 2: Railway CLI installieren

### Auf MacOS:
```bash
brew install railway
```

### Oder via NPM (alle Systeme):
```bash
npm install -g @railway/cli
```

### Login bei Railway:
```bash
railway login
```
(Dies öffnet deinen Browser für die Authentifizierung)

---

## Schritt 3: Railway Projekt erstellen & Backend deployen

### In deinem Terminal:
```bash
# Navigiere zum Backend-Ordner
cd /pfad/zu/deinem/projekt/backend

# Initialisiere Railway Projekt
railway init

# Wähle: "Create new project"
# Projekt-Name: quickjobs-backend

# Erstelle eine Production Environment
railway environment

# Setze Environment-Variablen
railway variables set MONGO_URL="mongodb+srv://quickjobs:DEIN_PASSWORT@cluster0.xxxxx.mongodb.net/shiftmatch?retryWrites=true&w=majority"
railway variables set DB_NAME="shiftmatch"
railway variables set SECRET_KEY="f65f5b9f1e1ab44b0fc89453c57f7aacda569ce90e8bb5a4df1b876601dde623d0810e4b9bb2f831c9ce2eb30957dce47a02da424388a35a93d4876856e7a13b"
railway variables set ALGORITHM="HS256"
railway variables set ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Deploye das Backend
railway up
```

### ⏳ Warte, bis der Build fertig ist (3-5 Minuten)

---

## Schritt 4: Railway Public URL generieren

### In deinem Terminal:
```bash
# Öffne das Railway Dashboard
railway open
```

### Im Browser (Railway Dashboard):
1. Wähle dein **quickjobs-backend** Projekt
2. Gehe zu **Settings** → **Networking**
3. Klicke **"Generate Domain"**
4. **KOPIERE die URL** (z.B. `quickjobs-backend-production.up.railway.app`)
5. **SCHREIBE mir diese URL hier im Chat!**

---

## Schritt 5: Backend testen

### Teste ob das Backend läuft:
```bash
curl https://DEINE_RAILWAY_URL.up.railway.app/api/health
```

Erwartete Antwort:
```json
{"status":"ok","message":"API is running"}
```

---

## ✅ Sobald du die Railway-URL hast, schreibe sie mir!

Dann passe ich die Frontend `.env` Datei an und erstelle einen neuen iOS Build für TestFlight.

**Format**: `https://quickjobs-backend-production.up.railway.app`

---

## Troubleshooting

### "Build failed" Fehler:
- Prüfe die Logs: `railway logs`
- Stelle sicher, dass der `Dockerfile` korrekt ist

### "Connection to MongoDB failed":
- Prüfe ob `0.0.0.0/0` in der IP Whitelist ist
- Prüfe ob das Passwort im Connection String korrekt ist (keine Sonderzeichen ohne URL-Encoding)

### "Health check failed":
- Warte 1-2 Minuten nach dem Deployment
- Das Backend braucht Zeit zum Starten
