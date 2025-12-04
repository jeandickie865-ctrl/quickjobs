// app/(worker)/profile-wizard/step5-summary.tsx – BACKUP D+ DESIGN
import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';
import { useAuth } from '../../../contexts/AuthContext';

const COLORS = {
  bg: '#0A0816',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  neon: '#C8FF16',
  purple: '#6B4BFF',
};

export default function Step5Summary() {
  const router = useRouter();
  const { wizardData, resetWizard } = useWizard();
  const { user, token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const profileData = {
    photoUrl: wizardData.photoUrl,
    firstName: wizardData.firstName,
    lastName: wizardData.lastName,
    phone: wizardData.phone,
    email: user?.email || '',
    street: wizardData.street,
    postalCode: wizardData.postalCode,
    city: wizardData.city,
    radius: wizardData.radiusKm,
    categories: wizardData.categories || [],
    subcategories: wizardData.subcategories || [],
    qualifications: wizardData.qualifications || [],
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        firstName: wizardData.firstName || '',
        lastName: wizardData.lastName || '',
        phone: wizardData.phone || '',
        email: user?.email || '',
        shortBio: wizardData.shortBio || '',
        photoUrl: wizardData.photoUrl || '',
        isSelfEmployed: wizardData.isSelfEmployed || false,
        categories: wizardData.selectedCategories || wizardData.categories || [],
        subcategories: wizardData.selectedSubcategories || wizardData.subcategories || [],
        qualifications: wizardData.selectedQualifications || wizardData.qualifications || [],
        radiusKm: wizardData.radiusKm || 25,
        homeAddress: {
          street: wizardData.street || '',
          houseNumber: wizardData.houseNumber || '',
          city: wizardData.city || '',
          postalCode: wizardData.postalCode || '',
          country: 'Deutschland'
        },
        homeLat: wizardData.lat,
        homeLon: wizardData.lon,
      };

      const backend = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const userId = user?.id || '';

      let res = await fetch(`${backend}/api/profiles/worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        res = await fetch(`${backend}/api/profiles/worker/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();

      resetWizard();
      router.replace('/(worker)/profile');

      setTimeout(() => {
        if (isMounted.current) {
          Alert.alert('Erfolgreich', 'Profil gespeichert.');
        }
      }, 300);

    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/(worker)/profile-wizard/step4-skills');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>

          <ProgressBar currentStep={5} totalSteps={5} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ ...styles.scrollContent, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
          <Text style={styles.title}>Zusammenfassung</Text>
          <Text style={styles.subtitle}>Überprüfe deine Angaben</Text>

          {/* PHOTO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profilbild</Text>
            <View style={styles.photoContainer}>
              {profileData.photoUrl ? (
                <Image source={{ uri: profileData.photoUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitials}>
                    {profileData.firstName?.charAt(0)}
                    {profileData.lastName?.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* BASIC DATA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basisdaten</Text>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={COLORS.neon} />
              <Text style={styles.infoText}>
                {profileData.firstName} {profileData.lastName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={COLORS.neon} />
              <Text style={styles.infoText}>{profileData.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={COLORS.neon} />
              <Text style={styles.infoText}>{profileData.email}</Text>
            </View>
          </View>

          {/* ADDRESS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.neon} />
              <Text style={styles.infoText}>
                {profileData.street}, {profileData.postalCode} {profileData.city}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={COLORS.neon} />
              <Text style={styles.infoText}>
                Radius: {profileData.radius} km
              </Text>
            </View>
          </View>

          {/* CATEGORIES */}
          {profileData.categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategorien</Text>
              <View style={styles.tagContainer}>
                {profileData.categories.map((cat, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* SUBCATEGORIES */}
          {profileData.subcategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tätigkeiten</Text>
              <View style={styles.tagContainer}>
                {profileData.subcategories.map((sub, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{sub}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* QUALIFICATIONS */}
          {profileData.qualifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qualifikationen</Text>
              <View style={styles.tagContainer}>
                {profileData.qualifications.map((q, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{q}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <NavigationButtons
          onNext={handleSave}
          onBack={handleBack}
          nextDisabled={isSaving}
          showBack={true}
          nextLabel={isSaving ? 'Speichern...' : 'Profil erstellen'}
        />

        {isSaving && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.neon} />
            <Text style={styles.loadingText}>Profil wird erstellt...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },

  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 16, color: COLORS.muted, marginBottom: 28 },

  section: { marginBottom: 36 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 16 },

  photoContainer: { alignItems: 'center' },
  photo: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.neon },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: { fontSize: 32, fontWeight: '700', color: COLORS.purple },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoText: { fontSize: 16, color: COLORS.text, flex: 1 },

  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: COLORS.text, marginTop: 14, fontSize: 15, fontWeight: '600' },
});
