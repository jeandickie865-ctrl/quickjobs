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
            backgroundColor: pressed ? 'rgba(200,255,22,0.1)' : COLORS.card,
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
            backgroundColor: pressed ? 'rgba(200,255,22,0.1)' : COLORS.card,
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
