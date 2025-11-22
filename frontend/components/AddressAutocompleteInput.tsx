// components/AddressAutocompleteInput.tsx - FINAL VERSION with OpenStreetMap Nominatim
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

interface AddressAutocompleteInputProps {
  street?: string;
  postalCode?: string;
  city?: string;

  onStreetChange?: (v: string) => void;
  onPostalCodeChange?: (v: string) => void;
  onCityChange?: (v: string) => void;
  onLatChange?: (v: number) => void;
  onLonChange?: (v: number) => void;
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  street,
  postalCode,
  city,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onLatChange,
  onLonChange,
}) => {
  const [query, setQuery] = useState(street ?? '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(street ?? '');
  }, [street]);

  useEffect(() => {
    if (!isFocused) return;

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              'User-Agent': 'BACKUP-App/1.0',
            },
          }
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.warn('Geocoding error:', e);
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isFocused]);

  const selectSuggestion = (item: any) => {
    const addr = item.address ?? {};

    const streetName = [addr.road, addr.house_number].filter(Boolean).join(' ');

    if (typeof onStreetChange === 'function') onStreetChange(streetName);
    if (typeof onPostalCodeChange === 'function')
      onPostalCodeChange(addr.postcode ?? '');
    if (typeof onCityChange === 'function')
      onCityChange(addr.city ?? addr.town ?? addr.village ?? '');

    if (typeof onLatChange === 'function') onLatChange(parseFloat(item.lat));
    if (typeof onLonChange === 'function') onLonChange(parseFloat(item.lon));

    setQuery(streetName);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      {/* Straße & Hausnummer */}
      <Text style={styles.label}>Straße & Hausnummer *</Text>
      <TextInput
        value={query}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
        }}
        onChangeText={(text) => setQuery(text)}
        placeholder="Straße & Hausnummer"
        placeholderTextColor="#777"
        style={styles.input}
      />

      {/* Autocomplete Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.scrollView} nestedScrollEnabled>
            {suggestions.map((s, i) => {
              const a = s.address ?? {};
              const label = [
                a.road,
                a.house_number,
                a.postcode,
                a.city || a.town || a.village,
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <Pressable
                  key={i}
                  onPress={() => selectSuggestion(s)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && styles.suggestionItemPressed,
                  ]}
                >
                  <Text style={styles.suggestionText}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* PLZ */}
      <Text style={[styles.label, styles.labelMarginTop]}>PLZ *</Text>
      <TextInput
        value={postalCode ?? ''}
        onChangeText={(text) => {
          if (typeof onPostalCodeChange === 'function') onPostalCodeChange(text);
        }}
        placeholder="PLZ"
        placeholderTextColor="#777"
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Stadt */}
      <Text style={[styles.label, styles.labelMarginTop]}>Stadt *</Text>
      <TextInput
        value={city ?? ''}
        onChangeText={(text) => {
          if (typeof onCityChange === 'function') onCityChange(text);
        }}
        placeholder="Stadt"
        placeholderTextColor="#777"
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#C8FF16',
    fontWeight: '600',
    marginBottom: 8,
  },
  labelMarginTop: {
    marginTop: 14,
  },
  input: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#C8FF16',
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#C8FF16',
    borderRadius: 12,
    marginTop: 4,
    zIndex: 999,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    maxHeight: 180,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  suggestionItemPressed: {
    backgroundColor: 'rgba(200, 255, 22, 0.1)',
  },
  suggestionText: {
    fontSize: 15,
    color: '#000',
  },
});

export default AddressAutocompleteInput;
