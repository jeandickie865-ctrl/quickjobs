// app/(worker)/edit-profile.tsx - NEON TECH EDITABLE PROFILE
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getWorkerProfile, uploadProfilePhoto, updateWorkerProfile } from '../../services/api';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

// Kategorien Liste (sollte aus taxonomy kommen)
const CATEGORIES = [
  'Gastronomie',
  'Events',
  'Logistik',
  'Reinigung',
  'Handwerk',
  'IT & Digital',
  'Marketing',
  'Gesundheit',
  'Bildung',
  'Einzelhandel',
  'Sicherheit',
  'Pflege',
  'Büro',
  'Sonstiges',
];

const QUALIFICATIONS = [
  'Führerschein B',
  'Führerschein CE',
  'Staplerführerschein',
  'Erste Hilfe',
  'Hygieneschulung',
  '34a Schein',
  'Sprachkenntnisse Englisch',
  'Sprachkenntnisse Französisch',
  'Sprachkenntnisse Spanisch',
  'PC-Kenntnisse',
  'Berufserfahrung 1-3 Jahre',
  'Berufserfahrung 3+ Jahre',
];

export default function EditWorkerProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Profile fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [radiusKm, setRadiusKm] = useState('15');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  
  // Focus state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getWorkerProfile();
      if (data) {
        setName(data.name || '');
        setStreet(data.street || '');
        setPostalCode(data.postal_code || '');
        setCity(data.city || '');
        setLat(data.lat);
        setLon(data.lon);
        setRadiusKm(String(data.radius_km || 15));
        setPhotoUrl(data.photo_url || '');
        setSelectedCategories(data.categories || []);
        setSelectedQualifications(data.qualifications || []);
      }
    } catch (err) {
      console.log('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploading(true);

      const uploadRes = await uploadProfilePhoto(uri);
      setPhotoUrl(uploadRes.url);
      Alert.alert('Erfolg', 'Foto hochgeladen');
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Fehler', 'Foto konnte nicht hochgeladen werden.');
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleQualification = (qual: string) => {
    if (selectedQualifications.includes(qual)) {
      setSelectedQualifications(selectedQualifications.filter(q => q !== qual));
    } else {
      setSelectedQualifications([...selectedQualifications, qual]);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Fehler', 'Bitte Name eingeben');
      return;
    }
    if (!street.trim() || !postalCode.trim() || !city.trim()) {
      Alert.alert('Fehler', 'Bitte vollständige Adresse eingeben');
      return;
    }
    if (selectedCategories.length === 0) {
      Alert.alert('Fehler', 'Bitte mindestens eine Kategorie auswählen');
      return;
    }

    const radius = parseInt(radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200) {
      Alert.alert('Fehler', 'Radius muss zwischen 1 und 200 km liegen');
      return;
    }

    setSaving(true);
    try {
      await updateWorkerProfile({
        name: name.trim(),
        street: street.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        lat,
        lon,
        radius_km: radius,
        photo_url: photoUrl || undefined,
        categories: selectedCategories,
        qualifications: selectedQualifications,
        activities: [], // Can be added later
      });

      Alert.alert('Erfolg', 'Profil gespeichert!', [
        { text: 'OK', onPress: () => router.push('/(worker)/feed') }
      ]);
    } catch (err) {
      console.log('Save error:', err);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.neon} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <View style={{ width: 26 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Mein Profil
          </Text>
          <Pressable onPress={() => router.push('/(worker)/feed')}>
            <Ionicons name="home-outline" size={26} color={colors.neon} />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24 }}
        >
          {/* Photo Section */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              borderWidth: 4,
              borderColor: colors.neon,
              borderRadius: 100,
              padding: 8,
              backgroundColor: colors.primary,
            }}>
              <Image
                source={
                  photoUrl
                    ? { uri: photoUrl }
                    : { uri: 'https://via.placeholder.com/160/CCCCCC/000000?text=US' }
                }
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: '#E0E0E0',
                }}
              />
            </View>

            <Pressable
              onPress={pickPhoto}
              disabled={uploading}
              style={{
                marginTop: 16,
                backgroundColor: uploading ? colors.gray400 : colors.neon,
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              {uploading ? (
                <ActivityIndicator color={colors.black} size="small" />
              ) : (
                <Text style={{ color: colors.black, fontWeight: '700', fontSize: 14 }}>
                  📸 Foto hochladen
                </Text>
              )}
            </Pressable>
          </View>

          {/* Name */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8 
            }}>
              NAME *
            </Text>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: focusedField === 'name' ? colors.neon : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Dein Name"
                placeholderTextColor="#999"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={{ fontSize: 16, color: colors.black }}
              />
            </View>
          </View>

          {/* Address */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8 
            }}>
              ADRESSE *
            </Text>
            <AddressAutocompleteInput
              street={street}
              postalCode={postalCode}
              city={city}
              onStreetChange={setStreet}
              onPostalCodeChange={setPostalCode}
              onCityChange={setCity}
              onLatChange={setLat}
              onLonChange={setLon}
            />
          </View>

          {/* Radius */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8 
            }}>
              RADIUS (KM) *
            </Text>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: focusedField === 'radius' ? colors.neon : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <TextInput
                value={radiusKm}
                onChangeText={setRadiusKm}
                placeholder="15"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                onFocus={() => setFocusedField('radius')}
                onBlur={() => setFocusedField(null)}
                style={{ fontSize: 16, color: colors.black }}
              />
            </View>
            <Text style={{ color: colors.caption, fontSize: 12, marginTop: 6 }}>
              Wie weit bist du bereit zu fahren? (1-200 km)
            </Text>
          </View>

          {/* Categories */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 12 
            }}>
              KATEGORIEN * (Mehrfachauswahl)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={{
                      backgroundColor: isSelected ? colors.neon : colors.white,
                      borderRadius: 20,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.neon : colors.primary,
                    }}
                  >
                    <Text style={{ 
                      color: isSelected ? colors.black : colors.primary, 
                      fontSize: 14, 
                      fontWeight: isSelected ? '700' : '500' 
                    }}>
                      {isSelected ? '✓ ' : ''}{cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Qualifications */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 12 
            }}>
              QUALIFIKATIONEN (Optional)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUALIFICATIONS.map((qual) => {
                const isSelected = selectedQualifications.includes(qual);
                return (
                  <Pressable
                    key={qual}
                    onPress={() => toggleQualification(qual)}
                    style={{
                      backgroundColor: isSelected ? colors.neon : colors.white,
                      borderRadius: 20,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.neon : colors.primary,
                    }}
                  >
                    <Text style={{ 
                      color: isSelected ? colors.black : colors.primary, 
                      fontSize: 14, 
                      fontWeight: isSelected ? '700' : '500' 
                    }}>
                      {isSelected ? '✓ ' : ''}{qual}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? colors.gray400 : colors.neon,
              borderRadius: 18,
              paddingVertical: 18,
              alignItems: 'center',
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={{ 
                color: colors.black, 
                fontSize: 16, 
                fontWeight: '700',
                letterSpacing: 0.5 
              }}>
                Profil speichern
              </Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
