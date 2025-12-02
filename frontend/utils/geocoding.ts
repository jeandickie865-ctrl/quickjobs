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
 * JETZT ÜBER BACKEND (um CORS-Probleme zu vermeiden)
 */
export async function searchAddressSuggestions(
  query: string
): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) {
    return [];
  }
  
  try {
    // Über Backend-Endpoint suchen
    const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
    const encodedQuery = encodeURIComponent(query);
    const url = `${API_URL}/api/geocoding/search?query=${encodedQuery}`;
    
    console.log('🔍 Searching addresses via backend:', query);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Address search API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('✅ Found', data.length, 'address suggestions');
    
    return data;
  } catch (error) {
    console.error('❌ Address search error:', error);
    return [];
  }
}
