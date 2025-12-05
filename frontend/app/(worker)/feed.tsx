import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getMatchedJobs } from "../../utils/jobStore";
import { useAuth } from "../../contexts/AuthContext";
import { getTagLabel } from "../../utils/taxonomy";
import { getWorkerProfile } from "../../utils/profileStore";

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  border: 'rgba(255,255,255,0.06)',
  error: '#FF4D4D',
  tagRequired: '#5941FF',
  tagOptional: '#3A3A3A'
};

export default function WorkerFeedScreen() {
  const { user, token, loading, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpcomingJob = (job) => {
    if (!job.date || !job.startAt || !job.endAt) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    const jobDate = new Date(job.date);
    if (isNaN(jobDate)) return false;

    if (jobDate < today) return false;

    if (jobDate.getTime() === today.getTime()) {
      const now = new Date();
      const [endH, endM] = job.endAt.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);
      if (endTime < now) return false;
    }

    if (job.status !== 'open') return false;

    return true;
  };

  const hideMatchedJobs = (job) => {
    if (job.status === "matched" || job.status === "done" || job.status === "cancelled") {
      return false;
    }

    if (job.matchedApplication || job.matchedWorkerId || job.chosenApplicationId) {
      return false;
    }

    return true;
  };

  const loadJobs = async () => {
    if (!token || !user) {
      console.log("⏳ Waiting for auth to load...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📋 Loading matched jobs...");
      const data = await getMatchedJobs();
      console.log("✅ Matched jobs loaded:", data.length);
      
      let filtered = data.filter(isUpcomingJob);
      filtered = filtered.filter(hideMatchedJobs);
      setJobs(filtered);
    } catch (err: any) {
      console.error("❌ Error loading jobs:", err);
      if (err.message === "UNAUTHORIZED" || err.message?.includes("no token found")) {
        setIsLoading(false);
        signOut();
        return;
      }
      if (err.message?.includes("FAILED_TO_FETCH_MATCHED_JOBS")) {
        setError("Du musst zuerst dein Profil vervollständigen, um passende Jobs zu sehen. Bitte gehe zum Profil-Tab.");
        setIsLoading(false);
        return;
      }
      setError(`Fehler beim Laden der Jobs: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await getWorkerProfile();
      setProfile(data);
    } catch (err) {
      console.log('Profile load error:', err);
    }
  };

  useEffect(() => {
    if (!loading && token && user) {
      loadJobs();
      loadProfile();
    }
  }, [loading, token, user]);

  useFocusEffect(
    React.useCallback(() => {
      if (!loading && token && user) {
        const timer = setTimeout(() => {
          console.log("🔄 Feed screen focused - reloading jobs after delay");
          loadJobs();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [loading, token, user])
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.muted, marginTop: 16, fontSize: 14 }}>Jobs werden geladen...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* HEADER */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 28, letterSpacing: 1 }}>
            BACKUP
          </Text>
          <View style={{ marginTop: 8, height: 4, width: '100%', backgroundColor: COLORS.neon }} />
        </View>

        <View style={{ paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center'
          }}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} style={{ marginBottom: 16 }} />
            <Text style={{ color: COLORS.white, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
              {error}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (jobs.length === 0) {
    return (
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* HEADER */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 28, letterSpacing: 1 }}>
            BACKUP
          </Text>
          <View style={{ marginTop: 8, height: 4, width: '100%', backgroundColor: COLORS.neon }} />
        </View>

        <View style={{ paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center'
          }}>
            <Ionicons name="briefcase-outline" size={48} color={COLORS.muted} style={{ marginBottom: 16 }} />
            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
              Keine passenden Jobs
            </Text>
            {profile && (!profile.category || !profile.radius) ? (
              <Pressable onPress={() => router.push('/(worker)/edit-profile')}>
                <Text style={{ color: COLORS.neon, fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' }}>
                  Vervollständige dein Profil (Kategorie & Radius), um Jobs zu sehen!
                </Text>
              </Pressable>
            ) : (
              <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center' }}>
                Aktuell gibt es keine Jobs, die zu deinem Profil passen.{'\n'}Schau später nochmal vorbei!
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderJobCard = ({ item }) => (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      <View style={{
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border
      }}>
        {/* TITEL */}
        <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
          {item.title}
        </Text>

        {/* KATEGORIE BADGE */}
        <View style={{
          backgroundColor: COLORS.neon,
          alignSelf: 'flex-start',
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          <Text style={{ color: COLORS.bg, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
            {item.category}
          </Text>
        </View>

        {/* BESCHREIBUNG */}
        {item.description && (
          <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.neon} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ color: COLORS.muted, flex: 1, fontSize: 14, lineHeight: 20 }}>
              {item.description}
            </Text>
          </View>
        )}

        {/* ADRESSE */}
        <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
          <Ionicons name="location-outline" size={20} color={COLORS.neon} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: COLORS.muted, flex: 1, fontSize: 14 }}>
            {item.address?.street} {item.address?.houseNumber}, {item.address?.postalCode} {item.address?.city}
          </Text>
        </View>

        {/* VERGÜTUNG */}
        {item.workerAmountCents && (
          <View style={{
            marginTop: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: COLORS.border
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.neon, marginBottom: 4 }}>
              {(item.workerAmountCents / 100).toFixed(2)} €
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.muted }}>
              Brutto = Netto
            </Text>
            {!profile?.isSelfEmployed && (
              <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                § 40a EStG – keine Abzüge
              </Text>
            )}
          </View>
        )}

        {/* TAGS */}
        {(item.required_all_tags?.length > 0 || item.required_any_tags?.length > 0) && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            {/* Pflicht-Tags */}
            {item.required_all_tags?.length > 0 && (
              <View style={{ marginBottom: item.required_any_tags?.length > 0 ? 12 : 0 }}>
                <Text style={{ color: COLORS.neon, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Erforderlich
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {item.required_all_tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: COLORS.tagRequired,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: COLORS.neon
                      }}
                    >
                      <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
                        {getTagLabel(item.category, tag)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Optional-Tags */}
            {item.required_any_tags?.length > 0 && (
              <View>
                <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Mindestens eine
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {item.required_any_tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: COLORS.tagOptional,
                        borderRadius: 8
                      }}
                    >
                      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600' }}>
                        {getTagLabel(item.category, tag)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* BUTTON */}
        <Pressable
          onPress={() => router.push(`/jobs/${item.id}`)}
          style={({ pressed }) => ({
            backgroundColor: COLORS.purple,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            width: '60%',
            maxWidth: 250,
            alignSelf: 'center',
            opacity: pressed ? 0.9 : 1
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
            Job ansehen
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ color: COLORS.white, fontWeight: '900', fontSize: 28, letterSpacing: 1 }}>
          BACKUP
        </Text>
        <View style={{ marginTop: 8, height: 4, width: '100%', backgroundColor: COLORS.neon }} />
      </View>

      {/* SUBTITLE */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>
          Passende Jobs
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 4 }}>
          {jobs.length} {jobs.length === 1 ? 'Job gefunden' : 'Jobs gefunden'}
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
