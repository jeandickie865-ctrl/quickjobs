// LEGACY BACKUP – DO NOT USE IN PRODUCTION

// app/(employer)/matches.tsx – FINAL iPhone-Version (wie Worker)

import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob, JobApplication } from '../../utils/applicationStore';
import { getWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';
import { getAuthHeaders } from '../../utils/api';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.6; // 60% Breite
const INNER_CARD_PADDING = 18;

// Colors (EXAKT wie Worker)
const COLORS = {
  bgDark: "#141126",
  cardDark: "#141126",
  purple: "#6B4BFF",
  purpleLight: "#7C5CFF",
  textWhite: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.7)",
  accent: "#C8FF16",
  red: "#FF4D4D",
  dim: "rgba(0,0,0,0.6)"
};

type Match = {
  job: Job;
  application: JobApplication;
  workerProfile: WorkerProfile | null;
  avgRating: number;
  reviewCount: number;
};

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workerDataStatus, setWorkerDataStatus] = useState<{[workerId: string]: boolean}>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
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

  const loadUnreadCounts = async (applicationIds: string[]) => {
    const counts: Record<string, number> = {};
    
    for (const appId of applicationIds) {
      try {
        const response = await fetch(`${API_URL}/chat/unread-count/${appId}`, {
          headers: await getAuthHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          counts[appId] = data.unreadCount || 0;
        } else {
          counts[appId] = 0;
        }
      } catch (error) {
        counts[appId] = 0;
      }
    }
    
    setUnreadCounts(counts);
  };

  async function loadMatches(silent = false) {
    if (!user) return;
    
    // Don't show loading spinner on auto-refresh
    if (!silent) {
      setIsLoading(true);
    }
    
    try {
      // Load employer's jobs
      const employerJobs = await getEmployerJobs(user.id);
      
      // Find only PAID applications (echte Matches)
      const allMatches: Match[] = [];
      for (const job of employerJobs) {
        const jobApps = await getApplicationsForJob(job.id);
        // NUR BEZAHLTE Bewerbungen = echte Matches!
        const acceptedApps = jobApps.filter(app => 
          app.status === 'accepted' && app.paymentStatus === 'paid'
        );
        
        for (const app of acceptedApps) {
          // Load worker profile to get contact details
          const workerProfile = await getWorkerProfile(app.workerId);
          // Load worker reviews
          const reviews = await getReviewsForWorker(app.workerId);
          allMatches.push({ 
            job, 
            application: app,
            workerProfile,
            avgRating: calculateAverageRating(reviews),
            reviewCount: reviews.length
          });
        }
      }
      
      // Sort by creation date (newest first)
      allMatches.sort((a, b) => 
        new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
      );
      
      setMatches(allMatches);
      
      // Load worker data status for each match
      const statusMap: {[workerId: string]: boolean} = {};
      for (const match of allMatches) {
        try {
          const res = await fetch(`/api/profiles/worker/${match.application.workerId}/registration-status`);
          const status = await res.json();
          statusMap[match.application.workerId] = status.complete || false;
        } catch (err) {
          console.error(`Failed to check worker status for ${match.application.workerId}:`, err);
          statusMap[match.application.workerId] = false;
        }
      }
      setWorkerDataStatus(statusMap);
      
      // Load unread counts for all matches
      const applicationIds = allMatches.map(m => m.application.id);
      if (applicationIds.length > 0) {
        loadUnreadCounts(applicationIds);
      }
      
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  // Setup auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Load data immediately
      if (user) {
        loadMatches();
      }

      // Start auto-refresh interval (5 seconds)
      intervalRef.current = setInterval(() => {
        if (user) {
          loadMatches(true); // Silent refresh
        }
      }, 5000);

      // Cleanup on unfocus
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [user])
  );

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }


  async function requestOfficialRegistration(applicationId: string) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/applications/${applicationId}/request-official-registration`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        await loadMatches();
      }
    } catch (err) {
      console.error('Request official registration failed:', err);
    }
  }

  async function setInformalRegistration(applicationId: string) {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/applications/${applicationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ registrationType: 'informal' }),
      });
      await loadMatches();
    } catch (err) {
      console.error('Set informal registration failed:', err);
    }
  }

  async function downloadContract(applicationId: string) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/official/create-contract-pdf?application_id=${applicationId}`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        console.log('PDF URL:', data.pdfUrl);
        // TODO: Open PDF viewer with data.pdfUrl
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  }


  if (!user) return null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={{ color: COLORS.textWhite, marginTop: 16, fontSize: 16 }}>
            Lädt Matches...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
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

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
          <Text style={{ 
            fontSize: 26, 
            fontWeight: '900', 
            color: COLORS.white,
            letterSpacing: 0.3,
            textAlign: 'center' 
          }}>
            Meine Matches
          </Text>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 20 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={COLORS.neon} size="large" />
            <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 40,
            alignItems: 'center',
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Ionicons name="people-outline" size={64} color={COLORS.darkGray} />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: COLORS.black, 
              marginTop: 16,
              textAlign: 'center'
            }}>
              Noch keine Matches
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: COLORS.darkGray, 
              marginTop: 8,
              textAlign: 'center'
            }}>
              Sobald du eine Bewerbung akzeptierst, erscheint sie hier.
            </Text>
          </View>
        ) : (
          <>
            {matches.map((match) => (
              <View
                key={`${match.job.id}-${match.application.id}`}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 20,
                  padding: 18,
                  marginBottom: 22,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >

                {/* TOP: Worker Avatar + Name */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#C8FF16",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: "#000" }}>
                      {match.application.workerName?.charAt(0) || "W"}
                    </Text>
                  </View>

                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFF" }}>
                      {match.application.workerName}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#AAA", marginTop: 2 }}>
                      Match seit {formatDate(match.application.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* STATUS BADGE */}
                <View style={{
                  marginTop: 14,
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(200,255,22,0.12)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8
                }}>
                  <Text style={{ color: "#C8FF16", fontWeight: "700", fontSize: 12 }}>
                    BESTÄTIGT
                  </Text>
                </View>

                {/* JOB TITLE */}
                <Text style={{ color: "#FFF", fontSize: 17, marginTop: 14, fontWeight: "700" }}>
                  {match.job.title}
                </Text>
                <Text style={{ color: "#AAA", marginTop: 4 }}>
                  {match.job.category}
                </Text>

                {/* CONTACT BOX (nur bei paid) */}
                {match.workerProfile && match.application.paymentStatus === "paid" && (
                  <View style={{
                    marginTop: 18,
                    backgroundColor: "rgba(200,255,22,0.12)",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#C8FF16",
                  }}>
                    <Text style={{ color: "#C8FF16", fontWeight: "700", marginBottom: 10 }}>
                      KONTAKTDATEN FREIGESCHALTET
                    </Text>

                    {match.workerProfile.email && (
                      <Text style={{ color: "#FFF", marginBottom: 6 }}>
                        📩 {match.workerProfile.email}
                      </Text>
                    )}
                    {match.workerProfile.phone && (
                      <Text style={{ color: "#FFF" }}>
                        📞 {match.workerProfile.phone}
                      </Text>
                    )}
                  </View>
                )}

                {/* BUTTONS (60% BREITE) */}
                <View style={{ marginTop: 22, gap: 14 }}>

                  {/* CHAT */}
                  <Pressable
                    onPress={() => {
                      if (match.application.paymentStatus === "paid") {
                        router.push(`/chat/${match.application.id}`);
                      } else {
                        router.push(`/payment/${match.application.id}`);
                      }
                    }}
                    style={{
                      width: "60%",
                      alignSelf: "center",
                      backgroundColor:
                        match.application.paymentStatus === "paid" ? COLORS.neon : "#555",
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: match.application.paymentStatus === "paid" ? "#000" : "#AAA"
                    }}>
                      {match.application.paymentStatus === "paid"
                        ? "Zum Chat"
                        : "Zahlung abschließen"}
                    </Text>
                  </Pressable>

                  {/* RATE WORKER */}
                  <Pressable
                    onPress={() =>
                      router.push(`/(employer)/jobs/rate?jobId=${match.job.id}&workerId=${match.application.workerId}`)
                    }
                    style={{
                      width: "60%",
                      alignSelf: "center",
                      borderWidth: 2,
                      borderColor: COLORS.purple,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.purple }}>
                      ⭐ Worker bewerten
                    </Text>
                  </Pressable>

                  {/* DOCUMENTS */}
                  {match.application.paymentStatus === "paid" && (
                    <Pressable
                      onPress={() =>
                        router.push(`/(employer)/registration/confirm?applicationId=${match.application.id}&type=kurzfristig`)
                      }
                      style={{
                        width: "60%",
                        alignSelf: "center",
                        borderWidth: 2,
                        borderColor: COLORS.neon,
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 15, color: COLORS.neon, fontWeight: "700" }}>
                        📄 Dokumente erstellen
                      </Text>
                    </Pressable>
                  )}

                  {/* DETAILS */}
                  <Pressable
                    onPress={() => router.push(`/(employer)/jobs/${match.job.id}`)}
                    style={{
                      width: "60%",
                      alignSelf: "center",
                      borderWidth: 2,
                      borderColor: COLORS.neon,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.neon }}>
                      📄 Jobdetails ansehen
                    </Text>
                  </Pressable>
                </View>

              </View>
            ))}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
