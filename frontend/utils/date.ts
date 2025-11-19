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
