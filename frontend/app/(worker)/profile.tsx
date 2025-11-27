// app/(worker)/profile.tsx - VOLLSTÄNDIGES WORKER PROFILE
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { getWorkerApplications } from '../../utils/applicationStore';
import { Ionicons } from '@expo/vector-icons';

// Import taxonomy data
import taxonomy from '../../shared/taxonomy.json';
import { getTagLabel } from '../../utils/taxonomy';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  borderGray: '#E0E0E0',
};

export default function WorkerProfileScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Load profile on mount
  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) {
        console.log('🔄 Profil-Screen fokussiert - lade Daten neu');
        loadProfile();
      }
    }, [user, authLoading])
  );

  async function loadProfile() {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('📥 Lade Worker-Profil für:', user.id);
      const data = await getWorkerProfile(user.id);
      console.log('✅ Profil geladen:', data);
      
      // Reparatur: Ensure arrays (some old data might be strings)
      if (data && typeof data.categories === "string") {
        data.categories = [data.categories];
      }
      if (data && typeof data.selectedTags === "string") {
        data.selectedTags = [data.selectedTags];
      }
      
      setProfile(data);

      // Load reviews
      const reviews = await getReviewsForWorker(user.id);
      setAvgRating(calculateAverageRating(reviews));
      setReviewCount(reviews.length);

      // Load matches count (accepted applications)
      const apps = await getWorkerApplications();
      const accepted = apps.filter(a => a.status === 'accepted');
      setMatchCount(accepted.length);
      console.log('✅ Accepted applications geladen:', accepted.length);
    } catch (err) {
      console.error('❌ Fehler beim Laden des Profils:', err);
    } finally {
      setLoading(false);
    }
  }

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

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="person-add" size={64} color={COLORS.neon} />
          <Text style={{ color: COLORS.white, marginTop: 16, fontSize: 18, textAlign: 'center' }}>
            Noch kein Profil vorhanden
          </Text>
          <Pressable
            onPress={() => router.push('/(worker)/profile-wizard/step1-basic')}
            style={{
              backgroundColor: COLORS.neon,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
              Profil erstellen
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // Get initials for avatar
  const getInitials = () => {
    const first = profile?.firstName?.charAt(0) || '';
    const last = profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Map category keys to labels
  const getCategoryLabels = () => {
    if (!profile?.categories || profile.categories.length === 0) return [];
    return profile.categories.map((catKey: string) => {
      return taxonomy[catKey]?.label || catKey;
    });
  };

  // Map tag keys to labels (from selectedTags)
  const getTagLabels = () => {
    if (!profile?.selectedTags || profile.selectedTags.length === 0) return [];
    const tags: string[] = [];
    
    profile.selectedTags.forEach((tagKey: string) => {
      TAXONOMY_DATA.categories.forEach((cat: any) => {
        // Check activities
        const activity = cat.activities?.find((a: any) => a.key === tagKey);
        if (activity) {
          tags.push(activity.label);
          return;
        }
        // Check qualifications
        const qual = cat.qualifications?.find((q: any) => q.key === tagKey);
        if (qual) {
          tags.push(qual.label);
        }
      });
    });
    
    return tags;
  };

  const categoryLabels = getCategoryLabels();
  const tagLabels = getTagLabels();

  console.log('📊 Anzuzeigende Daten:');
  console.log('  - Name:', profile.firstName, profile.lastName);
  console.log('  - Kategorien:', categoryLabels);
  console.log('  - Tags:', tagLabels);
  console.log('  - Adresse:', profile.homeAddress);
  console.log('  - Radius:', profile.radiusKm);
  console.log('  - Kontakt:', profile.email, profile.phone);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.purple }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white }}>
            Mein Profil
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable 
              onPress={() => router.push('/(worker)/profile-wizard/step1-basic')}
            >
              <Ionicons name="create-outline" size={26} color={COLORS.neon} />
            </Pressable>
            <Pressable 
              onPress={async () => {
                await signOut();
                router.replace('/auth/login');
              }}
            >
              <Ionicons name="log-out-outline" size={26} color={COLORS.neon} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1) Header-Bereich: Profilbild, Name, Bewertung */}
        <View style={{
          backgroundColor: COLORS.purple,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 30,
          alignItems: 'center',
        }}>
          {/* Profilbild oder Initialen */}
          {profile.photoUrl || profile.profilePhotoUri ? (
            <Image
              source={{ uri: profile.photoUrl || profile.profilePhotoUri }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 4,
                borderColor: COLORS.neon,
                marginBottom: 16,
              }}
            />
          ) : (
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: COLORS.white,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: COLORS.neon,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.purple }}>
                {getInitials()}
              </Text>
            </View>
          )}

          {/* Vollständiger Name */}
          <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.white, marginBottom: 12 }}>
            {profile.firstName} {profile.lastName}
          </Text>

          {/* Bewertung */}
          {reviewCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="star" size={18} color={COLORS.neon} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white, marginLeft: 6 }}>
                {avgRating.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.white, marginLeft: 4 }}>
                ({reviewCount} Bewertungen)
              </Text>
            </View>
          )}
        </View>

        {/* Content Area */}
        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          
          {/* Meine Matches Button */}
          <Pressable
            onPress={() => router.push('/(worker)/matches')}
            style={({ pressed }) => ({
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                backgroundColor: COLORS.neon,
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="people" size={24} color={COLORS.black} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
                  Meine Matches
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                  Angenommene Aufträge
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: COLORS.purple,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.neon }}>
                {matchCount}
              </Text>
            </View>
          </Pressable>
          
          {/* 2) Über mich / Profiltext */}
          {profile.shortBio && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="information-circle" size={22} color={COLORS.purple} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                  Über mich
                </Text>
              </View>
              <Text style={{ fontSize: 15, color: COLORS.darkGray, lineHeight: 22 }}>
                {profile.shortBio}
              </Text>
            </View>
          )}

          {/* 3) Wohnadresse - VOLLSTÄNDIG */}
          {profile.homeAddress && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="home" size={22} color={COLORS.purple} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                  Wohnadresse
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                {/* Zeile 1: Straße + Hausnummer */}
                <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                  {profile.homeAddress.street} {profile.homeAddress.houseNumber || ''}
                </Text>
                {/* Zeile 2: PLZ + Stadt */}
                <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                  {profile.homeAddress.postalCode} {profile.homeAddress.city}
                </Text>
                {/* Zeile 3: Land */}
                {profile.homeAddress.country && (
                  <Text style={{ fontSize: 15, color: COLORS.darkGray }}>
                    {profile.homeAddress.country}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* 4) Tätigkeiten & Qualifikationen - ALLE CHIPS */}
          {(categoryLabels.length > 0 || tagLabels.length > 0) && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="briefcase" size={22} color={COLORS.purple} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                  Tätigkeiten & Qualifikationen
                </Text>
              </View>

              {/* Kategorien als Purple Chips */}
              {categoryLabels.length > 0 && (
                <View style={{ marginBottom: tagLabels.length > 0 ? 16 : 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                    KATEGORIEN
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {categoryLabels.map((label, idx) => (
                      <View key={idx} style={{
                        backgroundColor: COLORS.purple,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags/Qualifikationen als Gray Chips */}
              {tagLabels.length > 0 && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                    QUALIFIKATIONEN & TÄTIGKEITEN
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {tagLabels.map((label, idx) => (
                      <View key={idx} style={{
                        backgroundColor: COLORS.lightGray,
                        borderWidth: 1,
                        borderColor: COLORS.borderGray,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.darkGray }}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 5) Kontaktinformationen - FÜR WORKER SELBST IMMER SICHTBAR */}
          {(profile.email || profile.phone) && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="call" size={22} color={COLORS.purple} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                  Kontaktinformationen
                </Text>
              </View>

              {/* E-Mail */}
              {profile.email && (
                <View style={{ marginBottom: profile.phone ? 12 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="mail-outline" size={16} color={COLORS.darkGray} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginLeft: 6 }}>
                      E-MAIL
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, color: COLORS.darkGray, marginLeft: 22 }}>
                    {profile.email}
                  </Text>
                </View>
              )}

              {/* Telefon */}
              {profile.phone && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="call-outline" size={16} color={COLORS.darkGray} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginLeft: 6 }}>
                      TELEFON
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, color: COLORS.darkGray, marginLeft: 22 }}>
                    {profile.phone}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 6) Arbeitsradius - GROSSE ZAHL */}
          {profile.radiusKm && (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="location" size={22} color={COLORS.purple} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black, marginLeft: 8 }}>
                  Arbeitsradius
                </Text>
              </View>
              <Text style={{ fontSize: 48, fontWeight: '900', color: COLORS.purple }}>
                {profile.radiusKm}
              </Text>
              <Text style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
                Kilometer Umkreis
              </Text>
            </View>
          )}

          {/* 7) Profil bearbeiten Button */}
          <Pressable
            onPress={() => router.push('/(worker)/edit-profile')}
            style={({ pressed }) => ({
              backgroundColor: COLORS.neon,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 20,
              opacity: pressed ? 0.9 : 1,
              shadowColor: COLORS.neon,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 4,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="create-outline" size={22} color={COLORS.black} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.black }}>
                Profil bearbeiten
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
