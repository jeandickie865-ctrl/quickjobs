// app/(worker)/edit-profile.tsx - COMPLETE WORKER PROFILE EDITOR
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

  // Category (exactly ONE), Subcategories & Qualifications
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Radius
  const [radiusKm, setRadiusKm] = useState('20');

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available subcategories and qualifications for selected categories
  const [availableSubcategories, setAvailableSubcategories] = useState<{key: string, label: string}[]>([]);
  const [availableQualifications, setAvailableQualifications] = useState<{key: string, label: string}[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  // Update available subcategories and qualifications when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSubcategories([]);
      setAvailableQualifications([]);
      return;
    }

    const category = TAXONOMY_DATA[selectedCategory];
    if (!category) {
      setAvailableSubcategories([]);
      setAvailableQualifications([]);
      return;
    }

    // Get subcategories
    const subcats: {key: string, label: string}[] = [];
    category.subcategories?.forEach((sub: any) => {
      subcats.push({ key: sub.key, label: sub.label });
    });

    // Get qualifications
    const quals: {key: string, label: string}[] = [];
    category.qualifications?.forEach((qual: any) => {
      quals.push({ key: qual.key, label: qual.label });
    });

    setAvailableSubcategories(subcats);
    setAvailableQualifications(quals);
  }, [selectedCategory]);

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
        // Backend returns categories as array, we take the first one
        setSelectedCategory(profile.categories?.[0] || '');
        setSelectedSubcategories(profile.subcategories || []);
        setSelectedQualifications(profile.qualifications || []);
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
      // WEB: Use HTML file input
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
              Alert.alert('Erfolg', 'Foto wurde ausgewählt');
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // MOBILE: Use expo-image-picker
      console.log('📷 pickImage: Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📷 pickImage: Permission result:', permissionResult.granted);
      
      if (!permissionResult.granted) {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlaube den Zugriff auf die Fotogalerie in den Einstellungen.');
        return;
      }

      console.log('📷 pickImage: Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📷 pickImage: Result:', { canceled: result.canceled, assetsLength: result.assets?.length });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('📷 pickImage: Setting photo URL:', uri);
        setPhotoUrl(uri);
        Alert.alert('Erfolg', 'Foto wurde ausgewählt');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden');
    }
  }

  async function takePhoto() {
    try {
      console.log('📸 takePhoto: Requesting camera permissions...');
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 takePhoto: Permission result:', permissionResult.granted);
      
      if (!permissionResult.granted) {
        Alert.alert('Berechtigung erforderlich', 'Bitte erlaube den Zugriff auf die Kamera in den Einstellungen.');
        return;
      }

      console.log('📸 takePhoto: Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📸 takePhoto: Result:', { canceled: result.canceled, assetsLength: result.assets?.length });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('📸 takePhoto: Setting photo URL:', uri);
        setPhotoUrl(uri);
        Alert.alert('Erfolg', 'Foto wurde aufgenommen');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden');
    }
  }

  function showPhotoOptions() {
    console.log('🎬 showPhotoOptions: Opening photo selection menu...');
    console.log('🎬 showPhotoOptions: Platform:', Platform.OS);
    
    // WEB: Direkt File-Dialog öffnen
    if (Platform.OS === 'web') {
      console.log('🎬 -> Web: Opening file picker...');
      pickImage();
      return;
    }
    
    // iOS: ActionSheet
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Abbrechen', 'Foto aufnehmen', 'Aus Galerie wählen'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          console.log('🎬 ActionSheet button clicked:', buttonIndex);
          if (buttonIndex === 1) {
            console.log('🎬 -> Taking photo...');
            takePhoto();
          } else if (buttonIndex === 2) {
            console.log('🎬 -> Picking image from gallery...');
            pickImage();
          }
        }
      );
      return;
    }
    
    // Android: Alert
    Alert.alert(
      'Profilbild ändern',
      'Wähle eine Option',
      [
        { text: 'Abbrechen', style: 'cancel', onPress: () => console.log('🎬 Cancelled') },
        { text: 'Foto aufnehmen', onPress: () => { console.log('🎬 -> Taking photo...'); takePhoto(); } },
        { text: 'Aus Galerie wählen', onPress: () => { console.log('🎬 -> Picking image from gallery...'); pickImage(); } },
      ]
    );
  }

  const getInitials = () => {
    const first = firstName.charAt(0) || '';
    const last = lastName.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // OSM Autocomplete for address
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  async function searchAddress(query: string) {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 5) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce: Wait 500ms before searching
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔍 Searching address via backend proxy:', query);
        
        // Use backend proxy to avoid CORS issues
        const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
        const url = `${API_BASE}/api/geocode?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);

        if (response.status === 429) {
          console.warn('⚠️ Rate limit reached, please wait');
          Alert.alert('Rate Limit', 'Bitte warte einen Moment und versuche es erneut.');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Found addresses:', data.length);
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
    console.log('Selected address:', suggestion);
    
    // Extract address components
    const addr = suggestion.address || {};
    
    // Street
    const streetName = addr.road || addr.street || '';
    setStreet(streetName);
    
    // House number
    const houseNum = addr.house_number || '';
    setHouseNumber(houseNum);
    
    // Postal code
    const postal = addr.postcode || '';
    setPostalCode(postal);
    
    // City
    const cityName = addr.city || addr.town || addr.village || '';
    setCity(cityName);
    
    // Country
    const countryName = addr.country || 'Deutschland';
    setCountry(countryName);
    
    // Coordinates
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    setLat(latitude);
    setLon(longitude);
    
    console.log('Address filled:', { streetName, houseNum, postal, cityName, countryName, latitude, longitude });
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
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
    if (!selectedCategory) newErrors.category = 'Bitte wähle eine Kategorie';

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
        categories: [selectedCategory], // Send as array with ONE category
        subcategories: selectedSubcategories,
        qualifications: selectedQualifications,
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

      // Role-based navigation
      if (user.role === 'worker') {
        router.replace('/(worker)/profile');
      } else if (user.role === 'employer') {
        router.replace('/(employer)/profile');
      }
      
      // Success - no alert needed, user sees updated profile

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
      selectedCategory &&
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

          {/* Address Search with Autocomplete */}
          <View style={{ marginBottom: 16, position: 'relative', zIndex: 1000 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              Straße + Nr. *
            </Text>
            <TextInput
              value={street && houseNumber ? `${street} ${houseNumber}` : street}
              onChangeText={(text) => {
                setStreet(text);
                searchAddress(text);
              }}
              placeholder="Hauptstraße 123"
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
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <View style={{
                position: 'absolute',
                top: 70,
                left: 0,
                right: 0,
                backgroundColor: COLORS.white,
                borderRadius: 12,
                maxHeight: 200,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
                zIndex: 1001,
              }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {addressSuggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      onPress={() => selectAddress(suggestion)}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: pressed ? COLORS.lightGray : COLORS.white,
                        borderBottomWidth: index < addressSuggestions.length - 1 ? 1 : 0,
                        borderBottomColor: COLORS.borderGray,
                      })}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black }}>
                        {suggestion.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
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

          {/* Category - Select exactly ONE */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8 }}>
              Kategorie * (genau eine)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                const isSelected = selectedCategory === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      // Select new category - reset subcategories and qualifications
                      setSelectedCategory(key);
                      setSelectedSubcategories([]);
                      setSelectedQualifications([]);
                    }}
                    style={{
                      width: '48%',
                      backgroundColor: isSelected ? COLORS.white : '#ECE9FF',
                      borderRadius: 14,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? COLORS.neon : 'transparent',
                      shadowColor: isSelected ? 'rgba(200,255,22,0.2)' : 'transparent',
                      shadowOpacity: isSelected ? 1 : 0,
                      shadowRadius: isSelected ? 8 : 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: COLORS.black,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.category && (
              <Text style={{ fontSize: 12, color: COLORS.error, marginTop: 8 }}>
                {errors.category}
              </Text>
            )}
          </View>

          {/* Subcategories */}
          {availableSubcategories.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8 }}>
                Tätigkeiten *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableSubcategories.map((sub) => {
                  const isSelected = selectedSubcategories.includes(sub.key);
                  return (
                    <Pressable
                      key={sub.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedSubcategories(prev => prev.filter(k => k !== sub.key));
                        } else {
                          setSelectedSubcategories(prev => [...prev, sub.key]);
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
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8 }}>
                Qualifikationen (optional)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableQualifications.map((qual) => {
                  const isSelected = selectedQualifications.includes(qual.key);
                  return (
                    <Pressable
                      key={qual.key}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedQualifications(prev => prev.filter(k => k !== qual.key));
                        } else {
                          setSelectedQualifications(prev => [...prev, qual.key]);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? COLORS.purple : COLORS.lightGray,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.purple : COLORS.borderGray,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected ? COLORS.white : COLORS.darkGray,
                        }}
                      >
                        {qual.label}
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

          {/* Email - Read-only, from AuthContext */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginBottom: 6 }}>
              E-Mail
            </Text>
            <View style={{
              backgroundColor: '#E8E8E8',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
              <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                {user?.email || email || 'Keine E-Mail'}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
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
            onPress={() => {
              console.log('🔘 SAVE BUTTON PRESSED!');
              console.log('🔘 isFormValid:', isFormValid());
              console.log('🔘 saving:', saving);
              handleSave();
            }}
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
