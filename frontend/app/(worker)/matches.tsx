// app/(worker)/matches.tsx – FINAL iPhone-Version

import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Animated,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerApplications } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { euro } from '../../utils/pricing';
import { formatJobTimeDisplay } from '../../utils/date';
import { isWithinLast24Hours } from '../../utils/stringHelpers';
import { getInitials } from '../../utils/stringHelpers';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';
import { getAuthHeaders } from '../../utils/api';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.86; // iPhone-friendly
const INNER_CARD_PADDING = 18;

// Colors
const COLORS = {
  bgDark: "#141126",
  cardDark: "#141126",
  purple: "#6B4BFF",
  purpleLight: "#7C5CFF",
  textWhite: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.75)",
  accent: "#C8FF16",
  red: "#FF4D4D",
  dim: "rgba(0,0,0,0.6)"
};

type Match = {
  job: Job;
  application: JobApplication;
};

export default function WorkerMatchesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch unread counts
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

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

  // Load matches
  const loadMatches = async (silent = false) => {
    if (!user) return;

    if (!silent) setLoading(true);

    try {
      const apps = await getWorkerApplications();

      const accepted = apps.filter(a => a.status === "accepted");

      // Performance: Alle Jobs parallel laden
      const jobs = await Promise.all(
        accepted.map(a => getJobById(a.jobId).catch(() => null))
      );

      const combined: Match[] = accepted
        .map((a, index) => ({ job: jobs[index], application: a }))
        .filter(match => match.job !== null) as Match[];

      combined.sort((a, b) => {
        const da = a.application.respondedAt || a.application.createdAt;
        const db = b.application.respondedAt || b.application.createdAt;
        return new Date(db).getTime() - new Date(da).getTime();
      });

      setMatches(combined);

      const ids = combined.map(m => m.application.id);
      if (ids.length) loadUnreadCounts(ids);

    } catch (error) {
      console.error('Error loading matches:', error);
      if (!silent) setError("Matches konnten nicht geladen werden. Bitte versuche es erneut.");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) loadMatches();

      // RACE-CONDITION GUARD: Prüfen ob bereits Interval läuft
      if (intervalRef.current) return;

      intervalRef.current = setInterval(() => {
        if (!authLoading && user) loadMatches(true);
      }, 15000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      };
    }, [user, authLoading])
  );

  // Registration check
  useEffect(() => {
    const check = async () => {
      if (!user || matches.length === 0) return;

      const hasAccepted = matches.find(m => m.application.status === "accepted");
      if (!hasAccepted) return;

      try {
        const profileRes = await fetch(`/api/profiles/worker/${user.userId}`, {
          headers: await getAuthHeaders()
        });

        const p = await profileRes.json();

        if (!p.isSelfEmployed) {
          const regRes = await fetch(`/api/profiles/worker/${user.userId}/registration-status`);
          const reg = await regRes.json();

          if (!reg.complete) router.replace("/(worker)/registration-data");
        }
      } catch (error) {
        console.error('Registration check error:', error);
      }
    };

    check();
  }, [matches, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleDeleteMatch = async () => {
    if (!applicationToDelete) return;
    try {
      const res = await fetch(`${API_URL}/applications/${applicationToDelete}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
      });

      if (res.ok) {
        setDeleteModalVisible(false);
        setApplicationToDelete(null);
        loadMatches();
      } else {
        alert("Fehler beim Löschen des Matches. Bitte versuche es erneut.");
      }
    } catch (error) {
      console.error('Delete match error:', error);
      alert("Fehler beim Löschen des Matches. Bitte versuche es erneut.");
    }
  };

  if (authLoading) return null;
  if (!user || user.role !== "worker") return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <SafeAreaView edges={['top']} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
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
              fontWeight: "800",
              color: COLORS.textWhite,
            }}
          >
            Meine Matches
          </Text>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <Pressable onPress={() => setShowTaxModal(true)}>
              <Ionicons name="information-circle-outline" size={28} color={COLORS.purple} />
            </Pressable>

            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.purple} />
            </Pressable>
          </View>
        </View>

        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.purple}
            />
          }
        >
          {error && (
            <View
              style={{
                padding: 16,
                backgroundColor: "#2A1F2E",
                borderRadius: 12,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.red,
              }}
            >
              <Text style={{ color: COLORS.red, fontSize: 14, fontWeight: "700" }}>
                {error}
              </Text>
            </View>
          )}

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
                Bewirb dich auf Jobs, um deine Matches hier zu sehen.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 20 }}>
              {matches.map(({ job, application }) => {
                const timeDisplay = formatJobTimeDisplay(
                  job.startAt,
                  job.endAt,
                  job.timeMode,
                  job.hours,
                  job.dueAt
                );

                const employerName = job.employerName || "Auftraggeber";

                return (
                  <View
                    key={application.id}
                    style={{
                      backgroundColor: COLORS.cardDark,
                      borderRadius: 18,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                      shadowColor: COLORS.purple,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                    }}
                  >
                    {/* Card Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
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
                          <Text
                            style={{
                              color: COLORS.textWhite,
                              fontSize: 18,
                              fontWeight: "700",
                            }}
                          >
                            {getInitials(employerName)}
                          </Text>
                        </View>

                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text
                            style={{
                              color: COLORS.textWhite,
                              fontSize: 17,
                              fontWeight: "700",
                            }}
                          >
                            {job.title}
                          </Text>
                          <Text
                            style={{
                              color: COLORS.textMuted,
                              fontSize: 13,
                              marginTop: 2,
                            }}
                          >
                            von {employerName}
                          </Text>
                          {/* BADGE: Privatperson/Unternehmen */}
                          <View style={{ 
                            backgroundColor: job.employerType === 'business' ? '#7C5CFF' : '#1C1838',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 5,
                            alignSelf: 'flex-start',
                            marginTop: 6
                          }}>
                            <Text style={{ 
                              color: COLORS.textWhite, 
                              fontSize: 10, 
                              fontWeight: '700' 
                            }}>
                              {job.employerType === 'business' ? '🏢 Unternehmen' : '👤 Privatperson'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Delete icon */}
                      <Pressable
                        onPress={() => {
                          setApplicationToDelete(application.id);
                          setDeleteModalVisible(true);
                        }}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="trash-outline" size={22} color={COLORS.textMuted} />
                      </Pressable>
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
                      <Text
                        style={{
                          color: COLORS.purpleLight,
                          fontSize: 13,
                          fontWeight: "700",
                        }}
                      >
                        akzeptiert
                      </Text>
                    </View>

                    {/* Info */}
                    <Text style={{ color: COLORS.textWhite, marginTop: 12, fontSize: 14 }}>
                      {timeDisplay}
                    </Text>

                    <Text
                      style={{
                        color: COLORS.textMuted,
                        marginTop: 4,
                        fontSize: 14,
                      }}
                    >
                      {job.address?.street} {job.address?.house_number},{" "}
                      {job.address?.postal_code} {job.address?.city}
                    </Text>

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "900",
                        color: COLORS.textWhite,
                        marginTop: 14,
                      }}
                    >
                      {euro(job.workerAmountCents)} /{" "}
                      {job.timeMode === "hours" ? "Stunde" : "Gesamt"}
                    </Text>

                    {/* BUTTONS SECTION – iPhone-Optimiert */}
                    <View style={{ gap: 14, marginTop: 22, alignItems: "center" }}>
                      
                      {/* CHAT BUTTON */}
                      <Pressable
                        onPress={() => {
                          if (application.paymentStatus === "paid") {
                            router.push(`/chat/${application.id}`);
                          }
                        }}
                        disabled={application.paymentStatus !== "paid"}
                        style={{
                          width: "70%",
                          maxWidth: 340,
                          minWidth: 240,
                          alignSelf: "center",
                          backgroundColor:
                            application.paymentStatus === "paid"
                              ? COLORS.purple
                              : "#3A3A3A",
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              application.paymentStatus === "paid"
                                ? COLORS.textWhite
                                : "rgba(255,255,255,0.4)",
                            fontSize: 16,
                            fontWeight: "700",
                          }}
                        >
                          {application.paymentStatus === "paid"
                            ? "Zum Chat"
                            : "Warte auf Zahlung"}
                        </Text>
                      </Pressable>

                      {/* RATE BUTTON */}
                      <Pressable
                        onPress={() =>
                          router.push(`/(worker)/rate?jobId=${job.id}&employerId=${job.employerId}`)
                        }
                        style={{
                          width: "70%",
                          maxWidth: 340,
                          minWidth: 240,
                          alignSelf: "center",
                          backgroundColor: COLORS.purpleLight,
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: COLORS.textWhite,
                            fontSize: 15,
                            fontWeight: "700",
                          }}
                        >
                          Arbeitgeber bewerten
                        </Text>
                      </Pressable>

                      {/* DETAILS BUTTON */}
                      <Pressable
                        onPress={() => router.push(`/(worker)/alljobs/${job.id}`)}
                        style={{
                          width: "70%",
                          maxWidth: 340,
                          minWidth: 240,
                          alignSelf: "center",
                          backgroundColor: COLORS.purpleLight,
                          paddingVertical: 14,
                          borderRadius: 14,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: COLORS.textWhite,
                            fontSize: 15,
                            fontWeight: "700",
                          }}
                        >
                          Jobdetails ansehen
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.ScrollView>

        {/* TAX MODAL */}
        <Modal
          visible={showTaxModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTaxModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.cardDark,
                borderRadius: 20,
                padding: 24,
                width: "90%",
                maxWidth: 420,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {/* HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                  paddingBottom: 14,
                  borderBottomWidth: 2,
                  borderBottomColor: COLORS.purple,
                }}
              >
                <Ionicons name="information-circle" size={32} color={COLORS.purple} />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: COLORS.textWhite,
                    marginLeft: 12,
                  }}
                >
                  Wichtiger Hinweis
                </Text>
              </View>

              {/* CONTENT */}
              <View style={{ gap: 14 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textWhite,
                    lineHeight: 22,
                  }}
                >
                  Die Bezahlung erfolgt direkt zwischen dir und dem Auftraggeber.
                </Text>

                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textWhite,
                    lineHeight: 22,
                  }}
                >
                  Du bist verantwortlich für deine eigenen Steuern und
                  Versicherungen.
                </Text>

                <View
                  style={{
                    padding: 12,
                    backgroundColor: "rgba(124,92,255,0.16)",
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textWhite,
                      fontWeight: "600",
                    }}
                  >
                    Bei Fragen wende dich an einen Steuerberater.
                  </Text>
                </View>
              </View>

              {/* CLOSE BUTTON */}
              <Pressable
                onPress={() => setShowTaxModal(false)}
                style={{
                  marginTop: 24,
                  backgroundColor: COLORS.purple,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  width: "60%",
                  alignSelf: "center",
                }}
              >
                <Text
                  style={{
                    color: COLORS.textWhite,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Verstanden
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* DELETE CONFIRM MODAL */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setDeleteModalVisible(false);
            setApplicationToDelete(null);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.cardDark,
                borderRadius: 20,
                padding: 24,
                width: "90%",
                maxWidth: 420,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              {/* HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                  paddingBottom: 14,
                  borderBottomWidth: 2,
                  borderBottomColor: COLORS.red,
                }}
              >
                <Ionicons name="trash" size={32} color={COLORS.red} />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: COLORS.textWhite,
                    marginLeft: 12,
                  }}
                >
                  Match löschen?
                </Text>
              </View>

              {/* CONTENT */}
              <Text
                style={{
                  fontSize: 15,
                  color: COLORS.textMuted,
                  marginBottom: 24,
                  lineHeight: 22,
                }}
              >
                Möchtest du diesen Match wirklich löschen? Dieser Schritt kann nicht
                rückgängig gemacht werden.
              </Text>

              {/* ACTION BUTTONS */}
              <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
                {/* CANCEL */}
                <Pressable
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setApplicationToDelete(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#444",
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.textWhite,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Abbrechen
                  </Text>
                </Pressable>

                {/* DELETE */}
                <Pressable
                  onPress={handleDeleteMatch}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.red,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.textWhite,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Löschen
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
