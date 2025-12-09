// app/(employer)/matches.tsx – FINAL iPhone-Version (wie Worker)

import React, { useEffect, useState, useRef } from 'react';
import { ArrowDoodle } from '../../components/ArrowDoodle';
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

import { COLORS } from '../../constants/colors';
import { AppHeader } from '../../components/AppHeader';

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

    // OPTIMIZED: Parallel statt sequenziell
    const results = await Promise.all(
      applicationIds.map(async (appId) => {
        try {
          const res = await fetch(`${API_URL}/chat/unread-count/${appId}`, {
            headers: await getAuthHeaders()
          });

          if (res.ok) {
            const json = await res.json();
            return { appId, count: json.unreadCount || 0 };
          } else {
            return { appId, count: 0 };
          }
        } catch {
          return { appId, count: 0 };
        }
      })
    );

    results.forEach(({ appId, count }) => {
      counts[appId] = count;
    });

    setUnreadCounts(counts);
  };

  async function loadMatches(silent = false) {
    if (!user) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      const employerJobs = await getEmployerJobs(user.id);

      // OPTIMIZED: Alle Applications parallel laden
      const jobApplicationsResults = await Promise.all(
        employerJobs.map(async (job) => ({
          job,
          applications: await getApplicationsForJob(job.id)
        }))
      );

      // Filter accepted apps
      const jobsWithAcceptedApps = jobApplicationsResults.map(({ job, applications }) => ({
        job,
        acceptedApps: applications.filter(app =>
          app.status === 'accepted' && app.paymentStatus === 'paid'
        )
      })).filter(item => item.acceptedApps.length > 0);

      // OPTIMIZED: Alle Worker-Profile parallel laden
      const allProfilePromises = jobsWithAcceptedApps.flatMap(({ job, acceptedApps }) =>
        acceptedApps.map(async (app) => ({
          job,
          application: app,
          workerProfile: await getWorkerProfile(app.workerId)
        }))
      );

      const allMatches: Match[] = await Promise.all(allProfilePromises);

      allMatches.sort((a, b) =>
        new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
      );

      setMatches(allMatches);

      // OPTIMIZED: Load worker data status parallel
      const statusResults = await Promise.all(
        allMatches.map(async (match) => {
          try {
            const res = await fetch(`${API_URL}/profiles/worker/${match.application.workerId}/registration-status`);
            const status = await res.json();
            return { workerId: match.application.workerId, complete: status.complete || false };
          } catch {
            return { workerId: match.application.workerId, complete: false };
          }
        })
      );

      const statusMap: {[workerId: string]: boolean} = {};
      statusResults.forEach(({ workerId, complete }) => {
        statusMap[workerId] = complete;
      });
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={{ color: COLORS.text, marginTop: 16, fontSize: 16 }}>
            Lädt Matches...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1 }}>
        <AppHeader 
          title="Matches"
          rightElement={
            <Pressable onPress={() => router.push('/(employer)/profile')}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.accent} />
            </Pressable>
          }
        />

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
                    borderColor: "rgba(255,255,255,0.25)",
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
                        {match.application.workerName && (
                          <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>
                            von {match.application.workerName}
                          </Text>
                        )}
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
                  <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>
                    Match vom {formatDate(match.application.createdAt)}
                  </Text>

                  <Text style={{ color: COLORS.textMuted, marginTop: 4, fontSize: 14 }}>
                    {match.job.category}
                  </Text>

                  {/* Job-Adresse */}
                  {(match.job.street || match.job.city) && (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Ionicons name="location" size={16} color={COLORS.purple} style={{ marginTop: 2, marginRight: 6 }} />
                      <Text style={{ color: COLORS.textWhite, fontSize: 14, flex: 1 }}>
                        {match.job.street} {match.job.houseNumber}, {match.job.postalCode} {match.job.city}
                      </Text>
                    </View>
                  )}

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

                      {/* WORKER NAME - PROMINENT */}
                      {match.workerProfile && (match.workerProfile.firstName || match.workerProfile.lastName) && (
                        <View>
                          <Text style={{ 
                            color: COLORS.textWhite, 
                            fontSize: 18, 
                            fontWeight: "900", 
                            marginBottom: 8 
                          }}>
                            {match.workerProfile.firstName} {match.workerProfile.lastName}
                          </Text>
                          {/* BADGE: Selbstständig/Angestellt */}
                          <View style={{ 
                            backgroundColor: match.workerProfile.isSelfEmployed ? '#EFABFF' : '#FFFFFF',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 6,
                            alignSelf: 'flex-start',
                            marginBottom: 8
                          }}>
                            <Text style={{ 
                              color: COLORS.textWhite, 
                              fontSize: 11, 
                              fontWeight: '700' 
                            }}>
                              {match.workerProfile.isSelfEmployed ? '💼 Selbstständig' : '👤 Angestellt'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {match.workerProfile.email && (
                        <Text style={{ color: COLORS.textWhite, marginBottom: 4, fontSize: 13 }}>
                          📧 {match.workerProfile.email}
                        </Text>
                      )}
                      {match.workerProfile.phone && (
                        <Text style={{ color: COLORS.textWhite, fontSize: 13 }}>
                          📞 {match.workerProfile.phone}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* QUALIFIKATIONSNACHWEISE SECTION */}
                  {match.application.paymentStatus === "paid" && (
                    <>
                      {/* Debug: Zeige immer die Sektion an, auch wenn keine Dokumente da sind */}
                      {match.workerProfile?.documents && match.workerProfile.documents.length > 0 ? (
                        <View
                          style={{
                            marginTop: 14,
                            backgroundColor: "rgba(255,119,61,0.1)",
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "rgba(255,119,61,0.3)",
                          }}
                        >
                          <Text style={{ color: COLORS.orange, fontWeight: "700", marginBottom: 10, fontSize: 14 }}>
                            📄 QUALIFIKATIONSNACHWEISE ({match.workerProfile.documents.length})
                          </Text>
                      
                      {match.workerProfile.documents.map((doc, index) => (
                        <View 
                          key={doc.id || `doc-${index}`}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            padding: 10,
                            borderRadius: 8,
                            marginBottom: 8,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ color: COLORS.textWhite, fontSize: 14, fontWeight: "600" }}>
                              {doc.filename}
                            </Text>
                            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                              {new Date(doc.uploaded_at).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                          
                          <Pressable
                            onPress={() => {
                              // Download document - create blob URL and open
                              const base64Data = doc.data;
                              const mimeType = doc.content_type || 'application/pdf';
                              
                              // For web - create download link
                              if (typeof window !== 'undefined') {
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: mimeType });
                                const url = URL.createObjectURL(blob);
                                
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = doc.filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                              }
                            }}
                            style={{
                              backgroundColor: COLORS.orange,
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: COLORS.textWhite, fontSize: 13, fontWeight: "700" }}>
                              Download
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* BUTTONS SECTION – iPhone-Optimiert */}
                  <View style={{ gap: 14, marginTop: 22, alignItems: "center" }}>
                    {/* CHAT BUTTON */}
                    <Pressable
                      onPress={() => {
                        if (match.application.paymentStatus === "paid") {
                          router.push(`/chat/${match.application.id}`);
                        } else {
                          router.push(`/payment/${match.application.id}`);
                        }
                      }}
                      disabled={match.application.paymentStatus !== "paid"}
                      style={{
                        width: "60%",
                        maxWidth: 300,
                        minWidth: 220,
                        alignSelf: "center",
                        backgroundColor:
                          match.application.paymentStatus === "paid" ? COLORS.purple : "#555",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            match.application.paymentStatus === "paid" ? COLORS.textWhite : "#AAA",
                          fontSize: 16,
                          fontWeight: "700",
                        }}
                      >
                        {match.application.paymentStatus === "paid"
                          ? "Zum Chat"
                          : "Warte auf Zahlung"}
                      </Text>
                    </Pressable>

                    {/* RATE BUTTON */}
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/(employer)/jobs/rate?jobId=${match.job.id}&workerId=${match.application.workerId}`
                        )
                      }
                      style={{
                        width: "60%",
                        maxWidth: 300,
                        minWidth: 220,
                        alignSelf: "center",
                        backgroundColor: "#FF773D",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                        Worker bewerten
                      </Text>
                    </Pressable>

                    {/* SELF-EMPLOYED BADGE */}
                    {match.application.paymentStatus === "paid" && match.workerProfile?.isSelfEmployed && (
                      <View
                        style={{
                          width: "80%",
                          maxWidth: 350,
                          alignSelf: "center",
                          backgroundColor: "rgba(200,255,22,0.1)",
                          borderWidth: 1,
                          borderColor: COLORS.accent,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          alignItems: "center",
                          marginBottom: 12
                        }}
                      >
                        <Text style={{ color: COLORS.accent, fontSize: 14, fontWeight: "600", textAlign: "center" }}>
                          ✓ Selbstständig - keine Anmeldung erforderlich
                        </Text>
                      </View>
                    )}

                    {/* DOCUMENTS BUTTON */}
                    {match.application.paymentStatus === "paid" && !match.workerProfile?.isSelfEmployed && (
                      workerDataStatus[match.application.workerId] ? (
                        
                        // Worker hat Daten → Button aktiv
                        <Pressable
                          onPress={() =>
                            router.push(
                              `/(employer)/registration/confirm?applicationId=${match.application.id}&type=kurzfristig`
                            )
                          }
                          style={{
                            width: "60%",
                            maxWidth: 300,
                            minWidth: 220,
                            alignSelf: "center",
                            backgroundColor: "#FF773D",
                            paddingVertical: 14,
                            borderRadius: 14,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                            Dokumente erstellen
                          </Text>
                        </Pressable>

                      ) : (

                        // Worker-Daten fehlen → Warteanzeige
                        <View
                          style={{
                            width: "60%",
                            maxWidth: 300,
                            minWidth: 220,
                            alignSelf: "center",
                            backgroundColor: "#1A1729",
                            paddingVertical: 14,
                            borderRadius: 14,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.25)",
                            opacity: 0.7,
                          }}
                        >
                          <Text style={{ color: COLORS.textMuted, fontSize: 15, fontWeight: "700" }}>
                            Warten auf Worker-Daten
                          </Text>
                          <Text
                            style={{
                              color: COLORS.textMuted,
                              fontSize: 12,
                              marginTop: 4,
                              textAlign: "center",
                              paddingHorizontal: 16,
                            }}
                          >
                            Worker muss die Daten eingeben, bevor du Dokumente erstellen kannst
                          </Text>
                        </View>

                      )
                    )}

                    {/* DETAILS BUTTON */}
                    <Pressable
                      onPress={() => router.push(`/(employer)/jobs/${match.job.id}`)}
                      style={{
                        width: "60%",
                        maxWidth: 300,
                        minWidth: 220,
                        alignSelf: "center",
                        backgroundColor: "#FF773D",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
                        Jobdetails ansehen
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
