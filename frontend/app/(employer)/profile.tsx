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

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  whiteTransparent: 'rgba(255,255,255,0.7)',
  neonShadow: 'rgba(200,255,22,0.2)',
};

export default function EmployerProfileViewScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
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

      // Load matches count
      const apps = await getApplicationsForEmployer(user.id);
      const acceptedApps = apps.filter(app => app.status === 'accepted');
      setMatchesCount(acceptedApps.length);

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
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/start" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
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
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
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
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                  Angenommene Bewerber
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
                {matchesCount}
              </Text>
            </View>
          </Pressable>

          {/* Profile Card */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 24,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            {/* Profile Header with Photo */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.purple,
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
              <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.black, textAlign: 'center' }}>
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile?.company || 'Kein Name'}
              </Text>
              {profile?.company && (
                <Text style={{ fontSize: 16, color: COLORS.darkGray, marginTop: 4 }}>
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
                backgroundColor: '#F8F8F8',
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.neon,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.darkGray, fontStyle: 'italic' }}>
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
                  <Ionicons name="mail" size={20} color={COLORS.purple} />
                  <Text style={{ fontSize: 15, color: COLORS.black }}>{profile.email}</Text>
                </View>
              )}

              {profile?.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="call" size={20} color={COLORS.purple} />
                  <Text style={{ fontSize: 15, color: COLORS.black }}>{profile.phone}</Text>
                </View>
              )}

              {(profile?.street || profile?.postalCode || profile?.city) && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <Ionicons name="location" size={20} color={COLORS.purple} />
                  <View>
                    {profile?.street && (
                      <Text style={{ fontSize: 15, color: COLORS.black }}>{profile.street}</Text>
                    )}
                    {(profile?.postalCode || profile?.city) && (
                      <Text style={{ fontSize: 15, color: COLORS.black }}>
                        {profile?.postalCode} {profile?.city}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {profile?.paymentMethod && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="card" size={20} color={COLORS.purple} />
                  <Text style={{ fontSize: 15, color: COLORS.black }}>
                    {profile.paymentMethod === 'card' ? 'Kreditkarte' : 'PayPal'}
                  </Text>
                </View>
              )}
            </View>

            {/* Edit Button */}
            <Pressable
              onPress={() => router.push('/(employer)/edit-profile')}
              style={({ pressed }) => ({
                backgroundColor: COLORS.neon,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
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
