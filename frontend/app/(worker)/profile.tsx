// app/(worker)/profile.tsx – DARK Quickjobs DESIGN
import React, { useState, useEffect } from 'react';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { getWorkerApplications } from '../../utils/applicationStore';
import { Ionicons } from '@expo/vector-icons';
import taxonomy from '../../shared/taxonomy.json';
import { getTagLabel } from '../../utils/taxonomy';
import { AppHeader } from '../../components/AppHeader';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#9333EA',      // Lila
  primaryLight: '#C084FC', // Helles Lila
  secondary: '#FF773D',    // Orange
  accent: '#EFABFF',       // Rosa
  accentLight: '#FCE7FF',  // Sehr helles Rosa
  border: '#E9D5FF',       // Lila Border
  inputBg: '#FAF5FF',      // Sehr helles Lila für Inputs
  inputBorder: '#DDD6FE',  // Lila Border für Inputs
  text: '#1A1A1A',         // Dunkelgrau für Text
  textMuted: '#6B7280',    // Grau für sekundären Text
  error: '#EF4444',        // Rot für Fehler
};

export default function WorkerProfileScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) loadProfile();
    }, [user, authLoading])
  );

  async function loadProfile() {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getWorkerProfile(user.id);

      if (data && typeof data.categories === 'string') data.categories = [data.categories];
      if (data && typeof data.selectedTags === 'string') data.selectedTags = [data.selectedTags];

      setProfile(data);

      const reviewsData = await getReviewsForWorker(user.id);
      setReviews(reviewsData);
      setAvgRating(calculateAverageRating(reviewsData));
      setReviewCount(reviewsData.length);

      const apps = await getWorkerApplications();
      const accepted = apps.filter(a => a.status === 'accepted');
      setMatchCount(accepted.length);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={{ color: COLORS.text, marginTop: 12 }}>Lädt Profil</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* HEADER */}
        <View style={{ backgroundColor: COLORS.primary, padding: 20 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '700' }}>
            Dashboard
          </Text>
        </View>

        <ArrowDoodle />


          <Ionicons name="person-add" size={64} color={COLORS.accent} />
          <Text style={{ color: COLORS.text, marginTop: 16, fontSize: 18 }}>Noch kein Profil vorhanden</Text>

          <Pressable
            onPress={() => router.push('/(worker)/profile-wizard/step1-basic')}
            style={{
              backgroundColor: COLORS.purple,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>Profil erstellen</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const getInitials = () => {
    const first = profile?.firstName?.charAt(0) || '';
    const last = profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getCategoryLabels = () => {
    if (!profile?.categories) return [];
    return profile.categories.map(key => taxonomy[key]?.label || key);
  };

  const getTagLabels = () => {
    if (!profile?.selectedTags) return [];
    const tags: string[] = [];
    profile.categories?.forEach(cat => {
      profile.selectedTags.forEach(tag => {
        const label = getTagLabel(cat, tag);
        if (label !== tag && !tags.includes(label)) tags.push(label);
      });
    });
    return tags;
  };

  const categoryLabels = getCategoryLabels();
  const tagLabels = getTagLabels();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: COLORS.bg }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>Mein Profil</Text>

          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Pressable onPress={() => router.push('/(worker)/edit-profile')}>
              <Ionicons name="create-outline" size={26} color={COLORS.accent} />
            </Pressable>

            <Pressable
              onPress={async () => {
                await signOut();
                router.replace('/auth/login');
              }}
            >
              <Ionicons name="log-out-outline" size={26} color={COLORS.accent} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: COLORS.bg,
            paddingHorizontal: 20,
            paddingTop: 20,
            alignItems: 'center',
          }}
        >
          {profile.photoUrl || profile.profilePhotoUri ? (
            <Image
              source={{ uri: profile.photoUrl || profile.profilePhotoUri }}
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                borderWidth: 3,
                borderColor: COLORS.accent,
                marginBottom: 14,
              }}
            />
          ) : (
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 55,
                backgroundColor: COLORS.card,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: COLORS.accent,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.text }}>{getInitials()}</Text>
            </View>
          )}

          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>
            {profile.firstName} {profile.lastName}
          </Text>

          {reviewCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="star" size={18} color={COLORS.accent} />
              <Text style={{ color: COLORS.text, marginLeft: 6, fontSize: 16, fontWeight: '700' }}>
                {avgRating.toFixed(1)}
              </Text>
              <Text style={{ color: COLORS.textMuted, marginLeft: 4, fontSize: 14 }}>
                ({reviewCount} Bewertungen)
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Pressable
            onPress={() => router.push('/(worker)/matches')}
            style={{
              backgroundColor: COLORS.card,
              padding: 18,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.purple,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="people" size={24} color={COLORS.text} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>Meine Matches</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Angenommene Aufträge</Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: COLORS.accent,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.bg }}>{matchCount}</Text>
            </View>
          </Pressable>

          {profile.shortBio && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>Über mich</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 15, lineHeight: 22 }}>{profile.shortBio}</Text>
            </View>
          )}

          {/* Selbstständig Status */}
          {profile.isSelfEmployed && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.accent,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: COLORS.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="briefcase" size={20} color={COLORS.bg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.accent }}>
                    Selbstständig
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
                    Keine Anmeldung erforderlich
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Kategorien & Tags */}
          {(categoryLabels.length > 0 || tagLabels.length > 0) && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
                Tätigkeiten und Qualifikationen
              </Text>

              {categoryLabels.length > 0 && (
                <View style={{ marginBottom: tagLabels.length > 0 ? 16 : 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>
                    Kategorien
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {categoryLabels.map((label, idx) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: COLORS.purple,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {tagLabels.length > 0 && (
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8 }}>
                    Qualifikationen
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {tagLabels.map((label, idx) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: COLORS.card,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: COLORS.text }}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Kontakt */}
          {(profile.email || profile.phone) && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
                Kontakt
              </Text>

              {profile.email && (
                <Text style={{ color: COLORS.textMuted, fontSize: 15, marginBottom: profile.phone ? 8 : 0 }}>
                  {profile.email}
                </Text>
              )}

              {profile.phone && <Text style={{ color: COLORS.textMuted, fontSize: 15 }}>{profile.phone}</Text>}
            </View>
          )}

          {profile.radiusKm && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                Arbeitsradius
              </Text>
              <Text style={{ fontSize: 44, fontWeight: '900', color: COLORS.purple }}>{profile.radiusKm}</Text>
              <Text style={{ fontSize: 14, color: COLORS.textMuted }}>Kilometer</Text>
            </View>
          )}

          <Pressable
            onPress={() => router.push('/(worker)/edit-profile')}
            style={{
              backgroundColor: COLORS.purple,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 16,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '700' }}>Profil bearbeiten</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(worker)/registration-data')}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 16,
              width: '100%',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '700' }}>Offizielle Daten bearbeiten</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(worker)/documents')}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 24,
              width: '100%',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '700' }}>Qualifikationsnachweise</Text>
          </Pressable>

          {/* Bewertungen Sektion */}
          {reviews.length > 0 && (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 40,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
                Bewertungen ({reviews.length})
              </Text>
              
              {reviews.map((review, index) => (
                <View
                  key={review.id || index}
                  style={{
                    paddingVertical: 16,
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: COLORS.border,
                  }}
                >
                  {/* Sterne */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={18}
                        color={star <= review.rating ? COLORS.accent : COLORS.textMuted}
                        style={{ marginRight: 4 }}
                      />
                    ))}
                    <Text style={{ color: COLORS.textMuted, marginLeft: 8, fontSize: 14 }}>
                      {new Date(review.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Kommentar */}
                  {review.comment && (
                    <Text style={{ color: COLORS.text, fontSize: 15, lineHeight: 22 }}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
