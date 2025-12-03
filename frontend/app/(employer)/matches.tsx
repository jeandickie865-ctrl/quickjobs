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
const INNER_CARD_PADDING = 18;

// Colors (EXAKT wie Worker)
const COLORS = {
  bgDark: "#0E0B1F",
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
};

export default function EmployerMatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [workerDataStatus, setWorkerDataStatus] = useState<{[workerId: string]: boolean}>({});

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUnreadCounts = async (applicationIds: string[]) => {
    const counts: Record<string, number> = {};

    for (const appId of applicationIds) {
      try {
        const res = await fetch(`${API_URL}/chat/unread-count/${appId}`, {
          headers: await getAuthHeaders()
        });

        if (res.ok) {
          const json = await res.json();
          counts[appId] = json.unreadCount || 0;
        } else {
          counts[appId] = 0;
        }
      } catch {
        counts[appId] = 0;
      }
    }

    setUnreadCounts(counts);
  };

  async function loadMatches(silent = false) {
    if (!user) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      const employerJobs = await getEmployerJobs(user.id);
      const allMatches: Match[] = [];

      for (const job of employerJobs) {
        const jobApps = await getApplicationsForJob(job.id);
        const acceptedApps = jobApps.filter(app =>
          app.status === 'accepted' && app.paymentStatus === 'paid'
        );

        for (const app of acceptedApps) {
          const workerProfile = await getWorkerProfile(app.workerId);
          allMatches.push({
            job,
            application: app,
            workerProfile
          });
        }
      }

      allMatches.sort((a, b) =>
        new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
      );

      setMatches(allMatches);

      // Load worker data status
      const statusMap: {[workerId: string]: boolean} = {};
      for (const match of allMatches) {
        try {
          const res = await fetch(`${API_URL}/profiles/worker/${match.application.workerId}/registration-status`);
          const status = await res.json();
          statusMap[match.application.workerId] = status.complete || false;
        } catch {
          statusMap[match.application.workerId] = false;
        }
      }
      setWorkerDataStatus(statusMap);

      // Load unread counts
      const applicationIds = allMatches.map(m => m.application.id);
      if (applicationIds.length > 0) {
        loadUnreadCounts(applicationIds);
      }

    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadMatches();
      }
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches(true);
  };

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (!user) return null;

  if (loading) {
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
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 18,
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: COLORS.textWhite,
              letterSpacing: 0.3,
            }}
          >
            Meine Matches
          </Text>

          <Pressable onPress={() => router.push('/(employer)/profile')}>
            <Ionicons name="person-circle-outline" size={28} color={COLORS.purple} />
          </Pressable>
        </View>

        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.purple}
            />
          }
        >
          {matches.length === 0 ? (
            <View
              style={{
                padding: 32,
                backgroundColor: COLORS.cardDark,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: COLORS.textWhite,
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Noch keine Matches
              </Text>

              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                Sobald du eine Bewerbung akzeptierst, erscheint sie hier.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {matches.map((match) => (
                <View
                  key={`${match.job.id}-${match.application.id}`}
                  style={{
                    backgroundColor: COLORS.cardDark,
                    borderRadius: 18,
                    padding: INNER_CARD_PADDING,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Card Header */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 23,
                          backgroundColor: COLORS.purple,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: COLORS.textWhite, fontSize: 18, fontWeight: "700" }}>
                          {match.application.workerName?.charAt(0) || "W"}
                        </Text>
                      </View>

                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: COLORS.textWhite, fontSize: 17, fontWeight: "700" }}>
                          {match.job.title}
                        </Text>
                        <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>
                          von {match.application.workerName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status */}
                  <View
                    style={{
                      marginTop: 12,
                      alignSelf: "flex-start",
                      backgroundColor: "rgba(123,92,255,0.18)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: COLORS.purpleLight, fontSize: 13, fontWeight: "700" }}>
                      akzeptiert
                    </Text>
                  </View>

                  {/* Info */}
                  <Text style={{ color: COLORS.textWhite, marginTop: 12, fontSize: 14 }}>
                    Match seit {formatDate(match.application.createdAt)}
                  </Text>

                  <Text style={{ color: COLORS.textMuted, marginTop: 4, fontSize: 14 }}>
                    {match.job.category}
                  </Text>

                  {/* CONTACT BOX (nur bei paid) */}
                  {match.workerProfile && match.application.paymentStatus === "paid" && (
                    <View
                      style={{
                        marginTop: 14,
                        backgroundColor: "rgba(123,92,255,0.1)",
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "rgba(123,92,255,0.3)",
                      }}
                    >
                      <Text style={{ color: COLORS.purpleLight, fontWeight: "700", marginBottom: 8, fontSize: 13 }}>
                        🔓 KONTAKTDATEN
                      </Text>

                      {match.workerProfile.email && (
                        <Text style={{ color: COLORS.textWhite, marginBottom: 4, fontSize: 13 }}>
                          {match.workerProfile.email}
                        </Text>
                      )}
                      {match.workerProfile.phone && (
                        <Text style={{ color: COLORS.textWhite, fontSize: 13 }}>
                          {match.workerProfile.phone}
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
                          match.application.paymentStatus === "paid" ? COLORS.accent : "#555",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: match.application.paymentStatus === "paid" ? "#000" : "#AAA",
                        }}
                      >
                        {match.application.paymentStatus === "paid" ? "💬 Zum Chat" : "Zahlung abschließen"}
                      </Text>
                    </Pressable>

                    {/* RATE WORKER */}
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/(employer)/jobs/rate?jobId=${match.job.id}&workerId=${match.application.workerId}`
                        )
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
                    {match.application.paymentStatus === "paid" && !match.workerProfile?.isSelfEmployed && (
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/(employer)/registration/confirm?applicationId=${match.application.id}&type=kurzfristig`
                          )
                        }
                        style={{
                          width: "60%",
                          alignSelf: "center",
                          borderWidth: 2,
                          borderColor: COLORS.accent,
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 15, color: COLORS.accent, fontWeight: "700" }}>
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
                        borderColor: COLORS.accent,
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.accent }}>
                        📋 Jobdetails ansehen
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}
