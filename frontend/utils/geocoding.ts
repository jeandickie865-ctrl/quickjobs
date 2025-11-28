// utils/geocoding.ts - Geocoding mit Nominatim (OpenStreetMap)

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface AddressSuggestion {
  displayName: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  lat: number;
  lon: number;
}

/**
 * Geocodiert eine vollständige Adresse zu Koordinaten
 * Nutzt Nominatim API (OpenStreetMap) - kostenlos, keine API Keys
 */
export async function geocodeAddress(
  street: string,
  houseNumber: string,
  postalCode: string,
  city: string
): Promise<GeocodingResult | null> {
  try {
    // Vollständige Adresse zusammenbauen
    const fullAddress = `${street} ${houseNumber}, ${postalCode} ${city}, Germany`;
    
    console.log('🗺️ Geocoding address:', fullAddress);
    
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShiftMatch-App/1.0' // Nominatim requires User-Agent
      }
    });
    
    if (!response.ok) {
      console.error('❌ Geocoding API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.log('⚠️ No geocoding results found for:', fullAddress);
      return null;
    }
    
    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    console.log('✅ Geocoding successful:', { lat, lon, displayName: result.display_name });
    
    return {
      lat,
      lon,
      displayName: result.display_name
    };
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
}

/**
 * Sucht Adressvorschläge basierend auf Eingabe
 * Für Autocomplete-Funktionalität
 */
export async function searchAddressSuggestions(
  query: string
): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) {
    return [];
  }
  
  try {
    // Nur in Deutschland suchen
    const searchQuery = `${query}, Germany`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1&countrycodes=de`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShiftMatch-App/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Address search API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      displayName: item.display_name,
      street: item.address?.road,
      houseNumber: item.address?.house_number,
      postalCode: item.address?.postcode,
      city: item.address?.city || item.address?.town || item.address?.village,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error('❌ Address search error:', error);
    return [];
  }
}
