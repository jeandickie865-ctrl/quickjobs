// components/AddressAutocompleteInput.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, Pressable } from 'react-native';

type Props = {
  street: string;
  postalCode: string;
  city: string;
  onStreetChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onLatChange?: (value: number | undefined) => void;
  onLonChange?: (value: number | undefined) => void;
};

export const AddressAutocompleteInput = ({
  street,
  postalCode,
  city,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onLatChange,
  onLonChange,
}: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // WICHTIG: FIX – handler existiert IMMER
  const handleChangeWithAutoGeocode = (text: string) => {
    onStreetChange(text);

    if (text.length < 3) {
      setShowDropdown(false);
      return;
    }

    // Hier später API-Call einbauen
    setSuggestions([
      `${text} Straße 12`,
      `${text} Platz 5`,
      `${text} Weg 8`,
    ]);
    setShowDropdown(true);
  };

  const handleSelectSuggestion = (value: string) => {
    onStreetChange(value);

    // Fake-Daten
    onPostalCodeChange('40699');
    onCityChange('Erkrath');
    onLatChange?.(51.222);
    onLonChange?.(6.908);

    setShowDropdown(false);
  };

  return (
    <View>
      {/* Straße */}
      <Text style={{ marginBottom: 6, fontWeight: '600' }}>Straße & Nr *</Text>
      <TextInput
        value={street}
        onChangeText={handleChangeWithAutoGeocode}
        placeholder="Straße und Hausnummer"
        placeholderTextColor="#888"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          padding: 14,
          borderWidth: 2,
          borderColor: '#EEE',
          marginBottom: 10,
        }}
      />

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <View style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          padding: 10,
          borderWidth: 1,
          borderColor: '#CCC',
          marginBottom: 12,
        }}>
          {suggestions.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => handleSelectSuggestion(s)}
              style={{ paddingVertical: 8 }}
            >
              <Text>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* PLZ */}
      <Text style={{ marginBottom: 6, fontWeight: '600' }}>PLZ *</Text>
      <TextInput
        value={postalCode}
        onChangeText={onPostalCodeChange}
        placeholder="PLZ"
        placeholderTextColor="#888"
        keyboardType="numeric"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          padding: 14,
          borderWidth: 2,
          borderColor: '#EEE',
          marginBottom: 10,
        }}
      />

      {/* Stadt */}
      <Text style={{ marginBottom: 6, fontWeight: '600' }}>Stadt *</Text>
      <TextInput
        value={city}
        onChangeText={onCityChange}
        placeholder="Stadt"
        placeholderTextColor="#888"
        style={{
          backgroundColor: '#FFF',
          borderRadius: 12,
          padding: 14,
          borderWidth: 2,
          borderColor: '#EEE',
          marginBottom: 10,
        }}
      />
    </View>
  );
};
