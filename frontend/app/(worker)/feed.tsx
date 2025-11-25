// app/(worker)/feed.tsx - FINAL NEON-TECH DESIGN WITH AUTO-REFRESH
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile } from '../../utils/profileStore';
import { getJobs } from '../../utils/jobStore';
import { applyForJob, getApplicationsForWorker } from '../../utils/applicationStore';
import { getMatchingJobs } from '../../utils/matchingSimple';
import { nearbyJobs, NearbyJob } from '../../utils/nearbyJobs';
import { Job } from '../../types/job';
import { WorkerProfile } from '../../types/profile';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';
import { Ionicons } from '@expo/vector-icons';
import { getReviewsForEmployer, calculateAverageRating } from '../../utils/reviewStore';
import { RatingDisplay } from '../../components/RatingDisplay';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  whiteTransparent60: 'rgba(255,255,255,0.6)',
  purpleTransparent30: 'rgba(89,65,255,0.3)',
  whiteTransparent40: 'rgba(255,255,255,0.4)',
  neonShadow: 'rgba(200,255,22,0.15)',
  error: '#FF4D4D',
  errorBg: 'rgba(255,77,77,0.12)',
};

type TabType = 'matching' | 'all';

export default function WorkerFeed() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]); // Matched jobs
  const [allOpenJobs, setAllOpenJobs] = useState<Job[]>([]); // ALL open jobs for "Alle" tab
  const [appsJobIds, setAppsJobIds] = useState<Set<string>>(new Set());
  const [employerRatings, setEmployerRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingJobId, setIsApplyingJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('matching');

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async (silent = false) => {
    if (!user) return;

    // Don't show loading spinner on auto-refresh
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const workerProfile = await getWorkerProfile(user.id);
      
      if (!workerProfile || !workerProfile.categories || workerProfile.categories.length === 0) {
        setError('Bitte zuerst dein Profil ausfüllen.');
        setIsLoading(false);
        return;
      }

      setProfile(workerProfile);

      const allJobs = await getJobs();
      const openJobs = allJobs.filter(j => j.status === 'open');
      
      // Load applications FIRST to filter out already applied jobs
      const applications = await getApplicationsForWorker(user.id);
      const jobIdsSet = new Set(applications.map(app => app.jobId));
      setAppsJobIds(jobIdsSet);
      
      // Filter out jobs the worker already applied to
      const notAppliedJobs = openJobs.filter(job => !jobIdsSet.has(job.id));
      
      // Store ALL open jobs (not applied yet) for "Alle" tab
      setAllOpenJobs(notAppliedJobs);
      
      // SIMPLE MATCHING: Nur Kategorie-Check für "Passende" Tab!
      const matchedJobs = getMatchingJobs(notAppliedJobs, workerProfile);
      
      // Load employer ratings for each job
      const ratings: Record<string, { avg: number; count: number }> = {};
      for (const job of matchedJobs) {
        const reviews = await getReviewsForEmployer(job.employerId);
        ratings[job.employerId] = {
          avg: calculateAverageRating(reviews),
          count: reviews.length
        };
      }
      setEmployerRatings(ratings);
      
      setJobs(matchedJobs);

      setError(null);
    } catch (e) {
      console.error('Error loading feed:', e);
      if (!silent) {
        setError('Fehler beim Laden der Aufträge.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  // Setup auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Load data immediately
      if (!authLoading && user) {
        loadData();
      }

      // Start auto-refresh interval (5 seconds)
      intervalRef.current = setInterval(() => {
        if (!authLoading && user) {
          loadData(true); // Silent refresh
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Prüfen, ob Worker sich für einen Auftrag bewerben kann
  // SIMPLIFIED: Wenn Job matched (bereits durch jobMatchesWorker geprüft), kann Worker sich bewerben
  const canApplyToJob = (job: Job, workerProfile: WorkerProfile | null): boolean => {
    if (!workerProfile) return false;
    
    // Job wurde bereits durch matching.ts gefiltert
    // Wenn er im Feed ist, kann der Worker sich bewerben
    return true;
  };

  // Passende Aufträge - bereits gefiltert in loadData()
  const matchingJobs = useMemo(
    () => jobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [jobs]
  );

  // Alle Aufträge im Umkreis - NUTZT allOpenJobs statt jobs!
  const allJobsInRadius: NearbyJob[] = useMemo(() => {
    if (!profile) {
      console.log('⚠️ allJobsInRadius: No profile');
      return [];
    }
    console.log('🔍 allJobsInRadius: allOpenJobs count:', allOpenJobs.length);
    console.log('🔍 allJobsInRadius: profile:', profile);
    const nearby = nearbyJobs(allOpenJobs, profile);
    console.log('🔍 allJobsInRadius: nearby count:', nearby.length);
    console.log('🔍 allJobsInRadius: nearby jobs:', nearby);
    return nearby.sort((a, b) => a.distance - b.distance);
  }, [allOpenJobs, profile]);

  const handleApply = async (job: Job) => {
    if (!user || !profile || isApplyingJobId) return;

    if (!profile.categories || profile.categories.length === 0) {
      setError('Bitte zuerst dein Profil vervollständigen.');
      return;
    }

    setIsApplyingJobId(job.id);

    try {
      await applyForJob(job.id, user.id, job.employerId);
      
      // Remove job from lists
      setJobs(prev => prev.filter(j => j.id !== job.id));
      setAllOpenJobs(prev => prev.filter(j => j.id !== job.id));
      setAppsJobIds(prev => new Set(prev).add(job.id));

      setError(null);
    } catch (e: any) {
      console.error('Error applying:', e);
      setError(e.message || 'Fehler beim Bewerben.');
    } finally {
      setIsApplyingJobId(null);
    }
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Aufträge...</Text>
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
            Aktuelle Jobs
          </Text>
          <Pressable onPress={() => router.push('/(worker)/profile')}>
            <Ionicons name="person-circle-outline" size={26} color={COLORS.neon} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Tab Switcher */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
      }}>
        <Pressable
          onPress={() => setActiveTab('matching')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: activeTab === 'matching' ? COLORS.neon : COLORS.whiteTransparent40,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: activeTab === 'matching' ? COLORS.black : COLORS.white,
          }}>
            Passende ({matchingJobs.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('all')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: activeTab === 'all' ? COLORS.neon : COLORS.whiteTransparent40,
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: activeTab === 'all' ? COLORS.black : COLORS.white,
          }}>
            Alle ({allJobsInRadius.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.neon} />
        }
      >
        {error && (
          <View style={{
            padding: 16,
            backgroundColor: COLORS.errorBg,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.error,
          }}>
            <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {activeTab === 'matching' && (
          matchingJobs.length === 0 ? (
            <View style={{
              padding: 32,
              backgroundColor: COLORS.white,
              borderRadius: 18,
              alignItems: 'center',
              gap: 12,
            }}>
              <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
                Keine passenden Aufträge
              </Text>
              <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
                Aktuell gibt es keine Aufträge, die zu deinem Profil passen.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {matchingJobs.filter(job => job && job.id && job.startAt).map((job) => {
                const timeDisplay = formatJobTimeDisplay(
                  job.startAt,
                  job.endAt,
                  job.timeMode,
                  job.hours,
                  job.dueAt
                );
                const canApply = canApplyToJob(job, profile);
                const isApplying = isApplyingJobId === job.id;
                const employerRating = employerRatings[job.employerId];

                return (
                  <View
                    key={job.id}
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
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '700', 
                          color: COLORS.purple,
                          marginBottom: 4,
                        }}>
                          {job.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                            von {job.employerName || 'Auftraggeber'}
                          </Text>
                          {employerRating && employerRating.count > 0 && (
                            <RatingDisplay 
                              rating={employerRating.avg} 
                              reviewCount={employerRating.count}
                              size="small"
                            />
                          )}
                        </View>
                      </View>
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
                        📍 {formatAddress(job.location)}
                      </Text>
                    </View>

                    {/* Preis */}
                    <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 16 }}>
                      {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                    </Text>

                    {/* Action Button */}
                    <Pressable
                      onPress={() => handleApply(job)}
                      disabled={!canApply || isApplying}
                      style={({ pressed }) => ({
                        backgroundColor: canApply && !isApplying ? COLORS.neon : '#E8E8E8',
                        paddingVertical: 14,
                        borderRadius: 16,
                        alignItems: 'center',
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      {isApplying ? (
                        <ActivityIndicator color={COLORS.darkGray} />
                      ) : (
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '700', 
                          color: canApply ? COLORS.black : '#666',
                        }}>
                          {canApply ? '✓ Ich habe Zeit' : '× Nicht verfügbar'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )
        )}

        {activeTab === 'all' && (
          allJobsInRadius.length === 0 ? (
            <View style={{
              padding: 32,
              backgroundColor: COLORS.white,
              borderRadius: 18,
              alignItems: 'center',
              gap: 12,
            }}>
              <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
                Keine Aufträge in deinem Umkreis
              </Text>
              <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
                Erweitere deinen Suchradius in den Profileinstellungen.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {allJobsInRadius.filter((job) => job && job.id && job.startAt).map((job) => {
                const distance = job.distance;
                const timeDisplay = formatJobTimeDisplay(
                  job.startAt,
                  job.endAt,
                  job.timeMode,
                  job.hours,
                  job.dueAt
                );
                const isApplying = isApplyingJobId === job.id;
                const employerRating = employerRatings[job.employerId];

                return (
                  <View
                    key={job.id}
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
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '700', 
                          color: COLORS.purple,
                          marginBottom: 4,
                        }}>
                          {job.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                            von {job.employerName || 'Auftraggeber'}
                          </Text>
                          {employerRating && employerRating.count > 0 && (
                            <RatingDisplay 
                              rating={employerRating.avg} 
                              reviewCount={employerRating.count}
                              size="small"
                            />
                          )}
                        </View>
                      </View>
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: COLORS.purpleTransparent30,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.white }}>
                          {distance.toFixed(1)} km
                        </Text>
                      </View>
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
                        📍 {formatAddress(job.location)}
                      </Text>
                    </View>

                    {/* Preis */}
                    <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 16 }}>
                      {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                    </Text>

                    {/* Action Button */}
                    <Pressable
                      onPress={() => handleApply(job)}
                      disabled={isApplying}
                      style={({ pressed }) => ({
                        backgroundColor: !isApplying ? COLORS.neon : '#E8E8E8',
                        paddingVertical: 14,
                        borderRadius: 16,
                        alignItems: 'center',
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      {isApplying ? (
                        <ActivityIndicator color={COLORS.darkGray} />
                      ) : (
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                          ✓ Ich habe Zeit
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}
