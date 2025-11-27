// app/(worker)/profile-wizard/step1-basic.tsx - BASISDATEN + FOTO
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Platform, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProgressBar } from '../../../components/wizard/ProgressBar';
import { NavigationButtons } from '../../../components/wizard/NavigationButtons';
import { useAuth } from '../../../contexts/AuthContext';
import { useWizard } from '../../../contexts/WizardContext';
import { getWorkerProfile } from '../../../utils/profileStore';

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

  // Load existing profile when component mounts
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('📥 Lade existierendes Profil für Bearbeitung...');
        const profile = await getWorkerProfile(user.id);
        
        if (profile) {
          console.log('✅ Profil gefunden, fülle Wizard-Daten:', profile);
          
          // Update wizard context with existing profile data
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
            selectedSkills: profile.selectedTags || [],
          });
          
          // Update local state
          setPhotoUrl(profile.photoUrl || profile.profilePhotoUri || '');
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setShortBio(profile.shortBio || '');
          setPhone(profile.phone || '');
          setIsSelfEmployed(profile.isSelfEmployed || false);
        } else {
          console.log('ℹ️ Kein Profil gefunden - neues Profil wird erstellt');
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden des Profils:', error);
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
            reader.onload = (event: any) => {
              setPhotoUrl(event.target.result);
            };
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!photoUrl) newErrors.photoUrl = 'Profilfoto ist erforderlich';
    if (!firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';
    if (!phone.trim()) newErrors.phone = 'Telefonnummer ist erforderlich';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      // Save to context
      updateWizardData({ photoUrl, firstName, lastName, shortBio, phone });
      router.push('/(worker)/profile-wizard/step2-address');
    }
  };

  // Foto ist optional - nur Name und Telefon sind Pflicht
  const isFormValid = firstName.trim() && lastName.trim() && phone.trim();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: COLORS.white, fontSize: 16 }}>Lade Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Profil bearbeiten</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Progress */}
        <ProgressBar currentStep={1} totalSteps={5} />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Basisdaten</Text>
          <Text style={styles.subtitle}>
            Erzähle uns ein bisschen über dich
          </Text>

          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <Text style={styles.label}>Profilfoto *</Text>
            <View style={styles.photoContainer}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitials}>{getInitials()}</Text>
                </View>
              )}
              <Pressable onPress={pickImage} style={styles.photoButton}>
                <Ionicons name="camera" size={20} color={COLORS.purple} />
              </Pressable>
            </View>
            <Pressable onPress={pickImage} style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Foto ändern</Text>
            </Pressable>
            {!photoUrl && (
              <Text style={styles.hintText}>
                💡 Ein Foto hilft Arbeitgebern, dich besser kennenzulernen (optional)
              </Text>
            )}
            {errors.photoUrl && <Text style={styles.errorText}>{errors.photoUrl}</Text>}
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vorname *</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Max"
              style={styles.input}
              placeholderTextColor={COLORS.gray}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nachname *</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Mustermann"
              style={styles.input}
              placeholderTextColor={COLORS.gray}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          {/* Short Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Über mich (optional)</Text>
            <TextInput
              value={shortBio}
              onChangeText={setShortBio}
              placeholder="Erzähl ein bisschen über dich..."
              style={[styles.input, styles.textArea]}
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text style={styles.characterCount}>{shortBio.length}/300</Text>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefonnummer *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+49 123 456789"
              style={styles.input}
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-Mail</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailText}>{user?.email || 'Keine E-Mail'}</Text>
            </View>
            <Text style={styles.helperText}>E-Mail kann nicht geändert werden</Text>
          </View>
        </ScrollView>

        {/* Validation Hints */}
        {!isFormValid && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={styles.validationHint}>
              ℹ️ Bitte fülle alle Pflichtfelder (*) aus, um fortzufahren
            </Text>
          </View>
        )}

        {/* Navigation */}
        <NavigationButtons
          onNext={handleNext}
          nextDisabled={!isFormValid}
          showBack={false}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
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
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.neon,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.neon,
  },
  photoInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.purple,
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
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.purple,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.purple,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'right',
  },
  emailContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emailText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.neon,
    marginTop: 8,
    fontStyle: 'italic',
  },
  validationHint: {
    fontSize: 13,
    color: COLORS.neon,
    backgroundColor: 'rgba(200, 255, 22, 0.1)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
});
