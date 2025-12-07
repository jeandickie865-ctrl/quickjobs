export function parseGermanDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}

export function parseGermanDateTime(dateStr: string, timeStr: string): string | null {
  const date = parseGermanDate(dateStr);
  if (!date) return null;
  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const tParts = timeStr.split(':');
    if (tParts.length >= 1) hours = parseInt(tParts[0], 10) || 0;
    if (tParts.length >= 2) minutes = parseInt(tParts[1], 10) || 0;
  }
  date.setHours(hours, minutes, 0, 0);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatGermanDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Formatiert ein Datum mit deutschem Wochentag
 * Beispiel: "Do. 20.11.2025"
 */
export function formatDateWithWeekday(isoDate?: string): string {
  if (!isoDate) return '';
  
  // QUICK FIX: Falls nur Zeit (z.B. "18:00" oder "1100") übergeben wird, nicht anzeigen
  // Valider ISO-String muss mindestens "YYYY-MM-DD" enthalten
  if (isoDate.length < 10 || !isoDate.includes('-')) {
    console.warn('⚠️ Invalid date format (only time provided):', isoDate);
    return '';
  }
  
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';

  // Deutsche Wochentag-Abkürzungen
  const weekdayShort = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
  const weekday = weekdayShort[d.getDay()];

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${weekday} ${dd}.${mm}.${yyyy}`;
}

/**
 * Formatiert eine Uhrzeit im deutschen Format
 * Beispiel: "18:00"
 */
export function formatTime(isoDateTime?: string): string {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (isNaN(d.getTime())) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return `${hh}:${mm}`;
}

/**
 * Formatiert einen Zeitraum für Job-Anzeige
 * Beispiel: "Do. 20.11.2025 · 18:00–21:30 · Zeitgenauer Einsatz"
 */
export function formatJobTimeDisplay(
  startAt?: string,
  endAt?: string,
  timeMode?: string,
  hours?: number,
  dueAt?: string
): string {
  const parts: string[] = [];

  if (timeMode === 'fixed_time' && startAt) {
    // Datum mit Wochentag
    parts.push(formatDateWithWeekday(startAt));

    // Zeitbereich
    const startTime = formatTime(startAt);
    const endTime = formatTime(endAt);
    if (startTime && endTime) {
      parts.push(`${startTime}–${endTime}`);
    } else if (startTime) {
      parts.push(startTime);
    }

    // Modus
    parts.push('Zeitgenauer Einsatz');
  } else if (timeMode === 'hour_package') {
    // Datum mit Wochentag (falls vorhanden)
    if (startAt) {
      parts.push(formatDateWithWeekday(startAt));
    }

    // Stunden
    if (hours) {
      parts.push(`${hours} Stunden`);
    }

    // Modus
    parts.push('Stundenpaket');
  } else if (timeMode === 'project') {
    // Fälligkeitsdatum
    if (dueAt) {
      parts.push(`Bis ${formatDateWithWeekday(dueAt)}`);
    }

    // Modus
    parts.push('Projektarbeit');
  }

  return parts.filter(Boolean).join(' · ');
}
