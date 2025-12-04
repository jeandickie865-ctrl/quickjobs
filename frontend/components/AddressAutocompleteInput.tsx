// components/AddressAutocompleteInput.tsx – BACKUP DARK ULTRA CLEAN

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
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  neon: '#C8FF16',
};

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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function search(q: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!q || q.length < 3) {
      setSuggestions([]);
      setShow(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          q
        )}`;

        const res = await fetch(url);
        const data = await res.json();

        setSuggestions(data || []);
        setShow(data.length > 0);
      } catch {
        setSuggestions([]);
        setShow(false);
      }
    }, 350);
  }

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
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
      </View>

      {/* HOUSE NUMBER */}
      <View style={styles.group}>
        <Text style={styles.label}>Hausnummer</Text>
        <TextInput
          value={houseNumber}
          onChangeText={onHouseNumberChange}
          placeholder="Nr."
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
      </View>

      {/* POSTAL CODE */}
      <View style={styles.group}>
        <Text style={styles.label}>PLZ *</Text>
        <TextInput
          value={postalCode}
          onChangeText={onPostalCodeChange}
          placeholder="PLZ"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      {/* CITY */}
      <View style={styles.group}>
        <Text style={styles.label}>Stadt *</Text>
        <TextInput
          value={city}
          onChangeText={onCityChange}
          placeholder="Stadt"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
      </View>

      {/* KOORDINATEN-BUTTON */}
      <Pressable
        onPress={async () => {
          // Standort-Zugriff (optional)
          try {
            const { status } = await import('expo-location').then(m => m.requestForegroundPermissionsAsync());
            if (status === 'granted') {
              const location = await import('expo-location').then(m => m.getCurrentPositionAsync({}));
              onLatChange(location.coords.latitude);
              onLonChange(location.coords.longitude);
              
              // Reverse Geocoding
              const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`;
              const res = await fetch(url);
              const data = await res.json();
              
              if (data && data.address) {
                onStreetChange(data.address.road || '');
                onHouseNumberChange(data.address.house_number || '');
                onPostalCodeChange(data.address.postcode || '');
                onCityChange(data.address.city || data.address.town || data.address.village || '');
              }
            }
          } catch (err) {
            console.log('Standort-Fehler:', err);
          }
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? COLORS.border : COLORS.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.neon,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 8,
        })}
      >
        <Text style={{ color: COLORS.neon, fontSize: 14, fontWeight: '700' }}>
          📍 Aktuellen Standort verwenden
        </Text>
      </Pressable>

      {/* AUTOCOMPLETE DROPDOWN */}
      {show && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 220 }}>
            {suggestions.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => select(s)}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: pressed ? '#1D1A2B' : COLORS.card },
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

// BACKUP STYLE
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
    shadowOpacity: 0.4,
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
