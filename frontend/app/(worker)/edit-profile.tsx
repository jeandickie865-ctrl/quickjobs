// app/(worker)/edit-profile.tsx – Quickjobs LIGHT THEME
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
import { AppHeader } from '../../components/AppHeader';

const TAXONOMY_DATA = require('../../shared/taxonomy.json');

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E9D5FF',
  text: '#1A1A1A',
  white: '#FFFFFF',
  cardText: '#1A1A1A',
  muted: '#6B7280',
  purple: '#EFABFF',
  neon: '#EFABFF',
  error: '#EF4444',
  black: '#1A1A1A',
  inputBg: '#FFFFFF',
  inputBorder: '#E9D5FF'
};

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 15,
  color: '#1A1A1A',
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
        setRadiusKm(String(profile.radiusKm || 20));
        setPhone(profile.phone || '');
        setEmail(profile.email || user.email || '');
        setIsSelfEmployed(profile.isSelfEmployed || false);
      } else {
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Fehler', 'Profil konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) return;

    const validationErrors: Record<string, string> = {};

    if (!firstName.trim()) validationErrors.firstName = 'Vorname ist erforderlich';
    if (!lastName.trim()) validationErrors.lastName = 'Nachname ist erforderlich';
    if (!phone.trim()) validationErrors.phone = 'Telefon ist erforderlich';
    if (!street.trim()) validationErrors.street = 'Straße ist erforderlich';
    if (!city.trim()) validationErrors.city = 'Stadt ist erforderlich';
    if (!postalCode.trim()) validationErrors.postalCode = 'PLZ ist erforderlich';
    if (selectedCategories.length === 0) validationErrors.categories = 'Mindestens 1 Kategorie erforderlich';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Fehlende Angaben', 'Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    try {
      setSaving(true);

      const payload: WorkerProfile = {
        firstName,
        lastName,
        phone,
        email,
        shortBio: profileText,
        photoUrl,
        isSelfEmployed,
        homeAddress: {
          street,
          houseNumber,
          postalCode,
          city,
          country
        },
        homeLat: lat,
        homeLon: lon,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
        qualifications: selectedQualifications,
        radiusKm: parseInt(radiusKm, 10) || 20
      };

      await saveWorkerProfile(user.id, payload);

      setSaveSuccess(true);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);

      Alert.alert('Gespeichert', 'Profil wurde erfolgreich gespeichert.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  }

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

  async function searchAddress(query: string) {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        setAddressSuggestions(data || []);
        setShowSuggestions((data || []).length > 0);
      } catch (error) {
        console.error('Address search error:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function selectAddress(item: any) {
    const addr = item.address || {};
    setStreet(addr.road || '');
    setHouseNumber(addr.house_number || '');
    setPostalCode(addr.postcode || '');
    setCity(addr.city || addr.town || addr.village || '');
    setLat(parseFloat(item.lat));
    setLon(parseFloat(item.lon));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  }

  function toggleCategory(key: string) {
    setSelectedCategories(prev => {
      if (prev.includes(key)) {
        const cat = TAXONOMY_DATA[key];
        const catSubs = cat?.subcategories?.map((s: any) => s.key) || [];
        setSelectedSubcategories(p => p.filter(s => !catSubs.includes(s)));
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  }

  function toggleSubcategory(key: string) {
    setSelectedSubcategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function toggleQualification(key: string) {
    setSelectedQualifications(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  if (authLoading || !user) return null;
  if (user.role !== 'worker') return <Redirect href="/(employer)" />;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.neon} />
          <Text style={{ marginTop: 16, color: COLORS.text }}>Lade Profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <AppHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1 }}>
          {/* TAB BAR */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}
            style={{ maxHeight: 60, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
          >
            {[
              { key: 'basis', label: 'Basis', icon: 'person' },
              { key: 'adresse', label: 'Adresse', icon: 'location' },
              { key: 'kategorien', label: 'Kategorien', icon: 'grid' },
              { key: 'kontakt', label: 'Kontakt', icon: 'call' },
              { key: 'radius', label: 'Radius', icon: 'navigate' }
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as TabType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: isActive ? COLORS.neon : COLORS.card,
                    borderWidth: 1,
                    borderColor: isActive ? COLORS.neon : COLORS.border
                  }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={isActive ? COLORS.white : COLORS.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: isActive ? COLORS.white : COLORS.text, fontWeight: '600', fontSize: 14 }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* BASIS */}
            {activeTab === 'basis' && (
              <View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Basisdaten</Text>
                <Text style={{ color: COLORS.muted, marginBottom: 24, fontSize: 14 }}>Deine persönlichen Informationen</Text>

                <View style={{ alignItems: 'center', marginBottom: 28 }}>
                  <View style={{ position: 'relative' }}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.neon }} />
                    ) : (
                      <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.card, borderWidth: 3, borderColor: COLORS.neon, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.text }}>
                          {firstName.charAt(0)}{lastName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={pickImage}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.neon, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="camera" size={18} color={COLORS.white} />
                    </Pressable>
                  </View>
                  <Pressable onPress={pickImage} style={{ marginTop: 12 }}>
                    <Text style={{ color: COLORS.neon, fontWeight: '600', fontSize: 14 }}>Foto ändern</Text>
                  </Pressable>
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Vorname *</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Max"
                    placeholderTextColor={COLORS.muted}
                    style={inputStyle}
                  />
                  {errors.firstName && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.firstName}</Text>}
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Nachname *</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Mustermann"
                    placeholderTextColor={COLORS.muted}
                    style={inputStyle}
                  />
                  {errors.lastName && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.lastName}</Text>}
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Über mich</Text>
                  <TextInput
                    value={profileText}
                    onChangeText={setProfileText}
                    placeholder="Erzähl kurz etwas über dich…"
                    placeholderTextColor={COLORS.muted}
                    multiline
                    numberOfLines={4}
                    style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
                  />
                </View>

                <Pressable
                  onPress={() => setIsSelfEmployed(!isSelfEmployed)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border
                  }}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isSelfEmployed ? COLORS.neon : COLORS.border,
                    backgroundColor: isSelfEmployed ? COLORS.neon : COLORS.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    {isSelfEmployed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                  </View>
                  <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '500' }}>Ich bin selbstständig</Text>
                </Pressable>
              </View>
            )}

            {/* ADRESSE */}
            {activeTab === 'adresse' && (
              <View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Wohnadresse</Text>
                <Text style={{ color: COLORS.muted, marginBottom: 24, fontSize: 14 }}>Wo wohnst du?</Text>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Straße *</Text>
                  <TextInput
                    value={street}
                    onChangeText={(t) => {
                      setStreet(t);
                      searchAddress(t);
                    }}
                    placeholder="Straße"
                    placeholderTextColor={COLORS.muted}
                    style={inputStyle}
                  />
                  {errors.street && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.street}</Text>}
                </View>

                {showSuggestions && addressSuggestions.length > 0 && (
                  <View style={{ backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, maxHeight: 200, marginBottom: 16 }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {addressSuggestions.map((s, i) => (
                        <Pressable
                          key={i}
                          onPress={() => selectAddress(s)}
                          style={({ pressed }) => ({
                            padding: 14,
                            borderBottomWidth: i < addressSuggestions.length - 1 ? 1 : 0,
                            borderBottomColor: COLORS.border,
                            backgroundColor: pressed ? COLORS.border : COLORS.card
                          })}
                        >
                          <Text style={{ color: COLORS.text, fontSize: 14 }}>{s.display_name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Hausnummer</Text>
                  <TextInput
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    placeholder="Nr."
                    placeholderTextColor={COLORS.muted}
                    style={inputStyle}
                  />
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>PLZ *</Text>
                  <TextInput
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="PLZ"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                    style={inputStyle}
                  />
                  {errors.postalCode && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.postalCode}</Text>}
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Stadt *</Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Stadt"
                    placeholderTextColor={COLORS.muted}
                    style={inputStyle}
                  />
                  {errors.city && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.city}</Text>}
                </View>
              </View>
            )}

            {/* KATEGORIEN */}
            {activeTab === 'kategorien' && (
              <View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Kategorien</Text>
                <Text style={{ color: COLORS.muted, marginBottom: 24, fontSize: 14 }}>Wähle deine Tätigkeitsfelder</Text>

                <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 12, fontSize: 16 }}>Kategorien *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                  {Object.entries(TAXONOMY_DATA).map(([key, cat]: [string, any]) => {
                    const isSelected = selectedCategories.includes(key);
                    return (
                      <Pressable
                        key={key}
                        onPress={() => toggleCategory(key)}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 18,
                          borderRadius: 20,
                          backgroundColor: isSelected ? COLORS.purple : COLORS.card,
                          borderWidth: 1,
                          borderColor: isSelected ? COLORS.purple : COLORS.border
                        }}
                      >
                        <Text style={{ color: isSelected ? COLORS.white : COLORS.text, fontWeight: '600', fontSize: 14 }}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.categories && <Text style={{ color: COLORS.error, fontSize: 12, marginBottom: 16 }}>{errors.categories}</Text>}

                {availableSubcategories.length > 0 && (
                  <View style={{ marginBottom: 28 }}>
                    <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 12, fontSize: 16 }}>Tätigkeiten</Text>
                    <View style={{ gap: 10 }}>
                      {availableSubcategories.map(sub => {
                        const isSelected = selectedSubcategories.includes(sub.key);
                        return (
                          <Pressable
                            key={sub.key}
                            onPress={() => toggleSubcategory(sub.key)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderRadius: 12,
                              backgroundColor: isSelected ? COLORS.neon : COLORS.card,
                              borderWidth: 1,
                              borderColor: isSelected ? COLORS.neon : COLORS.border
                            }}
                          >
                            <Text style={{ color: isSelected ? COLORS.white : COLORS.text, fontSize: 15, fontWeight: '600' }}>
                              {sub.label}
                            </Text>
                            {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {availableQualifications.length > 0 && (
                  <View>
                    <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 12, fontSize: 16 }}>Qualifikationen</Text>
                    <View style={{ gap: 10 }}>
                      {availableQualifications.map(qual => {
                        const isSelected = selectedQualifications.includes(qual.key);
                        return (
                          <Pressable
                            key={qual.key}
                            onPress={() => toggleQualification(qual.key)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              borderRadius: 12,
                              backgroundColor: isSelected ? COLORS.purple : COLORS.card,
                              borderWidth: 1,
                              borderColor: isSelected ? COLORS.purple : COLORS.border
                            }}
                          >
                            <Text style={{ color: isSelected ? COLORS.white : COLORS.text, fontSize: 15, fontWeight: '600' }}>
                              {qual.label}
                            </Text>
                            {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* KONTAKT */}
            {activeTab === 'kontakt' && (
              <View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Kontakt</Text>
                <Text style={{ color: COLORS.muted, marginBottom: 24, fontSize: 14 }}>Wie können wir dich erreichen?</Text>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Telefon *</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+49 123 456789"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="phone-pad"
                    style={inputStyle}
                  />
                  {errors.phone && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{errors.phone}</Text>}
                </View>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>E-Mail</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="mail@example.com"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={inputStyle}
                    editable={false}
                  />
                </View>
              </View>
            )}

            {/* RADIUS */}
            {activeTab === 'radius' && (
              <View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Arbeitsradius</Text>
                <Text style={{ color: COLORS.muted, marginBottom: 24, fontSize: 14 }}>Wie weit möchtest du fahren?</Text>

                <View style={{ marginBottom: 18 }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Radius (km)</Text>
                  <TextInput
                    value={radiusKm}
                    onChangeText={setRadiusKm}
                    placeholder="20"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="numeric"
                    style={inputStyle}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* SPEICHERN BUTTON */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <Pressable
              onPress={handleSaveProfile}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: saving ? COLORS.muted : (pressed ? '#D8A8FF' : COLORS.neon),
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center'
              })}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Profil speichern</Text>
              )}
            </Pressable>
          </View>

          {showSaved && (
            <View style={{ position: 'absolute', top: 20, left: 20, right: 20, backgroundColor: COLORS.neon, padding: 16, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>✓ Profil gespeichert</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
