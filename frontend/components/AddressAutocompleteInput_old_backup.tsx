import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

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

  return (
    <View style={styles.container}>
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
});
