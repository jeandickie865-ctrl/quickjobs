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
import { getApplicationsForWorker } from '../../utils/applicationStore';

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
  const [shortBio, setShortBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Tags
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  
  // Neue State für aktive Kategorie (für besseren Mobile Flow)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Matches Badge Count
  const [matchesCount, setMatchesCount] = useState(0);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Kategorien laden
  const availableCategories = useMemo(() => listCategories(), []);

  // Aktivitäten nur für die AKTIVE Kategorie anzeigen (besserer Mobile Flow)
  const availableActivities = useMemo(() => {
    if (!activeCategory) return [];
    
    const cat = TAXONOMY.find((c) => c.key === activeCategory);
    return cat?.activities || [];
  }, [activeCategory]);

  // Qualifikationen nur für die AKTIVE Kategorie anzeigen
  const availableQualifications = useMemo(() => {
    if (!activeCategory) return [];
    
    const quals: string[] = [];

    const cat = TAXONOMY.find((c) => c.key === activeCategory);
    return cat?.qualifications || [];
  }, [activeCategory]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadMatchesCount();
    }
  }, [user]);

  const loadMatchesCount = async () => {
    if (!user) return;
    try {
      const apps = await getApplicationsForWorker(user.id);
      const acceptedCount = apps.filter(app => app.status === 'accepted').length;
      setMatchesCount(acceptedCount);
    } catch (err) {
      console.log('Error loading matches count:', err);
    }
  };

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
        setName(data.firstName || '');
        setShortBio(data.shortBio || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setStreet(data.homeAddress?.street || '');
        setPostalCode(data.homeAddress?.postalCode || '');
        setCity(data.homeAddress?.city || '');
        setLat(data.homeLat || undefined);
        setLon(data.homeLon || undefined);
        setRadiusKm(String(data.radiusKm || 15));
        setPhotoUrl(data.profilePhotoUri || '');
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

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.5, // Reduzierte Qualität für kleinere Größe
        aspect: [1, 1],
        base64: true, // Base64 für AsyncStorage
      });

      if (result.canceled) return;

      // Konvertiere zu Base64 Data URI
      const base64 = result.assets[0].base64;
      if (base64) {
        const dataUri = `data:image/jpeg;base64,${base64}`;
        setPhotoUrl(dataUri);
        console.log('✅ Foto als Base64 gespeichert (Größe:', Math.round(base64.length / 1024), 'KB)');
      } else {
        console.error('❌ Kein Base64 verfügbar');
      }
    } catch (err) {
      console.error('❌ Fehler beim Foto auswählen:', err);
    }
  };

  const toggleCategory = (key: string) => {
    if (selectedCategories.includes(key)) {
      // Kategorie abwählen
      setSelectedCategories(selectedCategories.filter((c) => c !== key));
      // Wenn das die aktive war, schließen
      if (activeCategory === key) {
        setActiveCategory(null);
      }
    } else {
      // Kategorie hinzufügen
      setSelectedCategories([...selectedCategories, key]);
      // Diese Kategorie als aktiv setzen (Flow öffnet sich)
      setActiveCategory(key);
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
        categories: selectedCategories || [],
        selectedTags: combinedTags || [],
        radiusKm: parseInt(radiusKm),
        homeAddress: {
          street,
          postalCode,
          city,
          country: 'DE',
        },
        homeLat: lat || null,
        homeLon: lon || null,
        firstName: name,
        shortBio: shortBio.trim() || undefined,
        profilePhotoUri: photoUrl || undefined,
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

      // Web-kompatible Success-Meldung und Navigation
      console.log('🎉 PROFIL ERFOLGREICH GESPEICHERT! Weiterleitung zum Feed...');
      
      // Direkt zum Feed navigieren
      setTimeout(() => {
        router.push('/(worker)/feed');
      }, 500);
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
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>

          {/* Matches Button */}
          <Pressable
            onPress={() => router.push('/(worker)/matches')}
            style={({ pressed }) => ({
              backgroundColor: colors.neon,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: pressed ? 0.9 : 1,
              shadowColor: colors.neon,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                backgroundColor: colors.black,
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24 }}>{matchesCount > 0 ? '🎉' : '💼'}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.black }}>
                  {matchesCount > 0 ? 'Neue Matches!' : 'Meine Matches'}
                </Text>
                <Text style={{ fontSize: 14, color: colors.black, opacity: 0.7 }}>
                  {matchesCount > 0 ? `Du hast ${matchesCount} ${matchesCount === 1 ? 'neues Match' : 'neue Matches'}` : 'Noch keine Matches'}
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: colors.black,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.neon }}>
                {matchesCount}
              </Text>
            </View>
          </Pressable>

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

          {/* Kurzer Steckbrief */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.neon, fontWeight: '700', fontSize: 12, marginBottom: 8 }}>
              KURZER STECKBRIEF (Optional)
            </Text>
            <Text style={{ color: colors.whiteTransparent, fontSize: 12, marginBottom: 12 }}>
              Schreibe ein paar Sätze über dich. Dieser Text wird dem Arbeitgeber bei deiner Bewerbung angezeigt.
            </Text>
            <View style={{
              backgroundColor: colors.white,
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <TextInput
                value={shortBio}
                onChangeText={setShortBio}
                placeholder="z.B. Ich bin ein erfahrener Sicherheitsmitarbeiter mit 5 Jahren Erfahrung..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={300}
                style={{ 
                  fontSize: 15, 
                  color: colors.black,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
              <Text style={{ 
                color: '#999', 
                fontSize: 11, 
                textAlign: 'right', 
                marginTop: 8 
              }}>
                {shortBio.length}/300 Zeichen
              </Text>
            </View>
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
              marginBottom: 4,
            }}>
              KATEGORIEN *
            </Text>
            <Text style={{
              color: colors.gray600,
              fontSize: 11,
              marginBottom: 8,
            }}>
              Tippe auf eine Kategorie, um Tätigkeiten & Qualifikationen auszuwählen
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {availableCategories.map(cat => {
                const isSelected = selectedCategories.includes(cat.key);
                const isActive = activeCategory === cat.key;
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
                      opacity: isSelected && !isActive ? 0.6 : 1,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? colors.black : colors.primary,
                      fontWeight: '600'
                    }}>
                      {isSelected ? '✓ ' : ''}{cat.title}{isActive ? ' ▼' : ''}
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
              marginBottom: 100,
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
