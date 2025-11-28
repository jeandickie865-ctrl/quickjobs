# ShiftMatch - Test Accounts

## Employer Account
- **Email:** katharina@dickies-helden.de
- **Password:** test123
- **Role:** employer
- **User ID:** user_katharina_dickies-helden_de

## Worker Account
- **Email:** worker@test.de  
- **Password:** test123
- **Role:** worker
- **User ID:** user_worker_test_de

---

## Wichtige Hinweise

### Login-Problem John
Der ursprüngliche Worker "john@dickies-helden.de" hatte Auth-Probleme.
Ein neuer Worker-Account wurde erstellt: **worker@test.de**

### Wie man testet:
1. Als Employer einloggen: katharina@dickies-helden.de / test123
2. Job erstellen (Adresse vollständig ausfüllen + "Koordinaten berechnen" drücken!)
3. Als Worker einloggen: worker@test.de / test123
4. Job anschauen und auf "Ich habe Zeit" klicken
5. Employer sieht die Bewerbung in "Matches"

---

## Gelöste Probleme (28.11.2024)

✅ `addJob()` Funktion in jobStore.ts hinzugefügt
✅ Geocoding-Validierung ist aktiv (MUSS für Matching!)
✅ Manueller "Koordinaten berechnen" Button
✅ Worker-Account erstellt
✅ 19 Backup-Dateien entfernt
✅ Import-Fehler (createApplication → addApplication) behoben

## Bekannte offene Punkte

⚠️ DateTime Picker - sollte durch manuelle Eingabe ersetzt werden (zu riskant jetzt)
⚠️ "Ich habe Zeit" Button - benötigt weiteres Testing mit richtigem Worker-Login
