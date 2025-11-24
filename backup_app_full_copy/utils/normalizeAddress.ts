// utils/normalizeAddress.ts
export function normalizeAddress(address: string): string {
  if (!address) return "";

  const parts = address
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return parts.join(", ");
}
