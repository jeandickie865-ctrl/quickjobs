// components/AddressAutocompleteInput.tsx - NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { searchAddress, AddressSuggestion } from '../services/geocoding';

type Props = {
  value: string;
  onChange: (value: string) => void;

  // Automatische Auflösung einer vollständigen Adresse
  onAddressResolved?: (data: {
    street: string;
    postalCode: string;
    city: string;
    lat: number;
    lon: number;
  }) => void;

  placeholder?: string;
  disabled?: boolean;
};

const COLORS = {
  neon: '#C8FF16',
  white: '#FFFFFF',
  lightGray: '#F8F8F8',
  border: '#EEE',
  text: '#000',
  placeholder: '#888',
};

export const AddressAutocompleteInput: React.FC<Props> = ({
  value,
  onChange,
  onAddressResolved,
  placeholder = 'Adresse eingeben (Straße Hausnr, Stadt)',
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timer = useRef<any>(null);

  // Live-Suche
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchAddress(value);
        setSuggestions(results || []);
        setShowDropdown((results || []).length > 0);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  const handleSelect = (item: AddressSuggestion) => {
    onChange(item.label);

    const street = item.street || '';
    const postalCode = item.postcode || '';
    const city = item.city || '';

    onAddressResolved?.({
      street,
      postalCode,
      city,
      lat: item.lat,
      lon: item.lon,
    });

    setShowDropdown(false);
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        style={{
          backgroundColor: disabled ? COLORS.lightGray : COLORS.white,
          borderRadius: 14,
          padding: 14,
          fontSize: 16,
          color: COLORS.text,
          borderWidth: 2,
          borderColor: isFocused ? COLORS.neon : COLORS.border,
        }}
      />

      {isLoading && (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} />
        </View>
      )}

      {showDropdown && suggestions.length > 0 && (
        <ScrollView
          style={{
            backgroundColor: COLORS.white,
            marginTop: 8,
            borderRadius: 12,
            maxHeight: 200,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          {suggestions.map((s, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelect(s)}
              style={({ pressed }) => ({
                padding: 12,
                backgroundColor: pressed ? 'rgba(200, 255, 22, 0.1)' : 'transparent',
                borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.lightGray,
              })}
            >
              <Text style={{ fontSize: 15, color: COLORS.text }}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
