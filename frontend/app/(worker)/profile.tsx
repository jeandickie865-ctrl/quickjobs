// app/(worker)/profile.tsx - FINAL NEON-TECH DESIGN
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ScrollView, View, Text, TextInput, ActivityIndicator, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { WorkerProfile } from '../../types/profile';
import { getWorkerProfile, saveWorkerProfile } from '../../utils/profileStore';
import { RADIUS_OPTIONS_KM, DEFAULT_RADIUS_KM } from '../../constants/radius';
import { listCategories, groupTagsByType, normalizeCategories, CategoryKey } from '../../src/taxonomy';
import { ProfilePhoto } from '../../components/ProfilePhoto';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { Review } from '../../types/review';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  neonTransparent: 'rgba(200,255,22,0.3)',
};

function createEmptyProfile(userId: string): WorkerProfile {
  return {
    userId,
    categories: [],
    selectedTags: [],
    radius: DEFAULT_RADIUS_KM,
    homeAddress: {},
    homeLat: null,
    homeLon: null,
    profilePhotoUri: undefined,
    documents: [],
  };
}

export default function WorkerProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  
  // Address fields
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lon, setLon] = useState<number | undefined>(undefined);
  const [radius, setRadius] = useState('15');
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Neon Glimmer Effect (Loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const stored = await getWorkerProfile(user.id);
      if (stored) {
        const normalizedCategories = normalizeCategories(stored.categories ?? []);
        setProfile({ ...stored, categories: normalizedCategories });
        setName(stored.name || '');
        
        // Load address fields
        setStreet(stored.homeAddress?.street || '');
        setPostalCode(stored.homeAddress?.postalCode || '');
        setCity(stored.homeAddress?.city || '');
        setLat(stored.homeLat ?? undefined);
        setLon(stored.homeLon ?? undefined);
        setRadius(String(stored.radius || 15));
      } else {
        setProfile(createEmptyProfile(user.id));
      }
      setIsLoading(false);
    })();
  }, [user]);

  // Load reviews
  useEffect(() => {
    if (!user) return;
    (async () => {
      setReviewsLoading(true);
      try {
        const workerReviews = await getReviewsForWorker(user.id);
        setReviews(workerReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [user]);

  const categories = useMemo(() => listCategories(), []);
  const selectedCategories = profile?.categories ?? [];
  const selectedTagsSet = new Set(profile?.selectedTags ?? []);

  const toggleCategory = (cat: CategoryKey) => {
    if (!profile) return;
    const current = profile.categories ?? [];
    const updated = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    setProfile({ ...profile, categories: updated });
  };

  const toggleTag = (tag: string) => {
    if (!profile) return;
    const current = profile.selectedTags ?? [];
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    setProfile({ ...profile, selectedTags: updated });
  };

  async function handleSave() {
    if (!profile || !user) return;
    setIsSaving(true);
    try {
      await saveWorkerProfile({ ...profile, name });
      alert('Profil gespeichert!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/start');
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.purple }}>
        <Text style={{ color: COLORS.white }}>Bitte zuerst einloggen.</Text>
      </View>
    );
  }

  if (isLoading || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Profil...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const avgRating = calculateAverageRating(reviews);
  const latestReviews = reviews.slice(0, 3);

  // Group tags by type
  const tagsByType = groupTagsByType(selectedCategories);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <Animated.View style={{
        position: 'absolute',
        top: -80,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: glimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.08, 0.15],
        }),
        blur: 60,
      }} />

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            Mein Profil
          </Text>
          <Pressable onPress={handleLogout}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.neon }}>
              Logout
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 20 }}
      >
        {/* Profilfoto */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            padding: 4,
            borderRadius: 80,
            borderWidth: 3,
            borderColor: COLORS.neon,
          }}>
            <ProfilePhoto
              uri={profile.profilePhotoUri}
              size={120}
              onPhotoSelected={(uri) => setProfile({ ...profile, profilePhotoUri: uri })}
            />
          </View>
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Ionicons name="cloud-upload-outline" size={24} color={COLORS.neon} />
            <Text style={{ fontSize: 13, color: COLORS.neon, marginTop: 4, fontWeight: '600' }}>
              Foto hochladen
            </Text>
          </View>
        </View>

        {/* Rating-Bereich */}
        {reviews.length > 0 && (
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
              BEWERTUNGEN
            </Text>
            
            {/* Average Rating */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.black }}>
                {avgRating.toFixed(1)}
              </Text>
              <View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= avgRating ? 'star' : 'star-outline'}
                      size={20}
                      color={COLORS.neon}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 2 }}>
                  {reviews.length} {reviews.length === 1 ? 'Bewertung' : 'Bewertungen'}
                </Text>
              </View>
            </View>

            {/* Latest Reviews */}
            {latestReviews.length > 0 && (
              <View style={{ gap: 12 }}>
                {latestReviews.map((review) => (
                  <View key={review.id} style={{
                    padding: 12,
                    backgroundColor: COLORS.lightGray,
                    borderRadius: 12,
                  }}>
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={COLORS.neon}
                        />
                      ))}
                    </View>
                    <Text style={{ fontSize: 13, color: COLORS.black }}>
                      {review.comment || 'Keine Kommentare'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Name Input */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8, letterSpacing: 0.5 }}>
            NAME
          </Text>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Dein Name"
              placeholderTextColor="#999"
              style={{ fontSize: 16, color: COLORS.black }}
            />
          </View>
        </View>

        {/* Adresse */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8, letterSpacing: 0.5 }}>
            WOHNORT
          </Text>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 16 }}>
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
        </View>

        {/* Radius */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8, letterSpacing: 0.5 }}>
            RADIUS (KM)
          </Text>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
            <TextInput
              value={String(profile.radius)}
              onChangeText={(text) => setProfile({ ...profile, radius: parseInt(text) || DEFAULT_RADIUS_KM })}
              keyboardType="numeric"
              placeholder="Radius in km"
              placeholderTextColor="#999"
              style={{ fontSize: 16, color: COLORS.black }}
            />
          </View>
        </View>

        {/* Kategorien */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
            KATEGORIEN
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.key);
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => toggleCategory(cat.key)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: isSelected ? COLORS.neon : COLORS.white,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: '#E0E0E0',
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isSelected ? '700' : '600',
                    color: COLORS.black,
                  }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tags */}
        {Object.entries(tagsByType).map(([type, tags]) => (
          <View key={type}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
              {type.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag) => {
                const isSelected = selectedTagsSet.has(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: isSelected ? COLORS.neon : COLORS.white,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: '#E0E0E0',
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '600',
                      color: COLORS.black,
                    }}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Save Buttons */}
        <View style={{ gap: 12, marginTop: 20 }}>
          {/* Primary Save */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => ({
              backgroundColor: COLORS.neon,
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
              {isSaving ? 'Speichert...' : 'Profil speichern'}
            </Text>
          </Pressable>

          {/* Secondary Back */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: 'transparent',
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: COLORS.neon,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon }}>
              Zurück
            </Text>
          </Pressable>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
