import React, { useState, useEffect } from "react";
import { View, TextInput, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { searchAddressSuggestions, geocodeAddress, AddressSuggestion } from "../utils/geocoding";

interface Props {
  street?: string;
  postalCode?: string;
  city?: string;
  houseNumber?: string;
  onStreetChange?: (text: string) => void;
  onPostalCodeChange?: (text: string) => void;
  onCityChange?: (text: string) => void;
  onHouseNumberChange?: (text: string) => void;
  onLatChange?: (lat: number) => void;
  onLonChange?: (lon: number) => void;
}

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
}: Props) {
  // Absichern: alle values dürfen nie undefined sein
  const safeStreet = street ?? "";
  const safePostalCode = postalCode ?? "";
  const safeCity = city ?? "";
  const safeHouseNumber = houseNumber ?? "";

  // Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Geocoding State
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Debounced address search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAddressSuggestions(searchQuery);
      setSuggestions(results);
      setIsSearching(false);
      setShowSuggestions(true);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-geocode when all fields are filled
  useEffect(() => {
    if (!safeStreet || !safeHouseNumber || !safePostalCode || !safeCity) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      const result = await geocodeAddress(
        safeStreet,
        safeHouseNumber,
        safePostalCode,
        safeCity
      );
      
      if (result) {
        onLatChange?.(result.lat);
        onLonChange?.(result.lon);
        console.log('📍 Auto-Geocoding erfolgreich:', result.lat, result.lon);
      }
      setIsGeocoding(false);
    }, 1000); // 1s debounce für Geocoding

    return () => clearTimeout(timer);
  }, [safeStreet, safeHouseNumber, safePostalCode, safeCity]);

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    // Felder füllen
    if (suggestion.street) onStreetChange?.(suggestion.street);
    if (suggestion.houseNumber) onHouseNumberChange?.(suggestion.houseNumber);
    if (suggestion.postalCode) onPostalCodeChange?.(suggestion.postalCode);
    if (suggestion.city) onCityChange?.(suggestion.city);
    
    // Koordinaten setzen
    onLatChange?.(suggestion.lat);
    onLonChange?.(suggestion.lon);
    
    // UI zurücksetzen
    setShowSuggestions(false);
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      {/* Adresssuche */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Adresse suchen (optional)</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="z.B. Hauptstraße 10, 40210 Düsseldorf"
          style={styles.input}
        />
        {isSearching && <ActivityIndicator style={styles.loader} size="small" color="#5941FF" />}
      </View>

      {/* Vorschläge */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(item)}
              >
                <Text style={styles.suggestionText}>{item.displayName}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Straße */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Straße *</Text>
        <TextInput
          value={safeStreet}
          onChangeText={(t) => onStreetChange?.(t)}
          placeholder="Musterstraße"
          style={styles.input}
        />
      </View>

      {/* Hausnummer */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hausnummer *</Text>
        <TextInput
          value={safeHouseNumber}
          onChangeText={(t) => onHouseNumberChange?.(t)}
          placeholder="123"
          style={styles.input}
        />
      </View>

      {/* PLZ und Stadt in einer Reihe */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>PLZ *</Text>
          <TextInput
            value={safePostalCode}
            onChangeText={(t) => onPostalCodeChange?.(t)}
            placeholder="12345"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.label}>Stadt *</Text>
          <TextInput
            value={safeCity}
            onChangeText={(t) => onCityChange?.(t)}
            placeholder="Berlin"
            style={styles.input}
          />
        </View>
      </View>

      {/* Manueller Geocode Button */}
      <TouchableOpacity
        style={styles.geocodeButton}
        onPress={async () => {
          if (!safeStreet || !safeHouseNumber || !safePostalCode || !safeCity) {
            alert('Bitte alle Adressfelder ausfüllen!');
            return;
          }
          
          setIsGeocoding(true);
          const result = await geocodeAddress(
            safeStreet,
            safeHouseNumber,
            safePostalCode,
            safeCity
          );
          
          if (result) {
            onLatChange?.(result.lat);
            onLonChange?.(result.lon);
            alert(`✅ Koordinaten gefunden!\n\nLat: ${result.lat.toFixed(6)}\nLon: ${result.lon.toFixed(6)}`);
          } else {
            alert('❌ Keine Koordinaten gefunden. Bitte Adresse überprüfen.');
          }
          setIsGeocoding(false);
        }}
        disabled={isGeocoding}
      >
        <Text style={styles.geocodeButtonText}>
          {isGeocoding ? '⏳ Berechne...' : '📍 Koordinaten jetzt berechnen'}
        </Text>
      </TouchableOpacity>

      {/* Geocoding Status */}
      {isGeocoding && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#5941FF" />
          <Text style={styles.statusText}>Koordinaten werden berechnet...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#000000",
  },
  loader: {
    position: "absolute",
    right: 12,
    top: 36,
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    maxHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333333",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#666666",
  },
  geocodeButton: {
    backgroundColor: "#5941FF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  geocodeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
