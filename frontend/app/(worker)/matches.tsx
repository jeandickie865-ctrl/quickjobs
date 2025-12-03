// app/(worker)/matches.tsx - FINAL NEON-TECH DESIGN WITH AUTO-REFRESH
import React, { useEffect, useState, useRef } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl, Pressable, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerApplications } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';
import { isWithinLast24Hours } from '../../utils/stringHelpers';
import { getInitials } from '../../utils/stringHelpers';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config';
import { getAuthHeaders } from '../../utils/api';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkBg: '#0E0C1F',               // Neuer Dark Background
  cardBg: 'rgba(255,255,255,0.04)', // Soft Glass Card
  cardBorder: 'rgba(255,255,255,0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: '#BBBBBB',
  accent: '#C8FF16',
  softDot: 'rgba(255,255,255,0.03)',
  dimmed: 'rgba(0,0,0,0.7)',
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
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
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

  const loadMatches = async (silent = false) => {
    if (!user) return;

    // Don't show loading spinner on auto-refresh
    if (!silent) {
      setLoading(true);
    }

    try {
      setError(null);

      console.log('🔍 loadMatches: Fetching applications for user', user.id);
      const apps = await getWorkerApplications();
      console.log('📋 loadMatches: Total applications found:', apps.length);
      console.log('📋 loadMatches: All applications:', apps.map(a => ({ id: a.id, status: a.status, jobId: a.jobId })));
      
      // WICHTIG: Nur akzeptierte Applications (fertige Matches) zeigen!
      const relevantApps = apps.filter((a) => 
        a.status === 'accepted'
      );
      console.log('✅ loadMatches: Accepted applications:', relevantApps.length);
      console.log('✅ loadMatches: Accepted app details:', relevantApps.map(a => ({ id: a.id, jobId: a.jobId })));
      
      // Jobs einzeln per ID laden – sicherste Variante
      const combined: Match[] = [];

      for (const app of relevantApps) {
        try {
          console.log(`🔎 loadMatches: Loading job ${app.jobId} for application ${app.id}`);
          const job = await getJobById(app.jobId);
          console.log(`✅ loadMatches: Job loaded: ${job.title}`);
          combined.push({ job, application: app });
        } catch (err) {
          console.error(
            `❌ loadMatches: Job ${app.jobId} konnte nicht geladen werden`,
            err
          );
        }
      }
      
      console.log('🎯 loadMatches: Final combined matches:', combined.length);

      combined.sort((a, b) => {
        const dateA = a.application.respondedAt || a.application.createdAt;
        const dateB = b.application.respondedAt || b.application.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setMatches(combined);
      
      // Load unread counts for all matches
      const applicationIds = combined.map(m => m.application.id);
      if (applicationIds.length > 0) {
        loadUnreadCounts(applicationIds);
      }
    } catch (e) {
      console.error('Error loading matches:', e);
      if (!silent) {
        setError('Matches konnten nicht geladen werden.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  // Setup auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Load data immediately
      if (!authLoading && user) {
        loadMatches();
      }

      // Start auto-refresh interval (5 seconds)
      intervalRef.current = setInterval(() => {
        if (!authLoading && user) {
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
    }, [user, authLoading])
  );

  // Check registration status when matches are loaded
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!user || matches.length === 0) return;

      // Find any accepted match
      const realMatch = matches.find(m => m.application.status === 'accepted');
      
      if (!realMatch) return;

      // Check if worker has completed registration data (nur für NICHT-selbstständige)
      try {
        // Zuerst Worker-Profil laden um isSelfEmployed zu prüfen
        const profileResponse = await fetch(`/api/profiles/worker/${user.userId}`, {
          headers: await getAuthHeaders()
        });
        const profileData = await profileResponse.json();
        
        // Nur prüfen wenn NICHT selbstständig
        if (!profileData.isSelfEmployed) {
          const response = await fetch(`/api/profiles/worker/${user.userId}/registration-status`);
          const data = await response.json();
          
          if (data.complete === false) {
            console.log('Worker registration incomplete, redirecting...');
            router.replace('/(worker)/registration-data');
          }
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
      }
    };

    checkRegistrationStatus();
  }, [matches, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleDeleteMatch = async () => {
    if (!applicationToDelete) return;
    
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/applications/${applicationToDelete}`, {
        method: 'DELETE',
        headers,
      });
      
      if (res.ok) {
        setDeleteModalVisible(false);
        setApplicationToDelete(null);
        loadMatches();
      } else {
        console.error('Delete failed:', res.status);
        alert('Fehler beim Löschen des Matches');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Fehler beim Löschen des Matches');
    }
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Matches...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.darkBg }}>
      {/* Soft Dot Wave Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 350,
        opacity: 0.22,
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={{
            position: 'absolute',
            top: i * 40,
            left: -100 + i * 20,
            width: 600,
            height: 40,
            backgroundColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: COLORS.softDot,
            opacity: 0.4,
          }} />
        ))}
      </View>

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 22,
          paddingVertical: 18,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '800',
            color: COLORS.white,
            letterSpacing: 0.5,
          }}>
            Meine Matches
          </Text>

          <View style={{ flexDirection: 'row', gap: 18 }}>
            <Pressable onPress={() => setShowTaxModal(true)}>
              <Ionicons name="information-circle-outline" size={26} color={COLORS.accent} />
            </Pressable>

            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.white} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.neon} />
        }
      >
        {error && (
          <View style={{
            padding: 16,
            backgroundColor: '#FBECEC',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#E34242',
          }}>
            <Text style={{ color: '#E34242', fontSize: 14, fontWeight: '600' }}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {matches.length === 0 ? (
          <View style={{
            padding: 32,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
              Noch keine Matches
            </Text>
            <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
              Bewirb dich auf Jobs, um deine Matches hier zu sehen!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {matches.map(({ job, application }) => {
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );
              const isNew = application.respondedAt && isWithinLast24Hours(application.respondedAt);
              const employerName = job.employerName || 'Auftraggeber';
              const employerInitials = getInitials(employerName);

              return (
                <View
                  key={application.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: 20,
                    padding: 18,
                    marginBottom: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.06)",
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 }
                  }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        backgroundColor: "#5941FF",
                        justifyContent: "center",
                        alignItems: "center"
                      }}>
                        <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 18 }}>
                          {employerInitials}
                        </Text>
                      </View>

                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFF" }}>
                          {job.title}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#AAA" }}>
                          von {employerName}
                        </Text>
                      </View>
                    </View>

                    {/* Delete */}
                    <Pressable 
                      onPress={() => {
                        setApplicationToDelete(application.id);
                        setDeleteModalVisible(true);
                      }} 
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="trash-outline" size={22} color="#777" />
                    </Pressable>
                  </View>

                  {/* Status */}
                  <View style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(200,255,22,0.12)",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8
                  }}>
                    <Text style={{ color: "#C8FF16", fontWeight: "600", fontSize: 13 }}>
                      {application.status === 'accepted' ? 'akzeptiert' : application.status}
                    </Text>
                  </View>

                  {/* Infos */}
                  <Text style={{ color: "#DDD", marginTop: 12 }}>
                    {timeDisplay}
                  </Text>

                  <Text style={{ color: "#BBB", marginTop: 4 }}>
                    {job.address?.street} {job.address?.house_number}, {job.address?.postal_code} {job.address?.city}
                  </Text>

                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFF", marginTop: 14 }}>
                    {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                  </Text>

                  {/* Buttons */}
                  <View style={{ gap: 12, marginTop: 18 }}>
                    {/* Chat */}
                    <Pressable
                      onPress={() => {
                        if (application.paymentStatus === "paid") {
                          router.push(`/chat/${application.id}`);
                        }
                      }}
                      disabled={application.paymentStatus !== "paid"}
                      style={{
                        backgroundColor: application.paymentStatus === "paid" ? "#C8FF16" : "#555",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "700", color: application.paymentStatus === "paid" ? "#000" : "#AAA" }}>
                        {application.paymentStatus === "paid" ? "💬 Zum Chat" : "🔒 Warte auf Zahlung"}
                      </Text>
                    </Pressable>

                    {/* Arbeitgeber bewerten */}
                    <Pressable
                      onPress={() => {
                        console.log('🎯 Worker: Navigate to rate - jobId:', job.id, 'employerId:', job.employerId);
                        router.push(`/(worker)/rate?jobId=${job.id}&employerId=${job.employerId}`);
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: "#5941FF",
                        paddingVertical: 12,
                        borderRadius: 14,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#5941FF" }}>
                        ⭐ Arbeitgeber bewerten
                      </Text>
                    </Pressable>

                    {/* Details */}
                    <Pressable
                      onPress={() => router.push(`/(worker)/jobs/${job.id}`)}
                      style={{
                        borderWidth: 1,
                        borderColor: "#5941FF",
                        paddingVertical: 12,
                        borderRadius: 14,
                        alignItems: "center"
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#5941FF" }}>
                        📄 Jobdetails ansehen
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Animated.ScrollView>

      {/* Steuer-Hinweis Modal */}
      <Modal
        visible={showTaxModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTaxModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: COLORS.dimmed,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Header mit Neon-Akzent */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 2,
              borderBottomColor: COLORS.neon,
            }}>
              <Ionicons name="information-circle" size={32} color={COLORS.neon} />
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: COLORS.purple,
                marginLeft: 12,
              }}>
                Wichtiger Hinweis
              </Text>
            </View>

            {/* Content */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                <Text style={{ fontWeight: '700' }}>Steuern & Versicherung:</Text>
                {'\n'}
                Die Bezahlung erfolgt direkt zwischen dir und dem Auftraggeber.
              </Text>
              
              <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                <Text style={{ fontWeight: '700' }}>Deine Verantwortung:</Text>
                {'\n'}
                • Steuern selbst abführen
                {'\n'}
                • Versicherungen eigenständig regeln
                {'\n'}
                • Rechtliche Pflichten beachten
              </Text>

              <View style={{
                padding: 12,
                backgroundColor: '#FFF3CD',
                borderRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.neon,
              }}>
                <Text style={{ fontSize: 13, color: COLORS.darkGray, fontWeight: '600' }}>
                  💡 Bei Fragen wende dich an einen Steuerberater.
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setShowTaxModal(false)}
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
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                Verstanden
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setApplicationToDelete(null);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: COLORS.dimmed,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#FF4D4D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 2,
              borderBottomColor: '#FF4D4D',
            }}>
              <Ionicons name="trash" size={32} color="#FF4D4D" />
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: COLORS.black,
                marginLeft: 12,
              }}>
                Match löschen?
              </Text>
            </View>

            {/* Content */}
            <Text style={{ 
              fontSize: 15, 
              color: COLORS.darkGray, 
              lineHeight: 22,
              marginBottom: 24,
            }}>
              Möchtest du diesen Match wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  setApplicationToDelete(null);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: COLORS.lightGray,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  Abbrechen
                </Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteMatch}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: '#FF4D4D',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                  Löschen
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
