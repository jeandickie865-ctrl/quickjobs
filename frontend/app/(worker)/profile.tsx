// app/(worker)/profile.tsx – FIXED VERSION, NO ERRORS

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// ❗️ FIX: Richtiger Import – NICHT mehr ../../src/taxonomy
import { TAXONOMY, listCategories } from '../../constants/workerData';

// BUG 3 FIX: Nutze AsyncStorage statt Backend API
import { getWorkerProfile as getWorkerProfileLocal, saveWorkerProfile } from '../../utils/profileStore';
import { diagnoseAsyncStorage } from '../../utils/diagnostics';

export default function WorkerProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>();
  const [lon, setLon] = useState<number | undefined>();
  const [radiusKm, setRadiusKm] = useState('15');
  const [photoUrl, setPhotoUrl] = useState('');

  // Tags
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Kategorien laden
  const availableCategories = useMemo(() => listCategories(), []);

  // Aktivitäten dynamisch basierend auf Kategorie
  const availableActivities = useMemo(() => {
    const acts: string[] = [];

    selectedCategories.forEach((key) => {
      const cat = TAXONOMY.find((c) => c.key === key);
      if (cat?.activities) {
        cat.activities.forEach((a) => {
          if (!acts.includes(a)) acts.push(a);
        });
      }
    });

    return acts;
  }, [selectedCategories]);

  // Qualifikationen dynamisch basierend auf Kategorie
  const availableQualifications = useMemo(() => {
    const quals: string[] = [];

    selectedCategories.forEach((key) => {
      const cat = TAXONOMY.find((c) => c.key === key);
      if (cat?.qualifications) {
        cat.qualifications.forEach((q) => {
          if (!quals.includes(q)) quals.push(q);
        });
      }
    });

    return quals;
  }, [selectedCategories]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Entfernt ungültige gespeicherte Activities & Qualifications
  useEffect(() => {
    if (!loading) {
      // gültige Werte aus Taxonomy ableiten
      const validActivities = availableActivities.filter(a =>
        selectedActivities.includes(a)
      );

      const validQualifications = availableQualifications.filter(q =>
        selectedQualifications.includes(q)
      );

      // falls Werte ungültig → automatisch korrigieren
      if (validActivities.length !== selectedActivities.length) {
        setSelectedActivities(validActivities);
      }

      if (validQualifications.length !== selectedQualifications.length) {
        setSelectedQualifications(validQualifications);
      }
    }
  }, [loading, availableActivities, availableQualifications]);

  const loadProfile = async () => {
    try {
      // BUG 3 FIX: Lade Profil aus AsyncStorage
      if (!user) {
        console.log('⚠️ No user logged in, cannot load profile');
        setLoading(false);
        return;
      }

      const data = await getWorkerProfileLocal(user.id);
      
      if (data) {
        setName(data.name || '');
        setStreet(data.street || '');
        setPostalCode(data.postalCode || '');
        setCity(data.city || '');
        setLat(data.homeLat);
        setLon(data.homeLon);
        setRadiusKm(String(data.radiusKm || 15));
        setPhotoUrl(data.photoUrl || '');
        setSelectedCategories(data.categories || []);
        setSelectedActivities(data.selectedTags?.filter(t => 
          TAXONOMY.some(cat => cat.activities?.includes(t))
        ) || []);
        setSelectedQualifications(data.selectedTags?.filter(t => 
          TAXONOMY.some(cat => cat.qualifications?.includes(t))
        ) || []);
        console.log('✅ Profile loaded from AsyncStorage');
      } else {
        console.log('ℹ️ No profile found - new profile');
      }
    } catch (err) {
      console.log('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // BUG 3 FIX: Foto-Upload deaktiviert (braucht Backend)
  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      // Lokal speichern (kein Upload)
      setPhotoUrl(uri);
      Alert.alert('Erfolg', 'Foto ausgewählt');
    } catch (err) {
      Alert.alert('Fehler', 'Foto konnte nicht ausgewählt werden.');
    }
  };

  const toggleCategory = (key: string) => {
    if (selectedCategories.includes(key)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== key));
    } else {
      setSelectedCategories([...selectedCategories, key]);
    }
  };

  const toggleActivity = (act: string) => {
    if (selectedActivities.includes(act)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== act));
    } else {
      setSelectedActivities([...selectedActivities, act]);
    }
  };

  const toggleQualification = (qual: string) => {
    if (selectedQualifications.includes(qual)) {
      setSelectedQualifications(selectedQualifications.filter((q) => q !== qual));
    } else {
      setSelectedQualifications([...selectedQualifications, qual]);
    }
  };

  const handleSave = async () => {
    // BUG 3 FIX: Validierung
    if (!user) {
      return Alert.alert('Fehler', 'Du bist nicht eingeloggt.');
    }

    if (!name.trim()) return Alert.alert('Fehler', 'Bitte Name eingeben');
    if (!street.trim() || !postalCode.trim() || !city.trim())
      return Alert.alert('Fehler', 'Bitte vollständige Adresse eingeben');

    const radius = parseInt(radiusKm);
    if (isNaN(radius) || radius < 1 || radius > 200)
      return Alert.alert('Fehler', 'Radius muss zwischen 1 und 200 km liegen');

    // BUG 2 FIX RELATED: Koordinaten sind optional (nicht mehr zwingend erforderlich)
    // Aber wir zeigen eine Warnung
    if (!lat || !lon) {
      Alert.alert(
        'Hinweis',
        'Koordinaten fehlen. Du kannst das Profil trotzdem speichern, aber das Radius-Matching funktioniert nur mit Koordinaten. Wähle deine Adresse aus der Vorschlagsliste für besseres Matching.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'Trotzdem speichern', 
            onPress: async () => await saveProfileData() 
          }
        ]
      );
      return;
    }

    await saveProfileData();
  };

  const saveProfileData = async () => {
    console.log('🔵 saveProfileData: START');
    setSaving(true);

    try {
      if (!user) {
        console.log('❌ saveProfileData: No user logged in');
        throw new Error('Not logged in');
      }

      console.log('🔵 saveProfileData: User ID:', user.id);

      // Kombiniere activities und qualifications zu selectedTags
      const combinedTags = [...selectedActivities, ...selectedQualifications];
      console.log('🔵 saveProfileData: Combined tags:', combinedTags.length);

      const profileData = {
        userId: user.id,
        name,
        street,
        postalCode,
        city,
        homeLat: lat,
        homeLon: lon,
        categories: selectedCategories || [],
        selectedTags: combinedTags || [],
        radiusKm: parseInt(radiusKm),
        photoUrl: photoUrl || undefined,
        pushToken: undefined,
      };

      console.log('🔵 saveProfileData: Profile data prepared:', {
        userId: profileData.userId,
        name: profileData.name,
        categories: profileData.categories.length,
        tags: profileData.selectedTags.length,
      });

      // BUG 3 FIX: Speichere in AsyncStorage
      console.log('🔵 saveProfileData: Calling saveWorkerProfile...');
      await saveWorkerProfile(profileData);

      console.log('✅ Profile saved to AsyncStorage successfully!');

      Alert.alert('Erfolg', 'Profil erfolgreich gespeichert! 🎉', [
        { text: 'OK', onPress: () => router.push('/(worker)/feed') },
      ]);
    } catch (err) {
      console.error('❌ Save error:', err);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setSaving(false);
      console.log('🔵 saveProfileData: END');
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
          <View style={{ width: 60 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Mein Profil</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={diagnoseAsyncStorage} style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: '#ff6b6b',
              borderRadius: 8,
            }}>
              <Ionicons name="bug-outline" size={20} color="white" />
            </Pressable>
            <Pressable 
              onPress={async () => {
                await signOut();
                router.replace('/start');
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: colors.neon,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.black }}>
                Logout
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>

          {/* Photo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              borderWidth: 3,
              borderColor: colors.neon,
              borderRadius: 100,
              padding: 6,
            }}>
              <Image
                source={photoUrl ? { uri: photoUrl } : { uri: 'https://via.placeholder.com/150/CCCCCC/666666?text=USER' }}
                style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: '#E0E0E0' }}
              />
            </View>

            <Pressable
              onPress={pickPhoto}
              style={{
                marginTop: 16,
                backgroundColor: colors.neon,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: colors.black, fontWeight: '700' }}>Foto wählen</Text>
            </Pressable>
          </View>

          {/* Name */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12 }}>NAME *</Text>
            <View style={{
              marginTop: 6,
              backgroundColor: colors.white,
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Dein Name"
                placeholderTextColor="#999"
                style={{ fontSize: 16, color: colors.black }}
              />
            </View>
          </View>

          {/* Address */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12 }}>ADRESSE *</Text>

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
            <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12, marginBottom: 12 }}>
              RADIUS (KM) *
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {[15, 30, 50, 100].map((km) => (
                <Pressable
                  key={km}
                  onPress={() => setRadiusKm(String(km))}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: radiusKm === String(km) ? colors.neon : colors.white,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: radiusKm === String(km) ? colors.neon : colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: radiusKm === String(km) ? colors.black : colors.primary,
                  }}>
                    {km} km
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Categories */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{
              color: colors.neon,
              fontWeight: '700',
              fontSize: 12,
              marginBottom: 8,
            }}>
              KATEGORIEN *
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {availableCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat.key);
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => toggleCategory(cat.key)}
                    style={{
                      backgroundColor: isSelected ? colors.neon : colors.white,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.neon : colors.primary,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? colors.black : colors.primary,
                      fontWeight: '600'
                    }}>
                      {isSelected ? '✓ ' : ''}{cat.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Activities */}
          {availableActivities.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12 }}>
                TÄTIGKEITEN
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {availableActivities.map((a, idx) => {
                  const isSelected = selectedActivities.includes(a);
                  return (
                    <Pressable
                      key={`${a}-${idx}`}
                      onPress={() => toggleActivity(a)}
                      style={{
                        backgroundColor: isSelected ? colors.neon : colors.white,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.neon : colors.primary,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{
                        color: isSelected ? colors.black : colors.primary,
                        fontWeight: '600'
                      }}>
                        {isSelected ? '✓ ' : ''}{a}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Qualifications */}
          {availableQualifications.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12 }}>
                QUALIFIKATIONEN (optional)
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {availableQualifications.map((q, idx) => {
                  const isSelected = selectedQualifications.includes(q);
                  return (
                    <Pressable
                      key={`${q}-${idx}`}
                      onPress={() => toggleQualification(q)}
                      style={{
                        backgroundColor: isSelected ? colors.neon : colors.white,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.neon : colors.primary,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{
                        color: isSelected ? colors.black : colors.primary,
                        fontWeight: '600'
                      }}>
                        {isSelected ? '✓ ' : ''}{q}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? colors.gray400 : colors.neon,
              paddingVertical: 18,
              borderRadius: 20,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            {saving
              ? <ActivityIndicator color={colors.black} />
              : <Text style={{ color: colors.black, fontWeight: '700', fontSize: 16 }}>Profil speichern</Text>}
          </Pressable>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
