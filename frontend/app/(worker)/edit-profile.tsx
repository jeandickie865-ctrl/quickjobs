// app/(worker)/edit-profile.tsx – TAB-BASED LAYOUT (BACKUP DARK MODE)
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
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, saveWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const TAXONOMY_DATA = require('../../shared/taxonomy.json');

const COLORS = {
  bg: '#141126',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  error: '#FF4D4D',
  black: '#000000'
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

type TabType = 'basis' | 'adresse' | 'kategorien' | 'kontakt' | 'radius';

export default function EditWorkerProfileScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('basis');

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
  const [isSelfEmployed, setIsSelfEmployed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

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
        setStreet(profile.homeAddress?.street || (profile as any).address?.street || '');
        setHouseNumber(profile.homeAddress?.houseNumber || (profile.homeAddress as any)?.house_number || (profile as any).address?.houseNumber || (profile as any).address?.house_number || '');
        setPostalCode(profile.homeAddress?.postalCode || (profile.homeAddress as any)?.postal_code || (profile as any).address?.postalCode || (profile as any).address?.postal_code || '');
        setCity(profile.homeAddress?.city || (profile as any).address?.city || '');
        setCountry((profile.homeAddress as any)?.country || (profile as any).address?.country || 'Deutschland');
        setLat(profile.homeLat || (profile as any).lat);
        setLon(profile.homeLon || (profile as any).lon);
        setSelectedCategories(profile.categories || []);
        setSelectedSubcategories(profile.subcategories || []);
        setSelectedQualifications(profile.qualifications || []);
        setPhone(profile.phone || (profile as any).contactPhone || '');
        setEmail(profile.email || (profile as any).contactEmail || '');
        setRadiusKm(String(profile.radiusKm || 20));
        setIsSelfEmployed(profile.isSelfEmployed ?? false);
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

  // OSM Address Search
  async function searchAddress(query: string) {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 5) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
        const url = `${API_BASE}/api/geocode?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);

        if (response.status === 429) {
          Alert.alert('Rate Limit', 'Bitte warte einen Moment und versuche es erneut.');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error('Address search error:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
  }

  function selectAddress(suggestion: any) {
    const addr = suggestion.address || {};
    
    setStreet(addr.road || addr.street || '');
    setHouseNumber(addr.house_number || '');
    setPostalCode(addr.postcode || '');
    setCity(addr.city || addr.town || addr.village || '');
    setCountry(addr.country || 'Deutschland');
    
    setLat(suggestion.lat ? parseFloat(suggestion.lat) : undefined);
    setLon(suggestion.lon ? parseFloat(suggestion.lon) : undefined);
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Vorname erforderlich';
    if (!lastName.trim()) newErrors.lastName = 'Nachname erforderlich';
    if (!street.trim()) newErrors.street = 'Straße erforderlich';
    if (!houseNumber.trim()) newErrors.houseNumber = 'Bitte gib eine Hausnummer ein.';
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
    console.log('🔵 handleSave called!');
    if (!user) {
      console.log('❌ No user!');
      return;
    }

    const isValid = validate();
    console.log('🔵 Validation result:', isValid);
    console.log('🔵 Errors:', errors);
    
    if (!isValid) {
      console.log('❌ Validation failed!');
      
      // Show which tabs have missing fields
      const missingTabs = [];
      if (errors.firstName || errors.lastName) missingTabs.push('Basis');
      if (errors.street || errors.houseNumber || errors.postalCode || errors.city || errors.country) missingTabs.push('Adresse');
      if (errors.categories) missingTabs.push('Kategorien');
      if (errors.phone) missingTabs.push('Kontakt');
      if (errors.radiusKm) missingTabs.push('Radius');
      
      const message = missingTabs.length > 0 
        ? `Bitte fülle alle Pflichtfelder in folgenden Tabs aus: ${missingTabs.join(', ')}`
        : 'Bitte alle Pflichtfelder ausfüllen.';
      
      Alert.alert('Fehler', message);
      return;
    }
    
    console.log('✅ Validation passed, saving...');

    try {
      setSaving(true);

      const addressPayload = {
        street: street.trim() || undefined,
        houseNumber: houseNumber.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || 'Deutschland',
      };

      const updatedProfile: Partial<WorkerProfile> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        shortBio: profileText.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        qualifications: selectedQualifications,
        homeAddress: addressPayload,
        homeLat: lat,
        homeLon: lon,
        phone: phone.trim(),
        email: email.trim(),
        radiusKm: parseInt(radiusKm),
        isSelfEmployed: isSelfEmployed
      };

      console.log('💾 Saving profile:', updatedProfile);
      await saveWorkerProfile(user.id, updatedProfile);
      setSaveSuccess(true);
      console.log('✅ Profile saved successfully!');
      
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        router.replace("/(worker)/profile");
      }, 1200);
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      Alert.alert('Fehler', `Profil konnte nicht gespeichert werden:\n${error.message || 'Unbekannter Fehler'}`);
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
      (() => {
        const n = parseInt(radiusKm);
        return !isNaN(n) && n >= 1 && n <= 200;
      })()
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

  // Tab Configuration
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'basis', label: 'Basis', icon: 'person-outline' },
    { key: 'adresse', label: 'Adresse', icon: 'home-outline' },
    { key: 'kategorien', label: 'Kategorien', icon: 'briefcase-outline' },
    { key: 'kontakt', label: 'Kontakt', icon: 'call-outline' },
    { key: 'radius', label: 'Radius', icon: 'locate-outline' }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {saveSuccess && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#141126',
              padding: 24,
              borderRadius: 16,
              width: '80%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Änderungen wurden gespeichert
            </Text>

            <Pressable
              onPress={() => {
                setSaveSuccess(false);
                router.push('/(worker)/profile');
              }}
              style={{
                backgroundColor: '#C8FF16',
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>
                Zum Profil
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* BACKUP HEADER */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '900' }}>BACKUP</Text>
        </View>

        {/* TAB BAR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          style={{ borderBottomWidth: 2, borderBottomColor: COLORS.neon }}
          keyboardShouldPersistTaps="handled"
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  marginRight: 8,
                  borderRadius: 12,
                  backgroundColor: isActive ? COLORS.neon : '#1C182B',
                  borderWidth: 1,
                  borderColor: isActive ? COLORS.neon : COLORS.border
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={isActive ? '#000' : COLORS.white}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: isActive ? '#000' : COLORS.white,
                    fontWeight: isActive ? '700' : '600',
                    fontSize: 14
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* TAB CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 260 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* BASIS TAB */}
        {activeTab === 'basis' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
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
                    transform: [{ translateY: 12 }],
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
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Vorname *</Text>
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
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Nachname *</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Mustermann"
                placeholderTextColor={COLORS.muted}
                style={[inputStyle, errors.lastName && { borderColor: COLORS.error }]}
              />
            </View>

            {/* Profile Text */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Über mich (optional)</Text>
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

            {/* Self-Employed Checkbox */}
            <Pressable
              onPress={() => setIsSelfEmployed(!isSelfEmployed)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#1C182B',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isSelfEmployed ? COLORS.neon : COLORS.border,
                  backgroundColor: isSelfEmployed ? COLORS.neon : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}
              >
                {isSelfEmployed && (
                  <Ionicons name="checkmark" size={16} color="#000" />
                )}
              </View>
              <Text style={{ color: COLORS.white, fontSize: 15, flex: 1 }}>
                Ich bin selbstständig
              </Text>
            </Pressable>
          </View>
        )}

        {/* ADRESSE TAB */}
        {activeTab === 'adresse' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
              Wohnadresse
            </Text>

            {/* Straße mit Autocomplete */}
            <View style={{ marginBottom: 16, position: 'relative', zIndex: 1000 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Straße *</Text>
              <TextInput
                value={street}
                onChangeText={(text) => {
                  setStreet(text);
                  searchAddress(text);
                }}
                placeholder="Hauptstraße 123"
                placeholderTextColor={COLORS.muted}
                style={[inputStyle, errors.street && { borderColor: COLORS.error }]}
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 70,
                  left: 0,
                  right: 0,
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  maxHeight: 200,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                  zIndex: 1001,
                  borderWidth: 1,
                  borderColor: COLORS.border
                }}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {addressSuggestions.map((suggestion, index) => (
                      <Pressable
                        key={index}
                        onPress={() => selectAddress(suggestion)}
                        style={({ pressed }) => ({
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          backgroundColor: pressed ? '#1C182B' : COLORS.card,
                          borderBottomWidth: index < addressSuggestions.length - 1 ? 1 : 0,
                          borderBottomColor: COLORS.border,
                        })}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                          {suggestion.display_name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Hausnummer */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Hausnummer *</Text>
              <TextInput
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="z. B. 12a"
                placeholderTextColor={COLORS.muted}
                style={[inputStyle, errors.houseNumber && { borderColor: COLORS.error }]}
              />
              {errors.houseNumber && (
                <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>
                  {errors.houseNumber}
                </Text>
              )}
            </View>

            {/* PLZ + Stadt */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>PLZ *</Text>
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
                <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Stadt *</Text>
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
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Land *</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="Deutschland"
                placeholderTextColor={COLORS.muted}
                style={[inputStyle, errors.country && { borderColor: COLORS.error }]}
              />
            </View>
          </View>
        )}

        {/* KATEGORIEN TAB */}
        {activeTab === 'kategorien' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 16 }}>
              Tätigkeiten & Qualifikationen
            </Text>

            {/* Kategorien */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14 }}>Kategorien *</Text>

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
                <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14 }}>
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
                <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14 }}>
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
        )}

        {/* KONTAKT TAB */}
        {activeTab === 'kontakt' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
              Kontaktinformationen
            </Text>

            {/* Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Telefonnummer *</Text>
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
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>E-Mail</Text>
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
        )}

        {/* RADIUS TAB */}
        {activeTab === 'radius' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 20 }}>
              Arbeitsradius
            </Text>

            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 6, fontSize: 14 }}>Radius in km *</Text>
              <TextInput
                value={radiusKm}
                onChangeText={setRadiusKm}
                placeholder="20"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                style={[inputStyle, errors.radiusKm && { borderColor: COLORS.error }]}
              />
              <Text style={{ color: COLORS.muted, marginTop: 8, fontSize: 13 }}>
                Gib an, in welchem Umkreis (in km) du arbeiten möchtest. (1-200 km)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* SAVE BUTTON */}
      <View style={{ padding: 20, paddingBottom: 40 }}>
        <Pressable
          onPress={handleSave}
          disabled={!isFormValid() || saving}
          style={{
            width: '60%',
            alignSelf: 'center',
            backgroundColor: isFormValid() && !saving ? COLORS.purple : COLORS.card,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: isFormValid() ? 0 : 2,
            borderColor: COLORS.border,
          }}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: isFormValid() ? COLORS.white : COLORS.muted, fontSize: 17, fontWeight: '700' }}>
              Profil speichern
            </Text>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>
      
      {showSaved && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <View
            style={{
              backgroundColor: "#141126",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#6B4BFF",
              shadowColor: "#6B4BFF",
              shadowOpacity: 0.3,
              shadowRadius: 6,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              Änderungen gespeichert
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
