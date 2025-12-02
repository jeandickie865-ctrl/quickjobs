// app/(employer)/matches.tsx - NEON-TECH MATCHES SCREEN WITH AUTO-REFRESH
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob, JobApplication } from '../../utils/applicationStore';
import { getWorkerProfile, WorkerProfile } from '../../utils/profileStore';
import { getReviewsForWorker, calculateAverageRating } from '../../utils/reviewStore';
import { RatingDisplay } from '../../components/RatingDisplay';
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
  lightGray: '#F5F5F5',
  neonShadow: 'rgba(200,255,22,0.2)',
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
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
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>
            Meine Matches
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.white, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
            Alle bestätigten Arbeitsverhältnisse
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
                  backgroundColor: COLORS.white,
                  borderRadius: 18,
                  padding: 20,
                  shadowColor: COLORS.neon,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                }}
              >
                {/* Worker Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: COLORS.neon,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.black }}>
                      {match.application.workerName?.charAt(0) || 'W'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
                      {match.application.workerName || 'Worker'}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.darkGray, marginTop: 2 }}>
                      {match.application.status === 'pending' ? 'Neue Bewerbung' : 'Match seit'} {formatDate(match.application.createdAt)}
                    </Text>
                    {match.application.status === 'pending' && (
                      <View style={{ 
                        backgroundColor: COLORS.neon, 
                        paddingHorizontal: 8, 
                        paddingVertical: 4, 
                        borderRadius: 6, 
                        alignSelf: 'flex-start',
                        marginTop: 4
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.black }}>
                          NEU
                        </Text>
                      </View>
                    )}
                    <View style={{ marginTop: 6 }}>
                      <RatingDisplay
                        averageRating={match.avgRating}
                        reviewCount={match.reviewCount}
                        size="small"
                        color={COLORS.neon}
                      />
                    </View>
                  </View>
                </View>

                {/* Contact Details - ONLY VISIBLE AFTER PAYMENT */}
                {match.workerProfile && match.application.paymentStatus === 'paid' && (
                  <View style={{
                    backgroundColor: COLORS.neon,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.black, marginBottom: 12, opacity: 0.7 }}>
                      🔓 KONTAKTDATEN FREIGESCHALTET
                    </Text>
                    
                    {(match.workerProfile.firstName || match.workerProfile.lastName) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Ionicons name="person" size={18} color={COLORS.black} />
                        <Text style={{ fontSize: 15, color: COLORS.black, fontWeight: '700' }}>
                          {match.workerProfile.firstName} {match.workerProfile.lastName}
                        </Text>
                      </View>
                    )}
                    
                    {match.workerProfile.email && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Ionicons name="mail" size={18} color={COLORS.black} />
                        <Text style={{ fontSize: 14, color: COLORS.black, fontWeight: '600' }}>
                          {match.workerProfile.email}
                        </Text>
                      </View>
                    )}
                    
                    {match.workerProfile.phone && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="call" size={18} color={COLORS.black} />
                        <Text style={{ fontSize: 14, color: COLORS.black, fontWeight: '600' }}>
                          {match.workerProfile.phone}
                        </Text>
                      </View>
                    )}
                    
                    {!match.workerProfile.email && !match.workerProfile.phone && (
                      <Text style={{ fontSize: 13, color: COLORS.black, opacity: 0.6, fontStyle: 'italic' }}>
                        Worker hat noch keine Kontaktdaten hinterlegt
                      </Text>
                    )}
                  </View>
                )}

                {/* Job Info */}
                <View style={{ 
                  backgroundColor: COLORS.lightGray, 
                  borderRadius: 12, 
                  padding: 12,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
                    {match.job.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="briefcase-outline" size={14} color={COLORS.darkGray} />
                    <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
                      {match.job.category}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ gap: 10 }}>
                  {/* Chat Button */}
                  <Pressable
                    onPress={() => {
                      if (match.application.paymentStatus === "paid") {
                        router.push(`/chat/${match.application.id}`);
                      } else {
                        router.push(`/payment/${match.application.id}`);
                      }
                    }}
                    disabled={match.application.paymentStatus === "pending"}
                    style={({ pressed }) => ({
                      backgroundColor: match.application.paymentStatus === "paid" ? COLORS.neon : COLORS.lightGray,
                      borderRadius: 14,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      shadowColor: match.application.paymentStatus === "paid" ? COLORS.neonShadow : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.8,
                      shadowRadius: 6,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons 
                        name={match.application.paymentStatus === "paid" ? "chatbubble-outline" : "lock-closed"} 
                        size={18} 
                        color={match.application.paymentStatus === "paid" ? COLORS.black : COLORS.darkGray} 
                      />
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: match.application.paymentStatus === "paid" ? COLORS.black : COLORS.darkGray 
                      }}>
                        {match.application.paymentStatus === "paid" ? "Zum Chat" : "Zahlung abschließen"}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Rate Worker Button - nur nach Zahlung */}
                  {match.application.paymentStatus === "paid" && (
                    <Pressable
                      onPress={() => {
                        // Use application.workerId directly
                        const workerId = match.application?.workerId;
                        console.log('🎯 Employer Button: application.workerId:', match.application?.workerId);
                        console.log('🎯 Employer Button: worker?.userId:', match.worker?.userId);
                        console.log('🎯 Employer Button: Final workerId:', workerId);
                        console.log('🎯 Employer Button: Navigate to rate - jobId:', match.job.id, 'workerId:', workerId);
                        router.push(`/(employer)/jobs/rate?jobId=${match.job.id}&workerId=${workerId}`);
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="star" size={18} color={COLORS.black} />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                          Auftragnehmer bewerten
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  {/* Anmeldedokumente Button - nur nach Zahlung */}
                  {match.application.paymentStatus === "paid" && (() => {
                    const hasWorkerData = workerDataStatus[match.application.workerId];
                    const buttonText = hasWorkerData 
                      ? "Anmeldedokumente erstellen" 
                      : "Worker-Daten fehlen noch";
                    const iconName = hasWorkerData ? "document-text" : "alert-circle";
                    
                    return (
                      <Pressable
                        onPress={() => {
                          router.push(`/(employer)/registration/confirm?applicationId=${match.application.id}&type=kurzfristig`);
                        }}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name={iconName} size={18} color={COLORS.white} />
                          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                            {buttonText}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })()}

                  {/* Official Registration Section - nur nach Zahlung */}
                  {match.application.paymentStatus === "paid" && (
                    <>
                      {match.workerProfile?.isSelfEmployed ? (
                        // Worker ist selbstständig - keine Anmeldung nötig
                        <View style={{ 
                          backgroundColor: 'rgba(200, 255, 22, 0.1)', 
                          padding: 12, 
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: COLORS.neon,
                        }}>
                          <Text style={{ color: COLORS.neon, fontSize: 13, textAlign: 'center' }}>
                            ℹ️ Diese Person ist selbstständig. Anmeldung nicht erforderlich.
                          </Text>
                        </View>
                      ) : (
                        // Worker ist NICHT selbstständig
                        <>
                          {/* 
                          ========================================
                          FEATURE DEAKTIVIERT: Offizielle Anmeldung
                          ========================================
                          Später wieder aktivieren!
                          
                          {match.application.officialRegistrationStatus === "none" && (
                            <>
                              <Pressable
                                onPress={() => requestOfficialRegistration(match.application.id)}
                                style={({ pressed }) => ({
                                  backgroundColor: COLORS.white,
                                  borderRadius: 12,
                                  paddingVertical: 12,
                                  alignItems: 'center',
                                  opacity: pressed ? 0.8 : 1,
                                })}
                              >
                                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.purple }}>
                                  📋 Offiziell anmelden
                                </Text>
                              </Pressable>
                              
                              <Pressable
                                onPress={() => setInformalRegistration(match.application.id)}
                                style={({ pressed }) => ({
                                  borderWidth: 2,
                                  borderColor: COLORS.white,
                                  borderRadius: 12,
                                  paddingVertical: 10,
                                  alignItems: 'center',
                                  opacity: pressed ? 0.8 : 1,
                                })}
                              >
                                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
                                  Ohne Anmeldung fortfahren
                                </Text>
                              </Pressable>
                            </>
                          )}
                          
                          {match.application.officialRegistrationStatus === "requested" && (
                            <View style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                              padding: 12, 
                              borderRadius: 12 
                            }}>
                              <Text style={{ color: COLORS.white, fontSize: 13, textAlign: 'center' }}>
                                ⏳ Wartet auf Daten vom Worker
                              </Text>
                            </View>
                          )}

                          {match.application.officialRegistrationStatus === "completed" && (
                            <Pressable
                              onPress={() => downloadContract(match.application.id)}
                              style={({ pressed }) => ({
                                backgroundColor: COLORS.white,
                                borderRadius: 12,
                                paddingVertical: 12,
                                alignItems: 'center',
                                opacity: pressed ? 0.8 : 1,
                              })}
                            >
                              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.purple }}>
                                📄 Arbeitsvertrag herunterladen
                              </Text>
                            </Pressable>
                          )}
                          */}

                          {match.application.officialRegistrationStatus === "denied" && (
                            // Worker hat abgelehnt
                            <View style={{ 
                              backgroundColor: 'rgba(255, 77, 77, 0.1)', 
                              padding: 12, 
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#FF4D4D',
                            }}>
                              <Text style={{ color: '#FF4D4D', fontSize: 13, textAlign: 'center' }}>
                                ❌ Worker hat offizielle Anmeldung abgelehnt
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Job Details Button */}
                  <Pressable
                    onPress={() => router.push(`/(employer)/jobs/${match.job.id}`)}
                    style={({ pressed }) => ({
                      borderWidth: 2,
                      borderColor: COLORS.neon,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                      Auftragsdetails
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
