# iOS UI-Rendering-Fehler Analyse
**Fehler:** "Unbehandelter Fehler – Das Objekt konnte hier nicht gefunden werden"  
**Typ:** Wahrscheinlich React-Invariant Violation (unmounted component update)  
**Datum:** Analysiert am aktuellen Stand

---

## 🎯 ZUSAMMENFASSUNG DER KRITISCHEN BEREICHE

### **P1 - HÖCHSTE PRIORITÄT (Sehr wahrscheinliche Ursachen)**

#### 1. **Worker Profile Wizard - Step 5 Summary** 
**Datei:** `/app/frontend/app/(worker)/profile-wizard/step5-summary.tsx`  
**Zeilen:** 117-129

**Problem:**
```typescript
// Nach erfolgreichem Profil-Save:
resetWizard();                     // Zeile 118 - WizardContext State zurücksetzen
router.replace('/(worker)/profile'); // Zeile 121 - Navigation (unmountet step5-summary)

// Dann NACH Navigation:
setTimeout(() => {
  Alert.alert(                      // Zeilen 125-128 - Alert auf unmounted component!
    'Profil gespeichert! 🎉',
    'Dein Profil wurde erfolgreich gespeichert.'
  );
}, 500);
```

**Warum das ein Problem ist:**
- `router.replace()` unmountet die aktuelle Komponente (step5-summary.tsx)
- Der `setTimeout` callback läuft 500ms NACH dem unmount
- `Alert.alert()` versucht, auf einem nicht mehr existierenden Component zu rendern
- React wirft einen Invariant Violation Error

**Auslöser:**
- User füllt Wizard aus
- Klickt "Profil erstellen"
- handleSave() läuft erfolgreich durch
- Navigation passiert → Component wird unmounted
- 500ms später versucht Alert zu erscheinen → **FEHLER**

---

#### 2. **Worker Matches Screen - Auto-Refresh Interval**
**Datei:** `/app/frontend/app/(worker)/matches.tsx`  
**Zeilen:** 120-142

**Problem:**
```typescript
useFocusEffect(
  React.useCallback(() => {
    loadMatches(); // Initial load
    
    // Auto-refresh alle 5 Sekunden
    intervalRef.current = setInterval(() => {
      loadMatches(true); // Zeile 130 - setState auf unmounted component möglich
    }, 5000);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Zeile 137
      }
    };
  }, [user, authLoading])
);
```

**Warum das ein Problem ist:**
- User ist auf Matches Screen → Interval startet
- User wechselt zu anderem Tab (Feed, Applications, Profile)
- useFocusEffect cleanup läuft und cleared das Interval
- **ABER:** Wenn `loadMatches()` bereits läuft (async), werden State-Updates nach unmount ausgeführt:
  - `setMatches(combined)` (Zeile 105)
  - `setRefreshing(false)` (Zeile 115)
  - `setLoading(false)` (Zeile 113)

**Race Condition Szenario:**
1. Interval feuert bei 4.9 Sekunden → loadMatches() startet
2. User wechselt Tab bei 5.0 Sekunden → Component unmounted + Interval cleared
3. loadMatches() finished bei 5.2 Sekunden → setState auf unmounted component → **FEHLER**

---

#### 3. **AuthContext - Token Validation beim App-Start**
**Datei:** `/app/frontend/contexts/AuthContext.tsx`  
**Zeilen:** 34-79

**Problem:**
```typescript
useEffect(() => {
  loadStoredAuth();
}, []);

const loadStoredAuth = async () => {
  try {
    const [storedToken, storedUser] = await Promise.all([...]);
    
    if (storedToken && storedUser) {
      const response = await fetch(`${API_BASE}/api/jobs`, { // Zeile 51 - Async API Call
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      
      if (response.ok) {
        setToken(storedToken);     // Zeile 61 - State update
        setUser(JSON.parse(storedUser)); // Zeile 62 - State update
      } else {
        await AsyncStorage.clear(); // Zeile 67 - Storage cleared
      }
    }
  } catch (validationError) {
    await AsyncStorage.clear(); // Zeile 71 - Storage cleared
  } finally {
    setLoading(false); // Zeile 77 - State update
  }
};
```

**Warum das ein Problem ist:**
- Läuft beim allerersten App-Mount
- Wenn Token UNGÜLTIG ist:
  - AsyncStorage wird gelöscht
  - AuthContext State bleibt aber aktiv
  - User wird nicht abgemeldet, nur localStorage cleared
- **Wenn App während der Validierung navigiert** (z.B. automatisches Redirect):
  - setState nach unmount möglich

**Kritischer Übergang:**
```
App Start → loadStoredAuth() läuft → Token invalid → AsyncStorage.clear()
         → User wird zu /auth/start redirected (durch _layout.tsx Guards)
         → Aber setState in loadStoredAuth() läuft noch
```

---

### **P2 - MITTLERE PRIORITÄT (Mögliche Ursachen)**

#### 4. **Worker Profile Screen - Doppelte Load-Logik**
**Datei:** `/app/frontend/app/(worker)/profile.tsx`  
**Zeilen:** 34-47

**Problem:**
```typescript
// 1. useEffect bei Mount
useEffect(() => {
  if (authLoading || !user) return;
  loadProfile(); // Zeile 36
}, [user, authLoading]);

// 2. useFocusEffect bei jedem Focus
useFocusEffect(
  React.useCallback(() => {
    if (!authLoading && user) {
      loadProfile(); // Zeile 44
    }
  }, [user, authLoading])
);
```

**Warum das ein Problem ist:**
- **Beide können gleichzeitig laufen** beim ersten Mount
- useEffect feuert → loadProfile() startet
- useFocusEffect feuert (Screen ist focused) → loadProfile() startet erneut
- **Race Condition:** Beide machen State-Updates (setProfile, setLoading, etc.)
- Wenn User schnell navigiert, können setState calls nach unmount passieren

---

#### 5. **Worker Layout - Tab-Switch Match Counter**
**Datei:** `/app/frontend/app/(worker)/_layout.tsx`  
**Zeilen:** 22-41

**Problem:**
```typescript
useFocusEffect(
  React.useCallback(() => {
    if (!user) return;
    
    async function loadMatchesCount() {
      try {
        const apps = await getApplicationsForWorker(user.id);
        const acceptedApps = apps.filter(app => app.status === 'accepted');
        setMatchesCount(acceptedApps.length); // Zeile 33 - setState
      } catch (error) {
        console.error('❌ Error loading matches count:', error);
      }
    }
    
    loadMatchesCount();
  }, [user])
);
```

**Warum das ein Problem ist:**
- Läuft bei **jedem Tab-Wechsel** innerhalb von (worker)
- Async function ohne cleanup
- Wenn User **sehr schnell** zwischen Tabs wechselt:
  - Tab A focused → loadMatchesCount() startet
  - Tab B focused → Component unmounted
  - loadMatchesCount() finisht → setMatchesCount() auf unmounted component

---

#### 6. **Employer Profile - Focus Reload**
**Datei:** `/app/frontend/app/(employer)/profile.tsx`  
**Zeilen:** 41-48

**Gleiches Problem wie Worker Profile:** Doppelte Lade-Logik mit useEffect + useFocusEffect

---

### **P3 - NIEDRIGE PRIORITÄT (Unwahrscheinliche Ursachen)**

#### 7. **Start Screen - Multiple Redirects**
**Datei:** `/app/frontend/app/start.tsx`  
**Zeilen:** 6-32

**Problem:**
```typescript
const { user, isLoading } = useAuth();

if (isLoading) return null;
if (!user) return <Redirect href="/auth/start" />;
if (!user.role) return <Redirect href="/onboarding/role" />;
if (user.role === 'worker') return <Redirect href="/(worker)/feed" />;
if (user.role === 'employer') return <Redirect href="/(employer)" />;
```

**Warum das ein Problem sein könnte:**
- Wenn `user` State sich während Render ändert (durch AuthContext update)
- Mehrere Redirects könnten hintereinander ausgeführt werden
- Wahrscheinlichkeit: NIEDRIG, weil Redirects synchron sind

---

## 🔍 DIAGNOSTISCHE HINWEISE

### Welche Komponente wird kurz vor dem Fehler gerendert?
**Höchstwahrscheinlich:**
1. **step5-summary.tsx** - Wenn User Profil-Wizard abschließt
2. **matches.tsx** - Wenn User zwischen Tabs wechselt
3. **AuthContext-managed Components** - Beim App-Start mit ungültigem Token

### Wird ein router.push() oder router.back() direkt davor ausgeführt?
**JA, in mehreren kritischen Bereichen:**
- **step5-summary.tsx:** `router.replace('/(worker)/profile')` nach Save
- **Alle _layout.tsx:** Automatische `<Redirect>` bei fehlender Auth
- **start.tsx:** Multiple `<Redirect>` basierend auf User-State

### Wird ein State auf null gesetzt während Screen noch rendert?
**JA, möglich in:**
- **AuthContext:** User/Token wird cleared wenn Token ungültig
- **WizardContext:** resetWizard() setzt alle Daten zurück
- **Profile Screens:** setProfile(null) bei Fehler

### Welche Komponente im Stack erzeugt den Fehler?
**Top 3 Verdächtige:**
1. **step5-summary.tsx** (Worker Wizard)
2. **matches.tsx** (Worker Matches Screen)
3. **AuthProvider** (Global Context)

### Der exakte UI/State-Übergang?
**Kritischster Übergang:**
```
User füllt Wizard aus → Klick "Profil erstellen" 
  → handleSave() läuft → Backend-Call erfolgreich
  → resetWizard() (WizardContext State cleared)
  → router.replace() (Komponente wird unmounted)
  → [500ms Pause]
  → Alert.alert() versucht zu rendern
  → React findet Component nicht mehr
  → INVARIANT VIOLATION ERROR
```

---

## 🛠️ EMPFOHLENE FIXES (Nur Analyse, KEINE Implementierung)

### Fix für step5-summary.tsx:
```typescript
// PROBLEM: Alert nach Navigation
setTimeout(() => Alert.alert(...), 500);

// LÖSUNG: Alert VOR Navigation, oder useRef für mounted state
const isMounted = useRef(true);
useEffect(() => () => { isMounted.current = false }, []);

// Dann:
if (isMounted.current) {
  Alert.alert(...);
}
router.replace(...);
```

### Fix für matches.tsx Auto-Refresh:
```typescript
// PROBLEM: setState nach unmount durch Interval

// LÖSUNG: isMounted check in loadMatches()
const isMountedRef = useRef(true);

useFocusEffect(
  React.useCallback(() => {
    isMountedRef.current = true;
    
    // ... interval setup ...
    
    return () => {
      isMountedRef.current = false; // Mark as unmounted
      clearInterval(intervalRef.current);
    };
  }, [])
);

async function loadMatches() {
  // ... fetch data ...
  
  if (isMountedRef.current) {  // Only update if still mounted
    setMatches(...);
  }
}
```

### Fix für AuthContext Token-Validierung:
```typescript
// PROBLEM: setState nach AsyncStorage.clear() + Redirect

// LÖSUNG: Synchrone Navigation vor setState
if (!response.ok) {
  await AsyncStorage.clear();
  setUser(null);    // Trigger Redirects FIRST
  setToken(null);
  setLoading(false);
  return; // Early exit, no further state updates
}
```

---

## 📊 ZUSAMMENFASSUNG

| Komponente | Wahrscheinlichkeit | Auslöser | State-Übergang |
|------------|-------------------|----------|----------------|
| **step5-summary.tsx** | **🔴 SEHR HOCH** | User schließt Wizard ab | resetWizard() + router.replace() + Alert |
| **matches.tsx** | **🟠 HOCH** | User wechselt zwischen Tabs | setInterval + unmount + async setState |
| **AuthContext.tsx** | **🟠 HOCH** | App-Start mit ungültigem Token | AsyncStorage.clear() + setState + Redirect |
| profile.tsx | 🟡 MITTEL | Screen-Focus | Doppelte load-Logik (useEffect + useFocusEffect) |
| _layout.tsx | 🟡 MITTEL | Tab-Wechsel | Async load ohne cleanup |
| start.tsx | 🟢 NIEDRIG | User-State Änderung | Multiple Redirects |

---

## ✅ NÄCHSTE SCHRITTE FÜR DEBUGGING

1. **iOS Safari Developer Console öffnen**
   - Fehler-Stack anschauen
   - Welche Komponente steht im Stack?

2. **React DevTools (Expo)**
   - Component-Tree anschauen beim Fehler
   - Welche Components werden unmounted?

3. **Console.logs hinzufügen:**
```typescript
// In step5-summary.tsx
console.log('🔍 [STEP5] Before resetWizard()');
resetWizard();
console.log('🔍 [STEP5] Before router.replace()');
router.replace('/(worker)/profile');
console.log('🔍 [STEP5] After router.replace()');

// In setTimeout
setTimeout(() => {
  console.log('🔍 [STEP5] Inside setTimeout - about to show Alert');
  Alert.alert(...);
}, 500);
```

4. **User-Flow reproduzieren:**
   - Welcher Flow führt zum Fehler?
   - Wizard abschließen? Tab-Wechsel? App-Start?

5. **Expo Error Logs prüfen:**
```bash
tail -f /var/log/supervisor/expo-stderr*.log
```

---

**Ende der Analyse**
