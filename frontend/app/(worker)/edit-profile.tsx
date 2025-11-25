// app/(worker)/edit-profile.tsx - COMPLETE WORKER PROFILE EDITOR
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, saveWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import taxonomy
const TAXONOMY_DATA = require('../../shared/taxonomy.json');

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  borderGray: '#E0E0E0',
  error: '#FF4D4D',
};

export default function EditWorkerProfileScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Personal Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileText, setProfileText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  // Categories & Tags
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Radius
  const [radiusKm, setRadiusKm] = useState('20');

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available tags for selected categories
  const [availableTags, setAvailableTags] = useState<{key: string, label: string}[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  // Update available tags when categories change
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setAvailableTags([]);
      return;
    }

    const tags: {key: string, label: string}[] = [];
    selectedCategories.forEach(catKey => {
      const category = TAXONOMY_DATA.categories.find((c: any) => c.key === catKey);
      if (category) {
        // Add activities
        category.activities?.forEach((act: any) => {
          if (!tags.find(t => t.key === act.key)) {
            tags.push({ key: act.key, label: act.label });
          }
        });
        // Add qualifications
        category.qualifications?.forEach((qual: any) => {
          if (!tags.find(t => t.key === qual.key)) {
            tags.push({ key: qual.key, label: qual.label });
          }
        });
      }
    });

    setAvailableTags(tags);
  }, [selectedCategories]);

  async function loadProfile() {
    if (!user) return;

    try {
      setLoading(true);
      const profile = await getWorkerProfile(user.id);

      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setProfileText(profile.shortBio || '');
        setPhotoUrl(profile.photoUrl || profile.profilePhotoUri || '');
        setStreet(profile.homeAddress?.street || '');
        setHouseNumber(profile.homeAddress?.houseNumber || '');
        setPostalCode(profile.homeAddress?.postalCode || '');
        setCity(profile.homeAddress?.city || '');
        setCountry(profile.homeAddress?.country || 'Deutschland');
        setLat(profile.homeLat);
        setLon(profile.homeLon);
        setSelectedCategories(profile.categories || []);
        setSelectedTags(profile.selectedTags || []);
        setPhone(profile.phone || '');
        setEmail(profile.email || user.email || '');
        setRadiusKm(String(profile.radiusKm || 20));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Fehler', 'Profil konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden');
    }
  }

  async function takePhoto() {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlaube den Zugriff auf die Kamera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
    }
  }

  function showPhotoOptions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Abbrechen', 'Foto aufnehmen', 'Aus Galerie wählen'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Profilbild ändern',
        'Wähle eine Option',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Foto aufnehmen', onPress: takePhoto },
          { text: 'Aus Galerie wählen', onPress: pickImage },
        ]
      );
    }
  }

  const getInitials = () => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
    if (!lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';
    if (!street.trim()) newErrors.street = 'Straße ist erforderlich';
    if (!postalCode.trim()) newErrors.postalCode = 'PLZ ist erforderlich';
    if (!city.trim()) newErrors.city = 'Stadt ist erforderlich';
    if (!country.trim()) newErrors.country = 'Land ist erforderlich';
    if (!phone.trim()) newErrors.phone = 'Telefonnummer ist erforderlich';
    if (selectedCategories.length === 0) newErrors.categories = 'Mindestens eine Kategorie wählen';

    const radius = parseInt(radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200) {
      newErrors.radiusKm = 'Radius muss zwischen 1 und 200 km liegen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    console.log('💾 SAVE: start');
    
    if (!user) {
      console.error('❌ SAVE: No user found');
      return;
    }

    console.log('🔍 SAVE: validating data');
    if (!validate()) {
      console.log('❌ SAVE: validation failed');
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    console.log('✅ SAVE: validation passed');

    try {
      setSaving(true);

      const updatedProfile: Partial<WorkerProfile> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        shortBio: profileText.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        categories: selectedCategories,
        selectedTags: selectedTags,
        homeAddress: {
          street: street.trim(),
          houseNumber: houseNumber.trim() || undefined,
          postalCode: postalCode.trim(),
          city: city.trim(),
          country: country.trim(),
        },
        homeLat: lat,
        homeLon: lon,
        phone: phone.trim(),
        email: email.trim(),
        radiusKm: parseInt(radiusKm),
      };

      console.log('📤 SAVE: calling saveWorkerProfile', {
        userId: user.id,
        data: updatedProfile
      });

      await saveWorkerProfile(user.id, updatedProfile);

      console.log('✅ SAVE: profile saved successfully');
      console.log('🔄 SAVE: navigating to profile screen');

      // Navigate back immediately after successful save
      router.replace('/(worker)/profile');
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert');
      }, 500);

    } catch (err: any) {
      console.error('❌ SAVE: Error saving profile:', err);
      console.error('❌ SAVE: Error message:', err.message);
      console.error('❌ SAVE: Error stack:', err.stack);
      
      Alert.alert(
        'Fehler beim Speichern',
        err.message || 'Profil konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setSaving(false);
      console.log('🏁 SAVE: finished');
    }
  }

  const isFormValid = () => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      street.trim() &&
      postalCode.trim() &&
      city.trim() &&
      country.trim() &&
      phone.trim() &&
      selectedCategories.length > 0 &&
      !isNaN(parseInt(radiusKm)) &&
      parseInt(radiusKm) >= 1 &&
      parseInt(radiusKm) <= 200
    );
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.purple }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
            Profil bearbeiten
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Persönliche Daten */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
            Persönliche Daten
          </Text>

          {/* Profile Photo Upload */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{
              position: 'relative',
              marginBottom: 12,
            }}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 4,
                    borderColor: COLORS.neon,
                  }}
                />
              ) : (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: COLORS.purple,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: COLORS.neon,
                }}>
                  <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.white }}>
                    {getInitials()}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={showPhotoOptions}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: COLORS.neon,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: COLORS.white,
                }}
              >
                <Ionicons name="camera" size={18} color={COLORS.black} />
              </Pressable>
            </View>
            <Pressable
              onPress={showPhotoOptions}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.purple }}>
                Foto ändern
              </Text>
            </Pressable>
          </View>

          {/* First Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Vorname *
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Max"
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                borderWidth: errors.firstName ? 2 : 0,
                borderColor: COLORS.error,
              }}
            />
            {errors.firstName && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                {errors.firstName}
              </Text>
            )}
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Nachname *
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Mustermann"
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                borderWidth: errors.lastName ? 2 : 0,
                borderColor: COLORS.error,
              }}
            />
            {errors.lastName && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                {errors.lastName}
              </Text>
            )}
          </View>

          {/* Profile Text */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Über mich (optional)
            </Text>
            <TextInput
              value={profileText}
              onChangeText={setProfileText}
              placeholder="Erzähle etwas über dich..."
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
          </View>
        </View>

        {/* SECTION 2: Wohnadresse */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
            Wohnadresse
          </Text>

          {/* Street & House Number */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 3 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
                Straße *
              </Text>
              <TextInput
                value={street}
                onChangeText={setStreet}
                placeholder="Hauptstraße"
                style={{
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  borderWidth: errors.street ? 2 : 0,
                  borderColor: COLORS.error,
                }}
              />
              {errors.street && (
                <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                  {errors.street}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
                Nr.
              </Text>
              <TextInput
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="123"
                style={{
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                }}
              />
            </View>
          </View>

          {/* Postal Code & City */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
                PLZ *
              </Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="10115"
                keyboardType="numeric"
                style={{
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  borderWidth: errors.postalCode ? 2 : 0,
                  borderColor: COLORS.error,
                }}
              />
              {errors.postalCode && (
                <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                  {errors.postalCode}
                </Text>
              )}
            </View>
            <View style={{ flex: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
                Stadt *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Berlin"
                style={{
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  borderWidth: errors.city ? 2 : 0,
                  borderColor: COLORS.error,
                }}
              />
              {errors.city && (
                <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                  {errors.city}
                </Text>
              )}
            </View>
          </View>

          {/* Country */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Land *
            </Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Deutschland"
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
              }}
            />
          </View>
        </View>

        {/* SECTION 3: Tätigkeiten & Qualifikationen */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
            Tätigkeiten & Qualifikationen
          </Text>

          {/* Categories */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8 }}>
              Kategorien * (mind. 1)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TAXONOMY_DATA.categories.map((cat: any) => {
                const isSelected = selectedCategories.includes(cat.key);
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedCategories(prev => prev.filter(k => k !== cat.key));
                        // Remove tags from unselected category
                        setSelectedTags(prev => {
                          const categoryTags = [
                            ...(cat.activities?.map((a: any) => a.key) || []),
                            ...(cat.qualifications?.map((q: any) => q.key) || []),
                          ];
                          return prev.filter(tag => !categoryTags.includes(tag));
                        });
                      } else {
                        setSelectedCategories(prev => [...prev, cat.key]);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected ? COLORS.purple : COLORS.lightGray,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: COLORS.borderGray,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isSelected ? COLORS.white : COLORS.darkGray,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.categories && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>
                {errors.categories}
              </Text>
            )}
          </View>

          {/* Tags */}
          {availableTags.length > 0 && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8 }}>
                Qualifikationen & Tätigkeiten (optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.key);
                  return (
                    <Pressable
                      key={tag.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags(prev => prev.filter(k => k !== tag.key));
                        } else {
                          setSelectedTags(prev => [...prev, tag.key]);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? COLORS.neon : COLORS.lightGray,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.neon : COLORS.borderGray,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected ? COLORS.black : COLORS.darkGray,
                        }}
                      >
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* SECTION 4: Kontaktinformationen */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
            Kontaktinformationen
          </Text>

          {/* Phone */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Telefonnummer *
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="0162 123 4567"
              keyboardType="phone-pad"
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                borderWidth: errors.phone ? 2 : 0,
                borderColor: COLORS.error,
              }}
            />
            {errors.phone && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                {errors.phone}
              </Text>
            )}
          </View>

          {/* Email */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              E-Mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="max@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              style={{
                backgroundColor: '#E8E8E8',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                color: COLORS.darkGray,
              }}
            />
            <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 4 }}>
              E-Mail kann nicht geändert werden
            </Text>
          </View>
        </View>

        {/* SECTION 5: Arbeitsradius */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 16 }}>
            Arbeitsradius
          </Text>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Radius in km * (1-200)
            </Text>
            <TextInput
              value={radiusKm}
              onChangeText={setRadiusKm}
              placeholder="20"
              keyboardType="numeric"
              style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                borderWidth: errors.radiusKm ? 2 : 0,
                borderColor: COLORS.error,
              }}
            />
            {errors.radiusKm && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 4 }}>
                {errors.radiusKm}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Save Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: COLORS.white,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderGray,
        }}
      >
        <SafeAreaView edges={['bottom']}>
          <Pressable
            onPress={handleSave}
            disabled={!isFormValid() || saving}
            style={({ pressed }) => ({
              backgroundColor: isFormValid() && !saving ? COLORS.neon : '#CCCCCC',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>
                Profil speichern
              </Text>
            )}
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
}
