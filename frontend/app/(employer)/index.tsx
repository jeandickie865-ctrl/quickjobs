// app/(employer)/index.tsx - NEON-TECH DASHBOARD
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Auftrag } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob, JobApplication } from '../../utils/applicationStore';
import { formatAddress } from '../../types/address';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  neonTransparent: 'rgba(200,255,22,0.3)',
  neonShadow: 'rgba(200,255,22,0.2)',
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Auftrag[]>([]);
  const [applications, setApplications] = useState<Record<string, JobApplication[]>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load employer's jobs
      const employerJobs = await getEmployerJobs(user.id);
      setJobs(employerJobs);
      
      // Load applications for each job
      const appsMap: Record<string, JobApplication[]> = {};
      for (const job of employerJobs) {
        const jobApps = await getApplicationsForJob(job.id);
        appsMap[job.id] = jobApps;
      }
      setApplications(appsMap);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) return null;

  // Calculate statistics
  const allApplications = Object.values(applications).flat();
  const pendingApplications = allApplications.filter(app => app.status === 'pending');
  const acceptedApplications = allApplications.filter(app => app.status === 'accepted');

  // Filter jobs by status
  const openJobs = jobs
    .filter(j => j.status === 'open')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const acceptedJobs = jobs.filter(j => {
    const jobApps = applications[j.id] || [];
    return jobApps.some(app => app.status === 'accepted');
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const doneJobs = jobs
    .filter(j => j.status === 'done')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function isJobNew(job: Auftrag): boolean {
    const now = new Date().getTime();
    const created = new Date(job.createdAt).getTime();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    return hoursDiff < 24;
  }

  function formatJobDate(job: Auftrag): string {
    if (job.timeMode === 'fixed_time' && job.startAt) {
      const date = new Date(job.startAt);
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (job.timeMode === 'project' && job.dueAt) {
      const date = new Date(job.dueAt);
      return `Bis: ${date.toLocaleDateString('de-DE')}`;
    } else if (job.timeMode === 'hour_package' && job.hours) {
      return `${job.hours}h Paket`;
    }
    return 'Flexibel';
  }

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
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            Meine Aufträge
          </Text>
          <Pressable onPress={() => router.push('/(employer)/profile')}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.neon }}>
              Profil
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 100 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={COLORS.neon} size="large" />
            <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Aufträge...</Text>
          </View>
        ) : (
          <>
            {/* Statistik Cards */}
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {/* Offene Aufträge Card */}
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: COLORS.neon,
                  borderRadius: 16,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white, opacity: 0.7 }}>
                    OFFENE AUFTRÄGE
                  </Text>
                  <Ionicons name="clipboard-outline" size={20} color={COLORS.neon} />
                </View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.neon }}>
                  {openJobs.length}
                </Text>
              </Pressable>

              {/* Bewerbungen Card */}
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: COLORS.neon,
                  borderRadius: 16,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white, opacity: 0.7 }}>
                    BEWERBUNGEN
                  </Text>
                  <Ionicons name="people-outline" size={20} color={COLORS.neon} />
                </View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.neon }}>
                  {pendingApplications.length}
                </Text>
              </Pressable>

              {/* Matches Card */}
              <Pressable
                onPress={() => router.push('/(employer)/matches')}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: COLORS.neon,
                  borderRadius: 16,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white, opacity: 0.7 }}>
                    MATCHES
                  </Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.neon} />
                </View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.neon }}>
                  {acceptedApplications.length}
                </Text>
              </Pressable>

              {/* Abgeschlossen Card */}
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: COLORS.neon,
                  borderRadius: 16,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white, opacity: 0.7 }}>
                    ABGESCHLOSSEN
                  </Text>
                  <Ionicons name="checkmark-done-outline" size={20} color={COLORS.neon} />
                </View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: COLORS.neon }}>
                  {doneJobs.length}
                </Text>
              </Pressable>
            </View>

            {/* Offene Aufträge */}
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 18,
              padding: 20,
              shadowColor: COLORS.neon,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '700', 
                color: COLORS.black, 
                marginBottom: 16 
              }}>
                Offene Aufträge
              </Text>

              {openJobs.length === 0 ? (
                <Text style={{ color: COLORS.darkGray, textAlign: 'center', paddingVertical: 20 }}>
                  Noch keine offenen Aufträge
                </Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {openJobs.map(job => (
                    <Pressable
                      key={job.id}
                      onPress={() => router.push(`/(employer)/jobs/${job.id}`)}
                      style={({ pressed }) => ({
                        backgroundColor: COLORS.lightGray,
                        borderRadius: 12,
                        padding: 16,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '700', 
                          color: COLORS.black,
                          flex: 1 
                        }}>
                          {job.title}
                        </Text>
                        {isJobNew(job) && (
                          <View style={{
                            backgroundColor: COLORS.neon,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            marginLeft: 8,
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.black }}>
                              NEU
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="time-outline" size={14} color={COLORS.darkGray} />
                          <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                            {formatJobDate(job)}
                          </Text>
                        </View>

                        {job.address && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="location-outline" size={14} color={COLORS.darkGray} />
                            <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                              {formatAddress(job.address)}
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="pricetag-outline" size={14} color={COLORS.darkGray} />
                          <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                            {job.category}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => router.push(`/(employer)/jobs/${job.id}`)}
                        style={{
                          marginTop: 12,
                          borderWidth: 2,
                          borderColor: COLORS.neon,
                          borderRadius: 10,
                          paddingVertical: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                          Details ansehen
                        </Text>
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Laufende Matches */}
            {acceptedJobs.length > 0 && (
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 18,
                padding: 20,
                shadowColor: COLORS.neon,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: COLORS.black, 
                  marginBottom: 16 
                }}>
                  Laufende Matches
                </Text>

                <View style={{ gap: 12 }}>
                  {acceptedJobs.map(job => {
                    const jobApps = applications[job.id] || [];
                    const acceptedApp = jobApps.find(app => app.status === 'accepted');
                    
                    return (
                      <View
                        key={job.id}
                        style={{
                          backgroundColor: COLORS.lightGray,
                          borderRadius: 12,
                          padding: 16,
                        }}
                      >
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '700', 
                          color: COLORS.black,
                          marginBottom: 8 
                        }}>
                          {job.title}
                        </Text>

                        {acceptedApp && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <View style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: COLORS.neon,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                                {acceptedApp.workerName?.charAt(0) || 'W'}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                              {acceptedApp.workerName || 'Worker'}
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                          <Ionicons name="time-outline" size={14} color={COLORS.darkGray} />
                          <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                            {formatJobDate(job)}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => {
                            // TODO: Navigate to chat
                            console.log('Navigate to chat for job', job.id);
                          }}
                          style={{
                            backgroundColor: COLORS.neon,
                            borderRadius: 10,
                            paddingVertical: 10,
                            alignItems: 'center',
                            shadowColor: COLORS.neon,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.black }}>
                            Zum Chat
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Abgeschlossene Aufträge */}
            {doneJobs.length > 0 && (
              <View style={{
                backgroundColor: COLORS.white,
                borderRadius: 18,
                padding: 20,
                shadowColor: COLORS.neon,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: COLORS.black, 
                  marginBottom: 16 
                }}>
                  Abgeschlossene Aufträge
                </Text>

                <View style={{ gap: 12 }}>
                  {doneJobs.map(job => (
                    <View
                      key={job.id}
                      style={{
                        backgroundColor: COLORS.lightGray,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: COLORS.black,
                        marginBottom: 8 
                      }}>
                        {job.title}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Ionicons name="time-outline" size={14} color={COLORS.darkGray} />
                        <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                          {formatJobDate(job)}
                        </Text>
                      </View>

                      {!job.employerRating ? (
                        <Pressable
                          onPress={() => router.push(`/(employer)/jobs/rate?jobId=${job.id}`)}
                          style={{
                            borderWidth: 2,
                            borderColor: COLORS.neon,
                            borderRadius: 10,
                            paddingVertical: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                            Bewertung abgeben
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Ionicons
                              key={star}
                              name={star <= (job.employerRating || 0) ? 'star' : 'star-outline'}
                              size={18}
                              color={COLORS.neon}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
