// app/(worker)/profile.tsx - PROFIL-ANSICHT (READ-ONLY)
import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { getApplicationsForWorker } from '../../utils/applicationStore';
import { RatingDisplay } from '../../components/RatingDisplay';
import { Ionicons } from '@expo/vector-icons';

// Import taxonomy data statically
const TAXONOMY_DATA = require('../../shared/taxonomy.json');

const colors = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F0F0F0',
};

export default function WorkerProfileViewScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfile();
  }, [user, authLoading]);

  async function loadProfile() {
    if (!user) return;

    try {
      const prof = await getWorkerProfile(user.id);
      setProfile(prof);

      // Load matches count
      const apps = await getApplicationsForWorker(user.id);
      const acceptedApps = apps.filter(app => app.status === 'accepted');
      setMatchesCount(acceptedApps.length);

      // Load reviews
      const reviews = await getReviewsForWorker(user.id);
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
      <View style={{ flex: 1, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.neon} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/start" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.neon} size="large" />
          <Text style={{ color: colors.white, marginTop: 16, fontSize: 15 }}>Lade Profil…</Text>
        </SafeAreaView>
      </View>
    );
  }

  // If no profile exists, redirect to edit
  if (!profile || !profile.categories || profile.categories.length === 0) {
    return <Redirect href="/(worker)/edit-profile" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.purple }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <View style={{ width: 60 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.white }}>Mein Profil</Text>
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

        <ScrollView 
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Matches Button */}
          <Pressable
            onPress={() => router.push('/(worker)/matches')}
            style={({ pressed }) => ({
              backgroundColor: colors.white,
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
                backgroundColor: colors.neon,
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="heart" size={24} color={colors.black} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.black }}>
                  Meine Matches
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Angenommene Jobs
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: colors.purple,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.neon }}>
                {matchesCount}
              </Text>
            </View>
          </Pressable>

          {/* Profile Card */}
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 24,
            shadowColor: colors.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            {/* Profile Header with Photo */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              {profile?.profilePhotoUri ? (
                <Image 
                  source={{ uri: profile.profilePhotoUri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 4,
                    borderColor: colors.neon,
                    marginBottom: 16,
                  }}
                />
              ) : (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.purple,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: colors.neon,
                  marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 36, fontWeight: '700', color: colors.white }}>
                    {profile?.firstName?.charAt(0) || 'W'}
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black, textAlign: 'center' }}>
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'Kein Name'}
              </Text>
              
              {/* Rating */}
              <View style={{ marginTop: 12 }}>
                <RatingDisplay
                  averageRating={avgRating}
                  reviewCount={reviewCount}
                  size="medium"
                  color={colors.neon}
                />
              </View>
            </View>

            {/* Bio */}
            {profile?.shortBio && (
              <View style={{
                backgroundColor: colors.lightGray,
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: colors.neon,
              }}>
                <Text style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>
                  "{profile.shortBio}"
                </Text>
              </View>
            )}

            {/* Categories with Details */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.neon, letterSpacing: 0.5, marginBottom: 16 }}>
                MEINE TÄTIGKEITEN & QUALIFIKATIONEN
              </Text>
              
              {(() => {
                // Use imported taxonomy data
                const taxonomy = TAXONOMY_DATA;
                
                return profile?.categories?.map((categoryKey, catIdx) => {
                const category = taxonomy.categories.find((c: any) => c.key === categoryKey);
                
                if (!category) return null;
                
                // Debug: Check what tags we have
                console.log('Profile selectedTags:', profile.selectedTags);
                console.log('Category:', categoryKey);
                console.log('Available activities:', category.activities.map((a: any) => a.key));
                console.log('Available qualifications:', category.qualifications.map((q: any) => q.key));
                
                // Filter activities and qualifications from selectedTags
                const allTags = profile.selectedTags || [];
                const categoryActivities = category.activities
                  .filter((act: any) => allTags.includes(act.key))
                  .map((act: any) => act.label);
                
                const categoryQualifications = category.qualifications
                  .filter((qual: any) => allTags.includes(qual.key))
                  .map((qual: any) => qual.label);
                
                console.log('Filtered activities:', categoryActivities);
                console.log('Filtered qualifications:', categoryQualifications);
                
                // Nur anzeigen, wenn mindestens eine Tätigkeit ODER Qualifikation ausgewählt wurde
                if (categoryActivities.length === 0 && categoryQualifications.length === 0) {
                  return null;
                }
                
                return (
                  <View key={catIdx} style={{
                    backgroundColor: colors.lightGray,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.purple,
                  }}>
                    {/* Category Title */}
                    <View style={{
                      backgroundColor: colors.purple,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      alignSelf: 'flex-start',
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>
                        {category.label}
                      </Text>
                    </View>
                    
                    {/* Activities */}
                    {categoryActivities.length > 0 && (
                      <View style={{ marginBottom: categoryQualifications.length > 0 ? 12 : 0 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          TÄTIGKEITEN:
                        </Text>
                        {categoryActivities.map((activity: string, idx: number) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ color: colors.purple, marginRight: 6, fontSize: 16 }}>✓</Text>
                            <Text style={{ fontSize: 13, color: colors.black }}>
                              {activity}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Qualifications */}
                    {categoryQualifications.length > 0 && (
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 8 }}>
                          QUALIFIKATIONEN:
                        </Text>
                        {categoryQualifications.map((qualification: string, idx: number) => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={{ color: colors.neon, marginRight: 6, fontSize: 16 }}>★</Text>
                            <Text style={{ fontSize: 13, color: colors.black, fontWeight: '600' }}>
                              {qualification}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              });
              })()}
            </View>

            {/* Contact Info */}
            <View style={{ gap: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.neon, letterSpacing: 0.5 }}>
                KONTAKTINFORMATIONEN
              </Text>

              {profile?.contactEmail && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="mail" size={20} color={colors.purple} />
                  <Text style={{ fontSize: 15, color: colors.black }}>{profile.contactEmail}</Text>
                </View>
              )}

              {profile?.contactPhone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="call" size={20} color={colors.purple} />
                  <Text style={{ fontSize: 15, color: colors.black }}>{profile.contactPhone}</Text>
                </View>
              )}

              {profile?.radiusKm && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="location" size={20} color={colors.purple} />
                  <Text style={{ fontSize: 15, color: colors.black }}>
                    Arbeitsradius: {profile.radiusKm} km
                  </Text>
                </View>
              )}
            </View>

            {/* Edit Button */}
            <Pressable
              onPress={() => router.push('/(worker)/edit-profile')}
              style={({ pressed }) => ({
                backgroundColor: colors.neon,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 32,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="create-outline" size={20} color={colors.black} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
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
