export type Address = {
  street?: string;      // z. B. "Musterstraße"
  houseNumber?: string; // z. B. "5"
  postalCode?: string;  // z. B. "40210"
  city?: string;        // z. B. "Düsseldorf"
};

/**
 * Formatiert eine Address als lesbaren String
 * @param address - Die zu formatierende Adresse
 * @param compact - Wenn true, kurzes Format (nur PLZ + Stadt)
 * @returns Formatierter String oder leerer String
 */
export function formatAddress(address?: Address, compact: boolean = false): string {
  if (!address) return '';
  
  if (compact) {
    // Kompakt: "40210 Düsseldorf"
    const parts = [];
    if (address.postalCode) parts.push(address.postalCode);
    if (address.city) parts.push(address.city);
    return parts.join(' ');
  }
  
  // Vollständig: "Musterstraße 5, 40210 Düsseldorf"
  const parts = [];
  if (address.street) {
    const streetPart = address.houseNumber 
      ? `${address.street} ${address.houseNumber}` 
      : address.street;
    parts.push(streetPart);
  }
  
  const cityPart = [];
  if (address.postalCode) cityPart.push(address.postalCode);
  if (address.city) cityPart.push(address.city);
  if (cityPart.length > 0) parts.push(cityPart.join(' '));
  
  return parts.join(', ');
}

/**
 * Prüft ob eine Adresse mindestens ein Feld ausgefüllt hat
 */
export function isAddressValid(address?: Address): boolean {
  if (!address) return false;
  return !!(address.street || address.postalCode || address.city);
}
