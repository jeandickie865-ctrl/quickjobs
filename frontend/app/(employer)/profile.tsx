// app/(employer)/profile.tsx - PROFIL-ANSICHT (READ-ONLY)
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployerProfile, EmployerProfile } from '../../utils/employerProfileStore';
import { getReviewsForEmployer, calculateAverageRating } from '../../utils/reviewStore';
import { RatingDisplay } from '../../components/RatingDisplay';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationsForEmployer } from '../../utils/applicationStore';

// BACKUP DARK THEME
const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  neon: '#C8FF16',
  black: '#000000',
};

export default function EmployerProfileViewScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  // Reload profile when screen comes into focus (after saving in edit screen)
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) {
        console.log('🔄 Employer profile screen focused - reloading data');
        loadProfile();
      }
    }, [user, authLoading])
  );

  async function loadProfile() {
    if (!user) return;

    try {
      const prof = await getEmployerProfile(user.id);
      setProfile(prof);

      // Load matches count (accepted) and applications count (pending)
      const apps = await getApplicationsForEmployer();
      const acceptedApps = apps.filter(app => app.status === 'accepted');
      const pendingApps = apps.filter(app => app.status === 'pending');
      setMatchesCount(acceptedApps.length);
      setApplicationsCount(pendingApps.length);

      // Load reviews
      const reviews = await getReviewsForEmployer(user.id);
      setAvgRating(calculateAverageRating(reviews));
      setReviewCount(reviews.length);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/start" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16, fontSize: 15 }}>Lade Profil…</Text>
        </SafeAreaView>
      </View>
    );
  }

  // If no profile exists, redirect to edit
  if (!profile || !profile.firstName) {
    return <Redirect href="/(employer)/edit-profile" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          <View style={{ width: 30 }} />
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white }}>Mein Profil</Text>
          <Pressable 
            onPress={async () => {
              await signOut();
              router.replace('/auth/login');
            }}
          >
            <Ionicons name="log-out-outline" size={26} color={COLORS.neon} />
          </Pressable>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Matches Button */}
          <Pressable
            onPress={() => router.push('/(employer)/matches')}
            style={({ pressed }) => ({
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: COLORS.border,
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
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
                  Meine Matches
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.muted }}>
                  Angenommene Bewerber
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.black }}>
                {matchesCount}
              </Text>
            </View>
          </Pressable>

          {/* Meine Bewerbungen Button */}
          <Pressable
            onPress={() => router.push('/(employer)/applications')}
            style={({ pressed }) => ({
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: COLORS.border,
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
                <Ionicons name="mail-unread" size={24} color={COLORS.black} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
                  Meine Bewerbungen
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.muted }}>
                  Neue Bewerbungen
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.black }}>
                {applicationsCount}
              </Text>
            </View>
          </Pressable>

          {/* Profile Card */}
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}>
            {/* Profile Header with Photo */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.bg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: COLORS.neon,
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: COLORS.white }}>
                  {profile?.firstName?.charAt(0) || profile?.company?.charAt(0) || 'E'}
                </Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.white, textAlign: 'center' }}>
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile?.company || 'Kein Name'}
              </Text>
              {profile?.company && (
                <Text style={{ fontSize: 16, color: COLORS.muted, marginTop: 4 }}>
                  {profile.company}
                </Text>
              )}
              
              {/* Rating */}
              <View style={{ marginTop: 12 }}>
                <RatingDisplay
                  averageRating={avgRating}
                  reviewCount={reviewCount}
                  size="medium"
                  color={COLORS.neon}
                />
              </View>
            </View>

            {/* Bio */}
            {profile?.shortBio && (
              <View style={{
                backgroundColor: COLORS.bg,
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.neon,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.muted, fontStyle: 'italic' }}>
                  "{profile.shortBio}"
                </Text>
              </View>
            )}

            {/* Contact Info */}
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, letterSpacing: 0.5 }}>
                KONTAKTINFORMATIONEN
              </Text>

              {profile?.email && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="mail" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, color: COLORS.white }}>{profile.email}</Text>
                </View>
              )}

              {profile?.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="call" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, color: COLORS.white }}>{profile.phone}</Text>
                </View>
              )}

              {(profile?.street || profile?.postalCode || profile?.city) && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Ionicons name="location" size={20} color={COLORS.neon} />
                  <View>
                    {profile?.street && (
                      <Text style={{ fontSize: 15, color: COLORS.white }}>{profile.street}</Text>
                    )}
                    {(profile?.postalCode || profile?.city) && (
                      <Text style={{ fontSize: 15, color: COLORS.white }}>
                        {profile?.postalCode} {profile?.city}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {profile?.paymentMethod && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="card" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, color: COLORS.white }}>
                    {profile.paymentMethod === 'card' ? 'Kreditkarte' : 'PayPal'}
                  </Text>
                </View>
              )}
            </View>

            {/* Info-Block für private Auftraggeber */}
            {user?.accountType === "private" && user?.isSelfEmployed === false && (
              <View style={{
                backgroundColor: '#ECECEC',
                padding: 14,
                borderRadius: 12,
                marginTop: 20
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6 }}>
                  Rechtlicher Hinweis
                </Text>
                <Text style={{ fontSize: 13, color: '#333', lineHeight: 18 }}>
                  Wenn du jemanden kurzfristig beschäftigst, erstellt die App automatisch Vertrags- 
                  und Abrechnungsunterlagen. Die Meldung an die Minijob-Zentrale nimmst du selbst vor.
                </Text>
              </View>
            )}

            {/* Edit Button */}
            <Pressable
              onPress={() => router.push('/(employer)/edit-profile')}
              style={({ pressed }) => ({
                backgroundColor: COLORS.neon,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: 'center',
                shadowColor: COLORS.neonShadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
                marginTop: 32,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="create-outline" size={20} color={COLORS.black} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  Profil bearbeiten
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
