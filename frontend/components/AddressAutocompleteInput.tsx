// components/AddressAutocompleteInput.tsx – Quickjobs LIGHT THEME

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet
} from 'react-native';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E9D5FF',
  text: '#1A1A1A',
  muted: '#6B7280',
  neon: '#EFABFF',
  placeholder: '#9CA3AF',
};

// CACHE: Response Caching (max 50 entries, 10 min TTL)
interface CacheEntry {
  results: any[];
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_MAX_SIZE = 50;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function AddressAutocompleteInput({
  street,
  postalCode,
  city,
  houseNumber,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onHouseNumberChange,
  onLatChange,
  onLonChange,
}) {
  // STATE
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  // DEBOUNCE: Wait 300ms after user stops typing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // REQUEST ID GUARD: Only use response from latest request
  const requestIdRef = useRef(0);

  // CACHE MANAGEMENT: Add to cache with FIFO eviction
  function addToCache(query: string, results: any[]) {
    // Remove oldest if cache is full
    if (searchCache.size >= CACHE_MAX_SIZE) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }

    searchCache.set(query, {
      results,
      timestamp: Date.now(),
    });
  }

  // CACHE RETRIEVAL: Get from cache if valid
  function getFromCache(query: string): any[] | null {
    const cached = searchCache.get(query);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL) {
      searchCache.delete(query);
      return null;
    }

    return cached.results;
  }

  // SEARCH FUNCTION: Fetch suggestions with caching & request guards
  async function search(q: string) {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset if query too short
    if (!q || q.length < 3) {
      setSuggestions([]);
      setShow(false);
      return;
    }

    // DEBOUNCE: Wait 300ms before executing
    debounceTimerRef.current = setTimeout(async () => {
      // Check cache first
      const cachedResults = getFromCache(q);
      if (cachedResults !== null) {
        setSuggestions(cachedResults);
        setShow(cachedResults.length > 0);
        return;
      }

      // REQUEST ID GUARD: Increment request counter
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        const data = await res.json();

        // REQUEST ID GUARD: Only use if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const results = data || [];

        // Add to cache
        addToCache(q, results);

        setSuggestions(results);
        setShow(results.length > 0);
      } catch {
        // REQUEST ID GUARD: Only update if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setSuggestions([]);
        setShow(false);
      }
    }, 300);
  }

  // SELECT HANDLER: Fill form with selected address
  function select(item: any) {
    const addr = item.address || {};

    onStreetChange(addr.road || '');
    onHouseNumberChange(addr.house_number || '');
    onPostalCodeChange(addr.postcode || '');
    onCityChange(addr.city || addr.town || addr.village || '');

    onLatChange(parseFloat(item.lat));
    onLonChange(parseFloat(item.lon));

    setShow(false);
    setSuggestions([]);
  }

  return (
    <View style={{ marginBottom: 8 }}>
      {/* STREET */}
      <View style={styles.group}>
        <Text style={styles.label}>Straße *</Text>

        <TextInput
          value={street}
          onChangeText={(t) => {
            onStreetChange(t);
            search(t);
          }}
          placeholder="Straße"
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* HOUSE NUMBER */}
      <View style={styles.group}>
        <Text style={styles.label}>Hausnummer</Text>
        <TextInput
          value={houseNumber}
          onChangeText={onHouseNumberChange}
          placeholder="Nr."
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* POSTAL CODE */}
      <View style={styles.group}>
        <Text style={styles.label}>PLZ *</Text>
        <TextInput
          value={postalCode}
          onChangeText={onPostalCodeChange}
          placeholder="PLZ"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="numeric"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* CITY */}
      <View style={styles.group}>
        <Text style={styles.label}>Stadt *</Text>
        <TextInput
          value={city}
          onChangeText={onCityChange}
          placeholder="Stadt"
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* GPS-STANDORT BUTTON */}
      <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
        <Pressable
          onPress={async () => {
            try {
              const Location = await import('expo-location');
              const { status } = await Location.requestForegroundPermissionsAsync();
              
              if (status !== 'granted') {
                alert('Standort-Berechtigung wurde nicht erteilt');
                return;
              }

              const location = await Location.getCurrentPositionAsync({});
              const { latitude, longitude } = location.coords;
              
              // Koordinaten setzen
              onLatChange(latitude);
              onLonChange(longitude);
              
              // Reverse Geocoding für Adresse
              const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
              const res = await fetch(url);
              const data = await res.json();
              
              if (data && data.address) {
                onStreetChange(data.address.road || '');
                onHouseNumberChange(data.address.house_number || '');
                onPostalCodeChange(data.address.postcode || '');
                onCityChange(data.address.city || data.address.town || data.address.village || '');
              }
            } catch (err) {
              console.error('GPS-Fehler:', err);
              alert('Standort konnte nicht abgerufen werden');
            }
          }}
          style={({ pressed }) => ({
            width: '60%',
            maxWidth: 380,
            backgroundColor: pressed ? 'rgba(239,171,255,0.2)' : COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.neon,
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text style={{ color: COLORS.neon, fontSize: 14, fontWeight: '700' }}>
            Aktueller GPS-Standort
          </Text>
        </Pressable>
      </View>

      {/* KOORDINATEN AUS ADRESSE BERECHNEN */}
      <View style={{ width: '100%', alignItems: 'center', marginTop: 8 }}>
        <Pressable
          onPress={async () => {
            try {
              // Adresse zusammenbauen
              const addressParts = [];
              if (street) addressParts.push(street);
              if (houseNumber) addressParts.push(houseNumber);
              if (postalCode) addressParts.push(postalCode);
              if (city) addressParts.push(city);
              
              if (addressParts.length === 0) {
                alert('Bitte gib zuerst eine Adresse ein');
                return;
              }
              
              const addressString = addressParts.join(', ');
              
              // Forward Geocoding
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`;
              const res = await fetch(url);
              const data = await res.json();
              
              if (data && data.length > 0) {
                const result = data[0];
                onLatChange(parseFloat(result.lat));
                onLonChange(parseFloat(result.lon));
                alert('Koordinaten erfolgreich berechnet!');
              } else {
                alert('Keine Koordinaten für diese Adresse gefunden');
              }
            } catch (err) {
              console.error('Geocoding-Fehler:', err);
              alert('Koordinaten konnten nicht berechnet werden');
            }
          }}
          style={({ pressed }) => ({
            width: '60%',
            maxWidth: 380,
            backgroundColor: pressed ? 'rgba(239,171,255,0.2)' : COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.neon,
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text style={{ color: COLORS.neon, fontSize: 14, fontWeight: '700' }}>
            Koordinaten berechnen
          </Text>
        </Pressable>
      </View>

      {/* AUTOCOMPLETE DROPDOWN */}
      {show && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView 
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => select(s)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: pressed ? '#F3E8FF' : COLORS.card },
                ]}
              >
                <Text style={styles.itemText}>
                  {s.display_name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Quickjobs LIGHT THEME STYLES
const styles = StyleSheet.create({
  group: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },

  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 260,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 12,
    zIndex: 999,
  },

  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  itemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
