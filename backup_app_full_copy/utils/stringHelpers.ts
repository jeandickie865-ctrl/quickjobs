/**
 * String utility functions for ShiftMatch
 */

/**
 * Get initials from first and last name
 * @example getInitials("John", "Doe") => "J.D."
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || '';
  const last = lastName?.[0]?.toUpperCase() || '';
  
  if (!first && !last) return '?';
  if (!last) return `${first}.`;
  
  return `${first}.${last}.`;
}

/**
 * Check if a timestamp is within the last 24 hours
 */
export function isWithinLast24Hours(timestamp: string): boolean {
  const now = new Date().getTime();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const hours24 = 24 * 60 * 60 * 1000;
  return diff < hours24;
}
