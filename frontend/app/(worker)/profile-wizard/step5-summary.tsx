// app/(worker)/profile-wizard/step5-summary.tsx - ZUSAMMENFASSUNG
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useWizard } from '../../../contexts/WizardContext';
import { useAuth } from '../../../contexts/AuthContext';

const COLORS = {
  purple: '#5941FF',
  purpleDark: '#3E2DD9',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#999',
  lightGray: '#F5F5F5',
  error: '#FF4D4D',
};

export default function Step5Summary() {
  const router = useRouter();
  const { wizardData, resetWizard } = useWizard();
  const { user, token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if component is still mounted to prevent Alert on unmounted component
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get all data from context
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
    categories: wizardData.selectedCategories,
    subcategories: wizardData.selectedSubcategories || [],
    qualifications: wizardData.selectedQualifications || [],
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare profile data for backend - WICHTIG: Alles aus wizardData!
      const profilePayload = {
        firstName: wizardData.firstName || '',
        lastName: wizardData.lastName || '',
        phone: wizardData.phone || '',
        email: user?.email || '',
        shortBio: wizardData.shortBio || '',
        photoUrl: wizardData.photoUrl || '',
        isSelfEmployed: wizardData.isSelfEmployed || false,
        categories: wizardData.selectedCategories || [],
        subcategories: wizardData.selectedSubcategories || [],
        qualifications: wizardData.selectedQualifications || [],
        // Backward compatibility: combine subcategories + qualifications into selectedTags
        selectedTags: [
          ...(wizardData.selectedSubcategories || []),
          ...(wizardData.selectedQualifications || [])
        ],
        radiusKm: wizardData.radiusKm || 25,
        homeAddress: {
          street: wizardData.street || '',
          house_number: wizardData.houseNumber || '',
          city: wizardData.city || '',
          postal_code: wizardData.postalCode || '',
          country: 'Deutschland'
        },
        homeLat: wizardData.lat,
        homeLon: wizardData.lon,
      };

      console.log('💾 Saving profile with data from wizardData:', profilePayload);
      console.log('📊 Wizard Data Check:', {
        categories: wizardData.selectedCategories,
        subcategories: wizardData.selectedSubcategories,
        qualifications: wizardData.selectedQualifications,
        lat: wizardData.lat,
        lon: wizardData.lon
      });

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const userId = user?.id || '';
      
      console.log('🔑 Authorization info:', {
        userId,
        token,
        authHeader: `Bearer ${token}`
      });
      
      // Try POST first (create new profile)
      let response = await fetch(`${backendUrl}/api/profiles/worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      // If profile already exists (400), use PUT to update
      if (response.status === 400) {
        console.log('Profile exists, updating instead...');
        response = await fetch(`${backendUrl}/api/profiles/worker/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(profilePayload),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedProfile = await response.json();
      console.log('Profile saved successfully:', savedProfile);
      
      // Reset wizard data after successful save
      resetWizard();
      
      // Navigate to profile page
      router.replace('/(worker)/profile');
      
      // Show success message after navigation (only if component is still mounted)
      setTimeout(() => {
        if (isMounted.current) {
          Alert.alert(
            'Profil gespeichert! 🎉',
            'Dein Profil wurde erfolgreich gespeichert.'
          );
        }
      }, 500);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Fehler',
        'Profil konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/(worker)/profile-wizard/step4-skills');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Progress */}
        <ProgressBar currentStep={5} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Zusammenfassung</Text>
          <Text style={styles.subtitle}>
            Überprüfe deine Angaben
          </Text>

          {/* Profile Photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profilbild</Text>
            <View style={styles.photoContainer}>
              {profileData.photoUrl ? (
                <Image source={{ uri: profileData.photoUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitials}>
                    {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basisdaten</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={COLORS.white} />
              <Text style={styles.infoText}>
                {profileData.firstName} {profileData.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={COLORS.white} />
              <Text style={styles.infoText}>{profileData.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={COLORS.white} />
              <Text style={styles.infoText}>{profileData.email}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse & Arbeitsbereich</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.white} />
              <Text style={styles.infoText}>
                {profileData.street}, {profileData.postalCode} {profileData.city}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="navigate" size={20} color={COLORS.white} />
              <Text style={styles.infoText}>Arbeitsradius: {profileData.radius} km</Text>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategorien</Text>
            <View style={styles.tagContainer}>
              {profileData.categories.map((cat, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Subcategories */}
          {profileData.subcategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tätigkeiten</Text>
              <View style={styles.tagContainer}>
                {profileData.subcategories.map((sub, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{sub}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Qualifications */}
          {profileData.qualifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qualifikationen</Text>
              <View style={styles.tagContainer}>
                {profileData.qualifications.map((qual, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{qual}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.neon,
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.neon,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.neon,
  },
  photoInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.purple,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.white,
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.neon,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.purple,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
