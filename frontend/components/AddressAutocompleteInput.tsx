// components/AddressAutocompleteInput.tsx - BACKUP NEON-TECH (STABLE VERSION)
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, Pressable, ScrollView } from 'react-native';
import { searchAddress } from '../services/geocoding';

type Props = {
  street: string;
  postalCode?: string;
  city?: string;
  onStreetChange?: (value: string) => void;
  onPostalCodeChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
  onLatChange?: (lat: number) => void;
  onLonChange?: (lon: number) => void;
};

export const AddressAutocompleteInput: React.FC<Props> = ({
  street,
  postalCode,
  city,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onLatChange,
  onLonChange,
}) => {
  const [query, setQuery] = useState(street || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Sync query with street prop
  useEffect(() => {
    if (street !== query) {
      setQuery(street);
    }
  }, [street]);

  const handleStreetChange = (value: string) => {
    setQuery(value);
    if (typeof onStreetChange === 'function') onStreetChange(value);

    if (timer.current) clearTimeout(timer.current);
    
    if (value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const result = await searchAddress(value);
        if (Array.isArray(result) && result.length > 0) {
          setSuggestions(result.slice(0, 5));
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (e) {
        console.warn('Geocoding error:', e);
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
  };

  const handleSelect = (item: any) => {
    const selectedStreet = item.label || item.street || '';
    const selectedPostalCode = item.postcode || item.postalCode || '';
    const selectedCity = item.city || '';
    const selectedLat = item.lat || 0;
    const selectedLon = item.lon || 0;

    setQuery(selectedStreet);
    
    // Safe callback invocations
    if (typeof onStreetChange === 'function') {
      onStreetChange(selectedStreet);
    }
    if (typeof onPostalCodeChange === 'function') {
      onPostalCodeChange(selectedPostalCode);
    }
    if (typeof onCityChange === 'function') {
      onCityChange(selectedCity);
    }
    if (typeof onLatChange === 'function') {
      onLatChange(selectedLat);
    }
    if (typeof onLonChange === 'function') {
      onLonChange(selectedLon);
    }

    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <View style={{ width: '100%', marginBottom: 20 }}>
      {/* Straße & Hausnummer */}
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#C8FF16', 
        marginBottom: 8 
      }}>
        Straße & Hausnummer *
      </Text>
      <TextInput
        value={query}
        onChangeText={handleStreetChange}
        placeholder="Straße & Hausnummer"
        placeholderTextColor="#777"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          fontSize: 16,
          color: '#000',
          borderWidth: 2,
          borderColor: '#C8FF16',
        }}
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ScrollView
          style={{
            backgroundColor: '#FFF',
            borderRadius: 12,
            marginTop: 6,
            maxHeight: 180,
            borderWidth: 1,
            borderColor: '#C8FF16',
          }}
          nestedScrollEnabled
        >
          {suggestions.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelect(item)}
              style={({ pressed }) => ({
                padding: 12,
                borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                borderColor: '#EEE',
                backgroundColor: pressed ? 'rgba(200, 255, 22, 0.1)' : 'transparent',
              })}
            >
              <Text style={{ color: '#000', fontSize: 15 }}>
                {item.label || item.street || 'Adresse'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* PLZ */}
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#C8FF16', 
        marginBottom: 8,
        marginTop: 14 
      }}>
        PLZ *
      </Text>
      <TextInput
        value={postalCode || ''}
        onChangeText={(t) => {
          if (typeof onPostalCodeChange === 'function') {
            onPostalCodeChange(t);
          }
        }}
        placeholder="PLZ"
        placeholderTextColor="#777"
        keyboardType="numeric"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          fontSize: 16,
          color: '#000',
          borderWidth: 2,
          borderColor: '#C8FF16',
        }}
      />

      {/* Stadt */}
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#C8FF16', 
        marginBottom: 8,
        marginTop: 14 
      }}>
        Stadt *
      </Text>
      <TextInput
        value={city || ''}
        onChangeText={(t) => {
          if (typeof onCityChange === 'function') {
            onCityChange(t);
          }
        }}
        placeholder="Stadt"
        placeholderTextColor="#777"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          fontSize: 16,
          color: '#000',
          borderWidth: 2,
          borderColor: '#C8FF16',
        }}
      />
    </View>
  );
};
