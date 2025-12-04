// app/(worker)/profile-wizard/step2-address.tsx – BACKUP DESIGN

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import AddressAutocompleteInput from '../../../components/AddressAutocompleteInput';
import Slider from '@react-native-community/slider';
import { useWizard } from '../../../contexts/WizardContext';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  neon: '#C8FF16',
  error: '#FF4D4D',
};

export default function Step2Address() {
  const router = useRouter();
  const { wizardData, updateWizardData } = useWizard();

  const [street, setStreet] = useState(wizardData.street || '');
  const [houseNumber, setHouseNumber] = useState(wizardData.houseNumber || '');
  const [postalCode, setPostalCode] = useState(wizardData.postalCode || '');
  const [city, setCity] = useState(wizardData.city || '');
  const [lat, setLat] = useState<number | undefined>(wizardData.lat);
  const [lon, setLon] = useState<number | undefined>(wizardData.lon);
  const [radius, setRadius] = useState(wizardData.radiusKm || 25);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!street.trim()) err.street = 'Straße ist erforderlich';
    if (!postalCode.trim()) err.postalCode = 'PLZ ist erforderlich';
    if (!city.trim()) err.city = 'Stadt ist erforderlich';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateWizardData({ street, houseNumber, postalCode, city, lat, lon, radiusKm: radius });
      router.push('/(worker)/profile-wizard/step3-categories');
    }
  };

  const handleBack = () => {
    updateWizardData({ street, postalCode, city, lat, lon, radiusKm: radius });
    router.push('/(worker)/profile-wizard/step1-basic');
  };

  const isFormValid = street.trim() && postalCode.trim() && city.trim();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ProgressBar currentStep={2} totalSteps={5} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Adresse & Arbeitsbereich</Text>
          <Text style={styles.subtitle}>Wo wohnst du und wie weit möchtest du fahren?</Text>

          {/* Address Autocomplete Input */}
          <View style={styles.card}>
            <AddressAutocompleteInput
              street={street}
              postalCode={postalCode}
              city={city}
              houseNumber={houseNumber}
              onStreetChange={setStreet}
              onPostalCodeChange={setPostalCode}
              onCityChange={setCity}
              onHouseNumberChange={setHouseNumber}
              onLatChange={setLat}
              onLonChange={setLon}
            />

            {/* Errors */}
            {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
            {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          {/* RADIUS */}
          <View style={styles.card}>
            <Text style={styles.label}>Arbeitsradius: {radius} km</Text>

            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={100}
              step={5}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={COLORS.neon}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.neon}
            />

            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabel}>5 km</Text>
              <Text style={styles.radiusLabel}>100 km</Text>
            </View>

            <Text style={styles.helper}>
              Jobs werden dir innerhalb dieses Radius angezeigt
            </Text>
          </View>
        </ScrollView>

        {!isFormValid && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              Bitte gib deine vollständige Adresse ein, um fortzufahren
            </Text>
          </View>
        )}

        <NavigationButtons
          onNext={handleNext}
          onBack={handleBack}
          nextDisabled={!isFormValid}
          showBack={true}
        />
      </SafeAreaView>
    </View>
  );
}

// STYLES — BACKUP DESIGN
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 32,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },

  slider: {
    width: '100%',
    height: 40,
  },

  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  radiusLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  helper: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.muted,
  },

  validationHint: {
    fontSize: 13,
    color: COLORS.neon,
    backgroundColor: 'rgba(200,255,22,0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },

  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
  },
});
