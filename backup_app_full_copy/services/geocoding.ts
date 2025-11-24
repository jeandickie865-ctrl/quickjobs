/**
 * Geocoding Service using Nominatim (OpenStreetMap)
 * Provides address search and coordinate lookup
 */

export type AddressSuggestion = {
  displayName: string;
  street?: string;
  postalCode?: string;
  city?: string;
  lat: number;
  lon: number;
};

/**
 * Search for addresses using Nominatim API
 * @param street - Street name to search for
 * @param postalCode - Optional postal code to narrow down results
 * @param city - Optional city to narrow down results
 * @returns Array of address suggestions
 */
export async function searchAddress(
  street: string,
  postalCode?: string,
  city?: string
): Promise<AddressSuggestion[]> {
  if (!street || street.trim().length < 3) {
    return [];
  }

  try {
    // Build search query
    const parts = [street.trim()];
    if (postalCode) parts.push(postalCode.trim());
    if (city) parts.push(city.trim());
    
    // Add "Deutschland" to limit to Germany
    parts.push('Deutschland');
    
    const query = parts.join(', ');
    
    // Nominatim API call
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=5` +
      `&countrycodes=de`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShiftMatch-App/1.0',
      },
    });

    if (!response.ok) {
      console.warn('Nominatim API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Parse results
    const suggestions: AddressSuggestion[] = data.map((item: any) => {
      const addr = item.address || {};
      
      return {
        displayName: item.display_name,
        street: addr.road || addr.pedestrian || addr.path || undefined,
        postalCode: addr.postcode || undefined,
        city: addr.city || addr.town || addr.village || addr.municipality || undefined,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });

    return suggestions;
  } catch (error) {
    console.error('searchAddress error:', error);
    return [];
  }
}

/**
 * Reverse geocoding: Get address from coordinates
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Address suggestion or null
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<AddressSuggestion | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}` +
      `&lon=${lon}` +
      `&format=json` +
      `&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShiftMatch-App/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const addr = data.address || {};

    return {
      displayName: data.display_name,
      street: addr.road || addr.pedestrian || undefined,
      postalCode: addr.postcode || undefined,
      city: addr.city || addr.town || addr.village || undefined,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
    };
  } catch (error) {
    console.error('reverseGeocode error:', error);
    return null;
  }
}
