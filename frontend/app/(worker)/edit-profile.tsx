// app/(worker)/edit-profile.tsx – BACKUP DARK MODE REDESIGN (nur Styling)
import React, { useState, useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, saveWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const TAXONOMY_DATA = require('../../shared/taxonomy.json');

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  error: '#FF4D4D'
};

const inputStyle = {
  backgroundColor: '#1C182B',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 15,
  color: COLORS.white,
  borderWidth: 1,
  borderColor: COLORS.border
};

export default function EditWorkerProfileScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileText, setProfileText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [radiusKm, setRadiusKm] = useState('20');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [availableSubcategories, setAvailableSubcategories] = useState<{ key: string; label: string }[]>([]);
  const [availableQualifications, setAvailableQualifications] = useState<{ key: string; label: string }[]>([]);

  // OSM Autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setAvailableSubcategories([]);
      setAvailableQualifications([]);
      return;
    }

    const subcats: { key: string; label: string }[] = [];
    const quals: { key: string; label: string }[] = [];

    selectedCategories.forEach(catKey => {
      const category = TAXONOMY_DATA[catKey];
      if (category) {
        category.subcategories?.forEach((sub: any) => {
          if (!subcats.find(s => s.key === sub.key)) {
            subcats.push({ key: sub.key, label: sub.label });
          }
        });
        category.qualifications?.forEach((qual: any) => {
          if (!quals.find(q => q.key === qual.key)) {
            quals.push({ key: qual.key, label: qual.label });
          }
        });
      }
    });

    setAvailableSubcategories(subcats);
    setAvailableQualifications(quals);
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
        setSelectedSubcategories(profile.subcategories || []);
        setSelectedQualifications(profile.qualifications || []);
        setPhone(profile.phone || '');
        setEmail(profile.email || user.email || '');
        setRadiusKm(String(profile.radiusKm || 20));
      }
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
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

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden');
    }
  }

  async function takePhoto() {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
    }
  }

  function showPhotoOptions() {
    if (Platform.OS === 'web') return pickImage();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Abbrechen', 'Foto aufnehmen', 'Aus Galerie wählen'],
          cancelButtonIndex: 0
        },
        (i) => {
          if (i === 1) takePhoto();
          if (i === 2) pickImage();
        }
      );
      return;
    }

    Alert.alert('Profilbild ändern', 'Wähle eine Option', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Foto aufnehmen', onPress: () => takePhoto() },
      { text: 'Aus Galerie wählen', onPress: () => pickImage() }
    ]);
  }

  const getInitials = () => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Vorname erforderlich';
    if (!lastName.trim()) newErrors.lastName = 'Nachname erforderlich';
    if (!street.trim()) newErrors.street = 'Straße erforderlich';
    if (!postalCode.trim()) newErrors.postalCode = 'PLZ erforderlich';
    if (!city.trim()) newErrors.city = 'Stadt erforderlich';
    if (!country.trim()) newErrors.country = 'Land erforderlich';
    if (!phone.trim()) newErrors.phone = 'Telefonnummer erforderlich';
    if (selectedCategories.length === 0) newErrors.categories = 'Mind. eine Kategorie';
    const radius = parseInt(radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200) newErrors.radiusKm = '1-200 km';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!user) return;

    if (!validate()) {
      Alert.alert('Fehler', 'Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      setSaving(true);

      const updatedProfile: Partial<WorkerProfile> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        shortBio: profileText.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        qualifications: selectedQualifications,
        homeAddress: {
          street: street.trim(),
          houseNumber: houseNumber.trim() || undefined,
          postalCode: postalCode.trim(),
          city: city.trim(),
          country: country.trim()
        },
        homeLat: lat,
        homeLon: lon,
        phone: phone.trim(),
        email: email.trim(),
        radiusKm: parseInt(radiusKm)
      };

      await saveWorkerProfile(user.id, updatedProfile);

      router.replace('/(worker)/profile');
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
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
      !isNaN(parseInt(radiusKm))
    );
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* BACKUP HEADER */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '900' }}>BACKUP</Text>
          <View style={{ height: 4, backgroundColor: COLORS.neon, width: '100%', marginTop: 8 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >

        {/* SECTION: Persönliche Daten */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
            Persönliche Daten
          </Text>

          {/* Photo */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 3,
                    borderColor: COLORS.neon
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: COLORS.purple,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: COLORS.neon
                  }}
                >
                  <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.white }}>
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
                  borderWidth: 2,
                  borderColor: COLORS.white
                }}
              >
                <Ionicons name="camera" size={18} color="#000" />
              </Pressable>
            </View>

            <Pressable
              onPress={showPhotoOptions}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: '#1C182B',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border
              }}
            >
              <Text style={{ color: COLORS.white, fontWeight: '600' }}>Foto ändern</Text>
            </Pressable>
          </View>

          {/* First Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Vorname *</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Max"
              placeholderTextColor={COLORS.muted}
              style={[inputStyle, errors.firstName && { borderColor: COLORS.error }]}
            />
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Nachname *</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Mustermann"
              placeholderTextColor={COLORS.muted}
              style={[inputStyle, errors.lastName && { borderColor: COLORS.error }]}
            />
          </View>

          {/* Profile Text */}
          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Über mich (optional)</Text>
            <TextInput
              value={profileText}
              onChangeText={setProfileText}
              placeholder="Erzähl etwas über dich..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              style={[
                inputStyle,
                { minHeight: 100, textAlignVertical: 'top' }
              ]}
            />
          </View>
        </View>

        {/* SECTION: Adresse */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
            Wohnadresse
          </Text>

          {/* Straße */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Straße *</Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="Hauptstraße"
              placeholderTextColor={COLORS.muted}
              style={[inputStyle, errors.street && { borderColor: COLORS.error }]}
            />
          </View>

          {/* PLZ + Stadt */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6 }}>PLZ *</Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="10115"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                style={[inputStyle, errors.postalCode && { borderColor: COLORS.error }]}
              />
            </View>

            <View style={{ flex: 2 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Stadt *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Berlin"
                placeholderTextColor={COLORS.muted}
                style={[inputStyle, errors.city && { borderColor: COLORS.error }]}
              />
            </View>
          </View>

          {/* Country */}
          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Land *</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Deutschland"
              placeholderTextColor={COLORS.muted}
              style={[inputStyle, errors.country && { borderColor: COLORS.error }]}
            />
          </View>
        </View>

        {/* SECTION: Kategorien */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 16 }}>
            Tätigkeiten & Qualifikationen
          </Text>

          {/* Kategorien */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Kategorien *</Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                const isSelected = selectedCategories.includes(key);

                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      if (isSelected) {
                        const subs = cat.subcategories?.map((s: any) => s.key) || [];
                        const quals = cat.qualifications?.map((q: any) => q.key) || [];
                        setSelectedCategories(prev => prev.filter(v => v !== key));
                        setSelectedSubcategories(prev => prev.filter(s => !subs.includes(s)));
                        setSelectedQualifications(prev => prev.filter(q => !quals.includes(q)));
                      } else {
                        setSelectedCategories(prev => [...prev, key]);
                      }
                    }}
                    style={{
                      width: '47%',
                      backgroundColor: isSelected ? COLORS.purple : '#1C182B',
                      borderWidth: 1,
                      borderColor: isSelected ? COLORS.neon : COLORS.border,
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '600' }}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Subcategories */}
          {availableSubcategories.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6 }}>
                Tätigkeiten *
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableSubcategories.map(sub => {
                  const isSelected = selectedSubcategories.includes(sub.key);

                  return (
                    <Pressable
                      key={sub.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSubcategories(prev => prev.filter(v => v !== sub.key));
                        } else {
                          setSelectedSubcategories(prev => [...prev, sub.key]);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? COLORS.neon : '#1C182B',
                        borderRadius: 14,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.neon : COLORS.border
                      }}
                    >
                      <Text style={{ color: isSelected ? '#000' : COLORS.white, fontWeight: '600' }}>
                        {sub.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Qualifications */}
          {availableQualifications.length > 0 && (
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 6 }}>
                Qualifikationen (optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableQualifications.map(qual => {
                  const isSelected = selectedQualifications.includes(qual.key);

                  return (
                    <Pressable
                      key={qual.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedQualifications(prev => prev.filter(v => v !== qual.key));
                        } else {
                          setSelectedQualifications(prev => [...prev, qual.key]);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? COLORS.purple : '#1C182B',
                        borderRadius: 14,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.purple : COLORS.border
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                        {qual.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* SECTION: Kontakt */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
            Kontaktinformationen
          </Text>

          {/* Phone */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Telefonnummer *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="0176..."
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              style={[inputStyle, errors.phone && { borderColor: COLORS.error }]}
            />
          </View>

          {/* Email */}
          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>E-Mail</Text>
            <View
              style={{
                backgroundColor: '#1C182B',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: COLORS.border
              }}
            >
              <Text style={{ color: COLORS.muted }}>{user?.email || email}</Text>
            </View>
          </View>
        </View>

        {/* Radius */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: COLORS.border
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
            Arbeitsradius
          </Text>

          <View>
            <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Radius in km *</Text>
            <TextInput
              value={radiusKm}
              onChangeText={setRadiusKm}
              placeholder="20"
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              style={[inputStyle, errors.radiusKm && { borderColor: COLORS.error }]}
            />
          </View>
        </View>

        {/* Bottom Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isFormValid() || saving}
          style={{
            width: '60%',
            maxWidth: 300,
            minWidth: 220,
            alignSelf: 'center',
            backgroundColor: isFormValid() && !saving ? COLORS.neon : '#333',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center'
          }}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>
              Profil speichern
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
