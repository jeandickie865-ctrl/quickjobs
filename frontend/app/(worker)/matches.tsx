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
  darkGray: '#333333',
  neonShadow: 'rgba(200,255,22,0.15)',
  dimmed: 'rgba(0,0,0,0.7)',
  textPrimary: "#000000",
  textSecondary: "#333333",
  accentNeon: "#C8FF16",
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
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.12,
        blur: 60,
      }} />

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '900', 
            color: COLORS.white,
            letterSpacing: 0.2,
          }}>
            Meine Matches
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => setShowTaxModal(true)}>
              <Ionicons name="information-circle-outline" size={26} color={COLORS.neon} />
            </Pressable>
            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.neon} />
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
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    padding: 20,
                    shadowColor: COLORS.neon,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  {/* Header mit Initialen + Badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                    {/* Initialen-Kreis */}
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: COLORS.purple,
                      borderWidth: 3,
                      borderColor: COLORS.neon,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
                        {employerInitials}
                      </Text>
                    </View>

                    {/* Job Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '700', 
                        color: COLORS.purple,
                        marginBottom: 4,
                      }}>
                        {job.title}
                      </Text>
                      <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                        von {employerName}
                      </Text>
                    </View>

                    {/* Badge */}
                    {isNew && (
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: COLORS.neon,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.black }}>
                          NEU
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Status Badge */}
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: application.status === 'accepted' ? COLORS.neon : '#FFF3CD',
                    borderRadius: 10,
                    alignSelf: 'flex-start',
                    marginBottom: 12,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.black }}>
                      {application.status === 'accepted' ? '✓ Akzeptiert' : '⏳ Warte auf Antwort'}
                    </Text>
                  </View>

                  {/* Job Details */}
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      📦 {job.category}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      🕐 {timeDisplay}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      📍 {job.address?.street} {job.address?.house_number}, {job.address?.postal_code} {job.address?.city}
                    </Text>
                  </View>

                  {/* Preis */}
                  <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 16 }}>
                    {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                  </Text>

                  {/* Action Buttons */}
                  {application.status === 'accepted' ? (
                    <View style={{ gap: 12 }}>
                      <Pressable
                        onPress={() => {
                          if (application.paymentStatus === "paid") {
                            router.push(`/chat/${application.id}`);
                          }
                        }}
                        disabled={application.paymentStatus !== "paid"}
                        style={({ pressed }) => ({
                          backgroundColor: application.paymentStatus === "paid" ? COLORS.neon : COLORS.lightGray,
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          shadowColor: application.paymentStatus === "paid" ? COLORS.neonShadow : 'transparent',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          opacity: pressed ? 0.9 : 1,
                        })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '700', 
                            color: application.paymentStatus === "paid" ? COLORS.black : COLORS.darkGray 
                          }}>
                            {application.paymentStatus === "paid" ? "💬 Zum Chat" : "🔒 Warte auf Zahlung"}
                          </Text>
                          {application.paymentStatus === "paid" && unreadCounts[application.id] > 0 && (
                            <View style={{
                              backgroundColor: '#FF4444',
                              borderRadius: 12,
                              minWidth: 24,
                              height: 24,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 6,
                            }}>
                              <Text style={{ 
                                fontSize: 12, 
                                fontWeight: '700', 
                                color: COLORS.white 
                              }}>
                                {unreadCounts[application.id]}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      {/* Official Registration Section - nur nach Zahlung */}
                      {application.paymentStatus === "paid" && application.officialRegistrationStatus === "requested" && (
                        <View style={{ 
                          backgroundColor: 'rgba(200, 255, 22, 0.1)', 
                          padding: 16, 
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: COLORS.neon,
                          gap: 12,
                        }}>
                          <Text style={{ color: COLORS.neon, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
                            📋 Offizielle Anmeldung angefragt
                          </Text>
                          <Text style={{ color: COLORS.white, fontSize: 13, textAlign: 'center' }}>
                            Der Arbeitgeber möchte dich offiziell anmelden. Bitte übermittle deine Daten oder lehne ab.
                          </Text>
                          
                          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <Pressable
                              onPress={() => router.push(`/official-data-form/${application.id}`)}
                              style={({ pressed }) => ({
                                flex: 1,
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
                                📝 Daten senden
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={async () => {
                                try {
                                  const headers = await getAuthHeaders();
                                  await fetch(`${API_URL}/applications/${application.id}/respond-official-registration`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ decision: 'deny' }),
                                  });
                                  loadApplications();
                                } catch (err) {
                                  console.error('Deny registration failed:', err);
                                }
                              }}
                              style={({ pressed }) => ({
                                flex: 1,
                                borderWidth: 2,
                                borderColor: COLORS.neon,
                                paddingVertical: 10,
                                borderRadius: 12,
                                alignItems: 'center',
                                opacity: pressed ? 0.9 : 1,
                              })}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                                ❌ Ablehnen
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                      
                      <Pressable
                        onPress={() => {
                          console.log('🎯 Worker: Navigate to rate - jobId:', job.id, 'employerId:', job.employerId);
                          router.push(`/(worker)/rate?jobId=${job.id}&employerId=${job.employerId}`);
                        }}
                        style={({ pressed }) => ({
                          backgroundColor: '#FFD700',
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          shadowColor: 'rgba(255,215,0,0.2)',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          opacity: pressed ? 0.9 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                          ⭐ Auftraggeber bewerten
                        </Text>
                      </Pressable>
                      
                      <Pressable
                        onPress={() => router.push(`/(worker)/jobs/${job.id}`)}
                        style={({ pressed }) => ({
                          backgroundColor: COLORS.purple,
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          shadowColor: 'rgba(89,65,255,0.2)',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          opacity: pressed ? 0.9 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                          📄 Jobdetails ansehen
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={async () => {
                          if (confirm('Möchtest du diesen Match wirklich löschen?')) {
                            try {
                              const headers = await getAuthHeaders();
                              const res = await fetch(`${API_URL}/applications/${application.id}`, {
                                method: 'DELETE',
                                headers,
                              });
                              if (res.ok) {
                                loadMatches();
                              } else {
                                alert('Fehler beim Löschen');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Fehler beim Löschen');
                            }
                          }
                        }}
                        style={({ pressed }) => ({
                          backgroundColor: '#FF4D4D',
                          borderRadius: 14,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          marginTop: 8,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.white }}>
                          🗑️ Löschen
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#E8E8E8',
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textSecondary }}>
                        Warte auf Antwort...
                      </Text>
                    </View>
                  )}
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
    </View>
  );
}
