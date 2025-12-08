// app/(worker)/profile-wizard/step1-basic.tsx
// BASISDATEN + FOTO - Quickjobs DESIGN

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Platform,
  Alert,
  StyleSheet,
  KeyboardAvoidingView
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';

import { useAuth } from '../../../contexts/AuthContext';
import { useWizard } from '../../../contexts/WizardContext';

import { getWorkerProfile } from '../../../utils/profileStore';


export default function Step1Basic() {
  const router = useRouter();
  const { user } = useAuth();
  const { wizardData, updateWizardData } = useWizard();

  const [photoUrl, setPhotoUrl] = useState(wizardData.photoUrl || '');
  const [firstName, setFirstName] = useState(wizardData.firstName || '');
  const [lastName, setLastName] = useState(wizardData.lastName || '');
  const [shortBio, setShortBio] = useState(wizardData.shortBio || '');
  const [phone, setPhone] = useState(wizardData.phone || '');
  const [isSelfEmployed, setIsSelfEmployed] = useState(wizardData.isSelfEmployed || false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Profil laden
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getWorkerProfile(user.id);

        if (profile) {
          updateWizardData({
            photoUrl: profile.photoUrl || profile.profilePhotoUri || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            shortBio: profile.shortBio || '',
            phone: profile.phone || '',
            isSelfEmployed: profile.isSelfEmployed || false,
            street: profile.homeAddress?.street || '',
            postalCode: profile.homeAddress?.postalCode || '',
            city: profile.homeAddress?.city || '',
            lat: profile.homeLat,
            lon: profile.homeLon,
            radiusKm: profile.radiusKm || 25,
            selectedCategories: profile.categories || [],
            selectedSkills: profile.selectedTags || []
          });

          setPhotoUrl(profile.photoUrl || profile.profilePhotoUri || '');
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setShortBio(profile.shortBio || '');
          setPhone(profile.phone || '');
          setIsSelfEmployed(profile.isSelfEmployed || false);
        }
      } catch (err) {
        console.error('Fehler beim Laden des Profils:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, [user?.id]);

  const getInitials = () => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Bild wählen
  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => setPhotoUrl(event.target.result);
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';
    if (!phone.trim()) newErrors.phone = 'Telefonnummer ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateWizardData({ photoUrl, firstName, lastName, shortBio, phone, isSelfEmployed });
      router.push('/(worker)/profile-wizard/step2-address');
    }
  };

  const isFormValid = firstName.trim() && lastName.trim() && phone.trim();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <AppHeader />
          <Text style={{ color: COLORS.white }}>Lade Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          
          {/* Quickjobs HEADER */}
          <View style={styles.backupHeader}>
            <Text style={styles.headerBackupTitle}>Quickjobs</Text>
          </View>

          <ProgressBar currentStep={1} totalSteps={5} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Basisdaten</Text>
            <Text style={styles.subtitle}>Erzähle kurz etwas über dich</Text>

            {/* PHOTO */}
            <View style={styles.photoSection}>
              <Text style={styles.label}>Profilfoto</Text>

              <View style={styles.photoContainer}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoInitials}>{getInitials()}</Text>
                  </View>
                )}

                <Pressable onPress={pickImage} style={styles.photoButton}>
                  <Ionicons name="camera" size={20} color={COLORS.bg} />
                </Pressable>
              </View>

              <Pressable onPress={pickImage} style={styles.changePhotoButton}>
                <Text style={styles.changePhotoText}>Foto ändern</Text>
              </Pressable>

              {errors.photoUrl && <Text style={styles.errorText}>{errors.photoUrl}</Text>}
            </View>

            {/* FIRST NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vorname *</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Max"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            {/* LAST NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nachname *</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Mustermann"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            {/* SELF EMPLOYED - Moved here for easy access */}
            <Pressable 
              onPress={() => {
                console.log('Checkbox clicked!');
                setIsSelfEmployed(!isSelfEmployed);
              }} 
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkbox, isSelfEmployed && styles.checkboxChecked]}>
                {isSelfEmployed && <Ionicons name="checkmark" size={18} color={COLORS.bg} />}
              </View>
              <Text style={styles.checkboxLabel}>Ich bin selbstständig</Text>
            </Pressable>

            {/* SHORT BIO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Über mich</Text>
              <TextInput
                value={shortBio}
                onChangeText={setShortBio}
                placeholder="Erzähl kurz etwas über dich…"
                placeholderTextColor={COLORS.placeholder}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefonnummer *</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+49 123 456789"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="phone-pad"
                style={styles.input}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* HINT */}
            {!isFormValid && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.validationHint}>Bitte fülle alle Pflichtfelder aus</Text>
              </View>
            )}
          </ScrollView>

          <NavigationButtons
            onNext={handleNext}
            nextDisabled={!isFormValid}
            showBack={false}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  safeArea: {
    flex: 1
  },

  /* Quickjobs HEADER */
  backupHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10
  },
  headerBackupTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900'
  },
  headerNeonLine: {
    height: 2,
    backgroundColor: COLORS.neon,
    marginTop: 8,
    width: '100%'
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 160 },

  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 28
  },

  /* PHOTO */
  photoSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.neon
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    borderWidth: 4,
    borderColor: COLORS.neon,
    alignItems: 'center',
    justifyContent: 'center'
  },
  photoInitials: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white
  },
  photoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neon,
    alignItems: 'center',
    justifyContent: 'center'
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  changePhotoText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14
  },

  /* INPUTS */
  inputGroup: {
    marginBottom: 22
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.cardText
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top'
  },

  errorText: {
    color: '#EFABFF',
    fontSize: 12,
    marginTop: 6
  },

  /* CHECKBOX */
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: COLORS.neon,
    borderColor: COLORS.neon
  },
  checkboxLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500'
  },

  validationHint: {
    color: COLORS.neon,
    backgroundColor: 'rgba(200,255,22,0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14
  }
});
