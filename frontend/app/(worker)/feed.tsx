import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { getMatchedJobs } from "../../utils/jobStore";
import { useAuth } from "../../contexts/AuthContext";
import { getTagLabel } from "../../utils/taxonomy";
import { getWorkerProfile } from "../../utils/profileStore";
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
  tagRequired: '#FFF4ED',  // Helles Orange für erforderliche Tags
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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textMuted, marginTop: 16, fontSize: 14 }}>Jobs werden geladen...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <AppHeader 
          title="Passende Jobs"
          rightElement={
            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.accent} />
            </Pressable>
          }
        />

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
            <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
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
        <AppHeader 
          title="Passende Jobs"
          rightElement={
            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.accent} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center'
          }}>
            <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} style={{ marginBottom: 16 }} />
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
              Keine passenden Jobs
            </Text>
            {profile && (!profile.category || !profile.radius) ? (
              <Pressable onPress={() => router.push('/(worker)/edit-profile')}>
                <Text style={{ color: COLORS.accent, fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' }}>
                  Vervollständige dein Profil (Kategorie & Radius), um Jobs zu sehen!
                </Text>
              </Pressable>
            ) : (
              <Text style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center' }}>
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
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
          {item.title}
        </Text>

        {/* BADGES ROW */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* KATEGORIE BADGE */}
          <View style={{
            backgroundColor: COLORS.accent,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
          }}>
            <Text style={{ color: COLORS.bg, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>
              {item.category}
            </Text>
          </View>
          
          {/* EMPLOYER TYPE BADGE */}
          <View style={{
            backgroundColor: item.employerType === 'business' ? '#EFABFF' : '#FFFFFF',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
          }}>
            <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 12 }}>
              {item.employerType === 'business' ? '🏢 Unternehmen' : '👤 Privatperson'}
            </Text>
          </View>
        </View>

        {/* BESCHREIBUNG */}
        {item.description && (
          <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ color: COLORS.textMuted, flex: 1, fontSize: 14, lineHeight: 20 }}>
              {item.description}
            </Text>
          </View>
        )}

        {/* ADRESSE */}
        <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
          <Ionicons name="location-outline" size={20} color={COLORS.accent} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: COLORS.textMuted, flex: 1, fontSize: 14 }}>
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
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.accent, marginBottom: 4 }}>
              {(item.workerAmountCents / 100).toFixed(2)} €
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
              Brutto = Netto
            </Text>
            {!profile?.isSelfEmployed && (
              <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
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
                <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                        borderColor: COLORS.accent
                      }}
                    >
                      <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '600' }}>
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
                <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                      <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>
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
          onPress={() => router.push(`/alljobs/${item.id}`)}
          style={({ pressed }) => ({
            backgroundColor: COLORS.secondary,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            paddingHorizontal: 24,
            alignSelf: 'center',
            opacity: pressed ? 0.9 : 1
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
            Job ansehen
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <AppHeader />

      {/* SUBTITLE */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16, marginTop: 8 }}>
        <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700' }}>
          Passende Jobs
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
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
