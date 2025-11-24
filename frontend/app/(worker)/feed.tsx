// app/(worker)/feed.tsx - FINAL NEON-TECH DESIGN
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appsJobIds, setAppsJobIds] = useState<Set<string>>(new Set());
  const [employerRatings, setEmployerRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingJobId, setIsApplyingJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('matching');

  const loadData = async () => {
    if (!user) return;

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
      
      console.log('🔍 ROBUST MATCHING START');
      console.log(`📊 Total Jobs: ${allJobs.length}, Open Jobs: ${openJobs.length}`);
      console.log('👤 Worker Profile:', {
        userId: workerProfile.userId,
        categories: workerProfile.categories,
        tags: workerProfile.selectedTags,
        coords: workerProfile.homeLat && workerProfile.homeLon ? 'YES' : 'NO',
        radius: workerProfile.radiusKm,
      });
      
      // Load applications FIRST to filter out already applied jobs
      const applications = await getApplicationsForWorker(user.id);
      const jobIdsSet = new Set(applications.map(app => app.jobId));
      setAppsJobIds(jobIdsSet);
      
      // Filter out jobs the worker already applied to
      const notAppliedJobs = openJobs.filter(job => !jobIdsSet.has(job.id));
      console.log(`📋 Filtered out ${openJobs.length - notAppliedJobs.length} already-applied jobs`);
      
      // SIMPLE MATCHING: Nur Kategorie-Check!
      const matchedJobs = getMatchingJobs(notAppliedJobs, workerProfile);
      
      console.log(`🎯 SIMPLE MATCHING FERTIG: ${matchedJobs.length} von ${notAppliedJobs.length} Jobs matchen`);
      
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
      setError('Fehler beim Laden der Aufträge.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

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

  // Alle Aufträge im Umkreis
  const allJobsInRadius: NearbyJob[] = useMemo(() => {
    if (!profile) return [];
    const openJobs = jobs.filter(j => j.status === 'open');
    return nearbyJobs(openJobs, profile);
  }, [jobs, profile]);

  // Aktive Job-Liste basierend auf Tab
  const activeJobs = activeTab === 'matching' ? matchingJobs : allJobsInRadius;

  async function handleApply(jobId: string, employerId: string | undefined) {
    if (!user || !profile) {
      setError('Du bist nicht eingeloggt.');
      return;
    }

    if (!employerId) {
      setError('Dieser Auftrag hat keinen Auftraggeber zugewiesen.');
      return;
    }

    try {
      setIsApplyingJobId(jobId);
      await applyForJob(jobId, user.id, employerId);

      const updated = new Set(appsJobIds);
      updated.add(jobId);
      setAppsJobIds(updated);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      setError('Bewerbung konnte nicht gespeichert werden: ' + msg);
    } finally {
      setIsApplyingJobId(null);
    }
  }

  if (authLoading) return null;

  if (!user || user.role !== 'worker') {
    return <Redirect href="/start" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16, fontSize: 15 }}>Lade Aufträge…</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error && (!profile || !profile.categories || profile.categories.length === 0)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
          <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            Profil vervollständigen
          </Text>
          <Text style={{ color: COLORS.whiteTransparent60, fontSize: 15, textAlign: 'center' }}>
            Bitte wähle mindestens eine Kategorie in deinem Profil, um Aufträge zu sehen.
          </Text>
          <Pressable
            onPress={() => router.replace('/(worker)/profile')}
            style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 16,
              marginTop: 16,
            }}
          >
            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700' }}>
              Zum Profil
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Optional Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
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
            Jobs für dich
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => router.push('/(worker)/matches')}>
              <Ionicons name="heart-outline" size={26} color={COLORS.neon} />
            </Pressable>
            <Pressable onPress={() => router.push('/(worker)/profile')}>
              <Ionicons name="person-circle-outline" size={26} color={COLORS.neon} />
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginTop: 8,
          marginBottom: 16,
        }}>
          <Pressable
            onPress={() => setActiveTab('matching')}
            style={{ flex: 1, alignItems: 'center', paddingBottom: 12 }}
          >
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: activeTab === 'matching' ? COLORS.neon : COLORS.whiteTransparent60,
            }}>
              Passende Jobs
            </Text>
            {activeTab === 'matching' && (
              <View style={{
                marginTop: 8,
                width: 40,
                height: 3,
                backgroundColor: COLORS.neon,
                borderRadius: 2,
              }} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('all')}
            style={{ flex: 1, alignItems: 'center', paddingBottom: 12 }}
          >
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: activeTab === 'all' ? COLORS.neon : COLORS.whiteTransparent60,
            }}>
              Jobs im Umkreis
            </Text>
            {activeTab === 'all' && (
              <View style={{
                marginTop: 8,
                width: 40,
                height: 3,
                backgroundColor: COLORS.neon,
                borderRadius: 2,
              }} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.neon}
          />
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

        {activeJobs.length === 0 ? (
          <View style={{
            padding: 32,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
              {activeTab === 'matching' 
                ? 'Keine neuen Jobs verfügbar'
                : 'Keine Jobs im Umkreis'}
            </Text>
            <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
              {activeTab === 'matching'
                ? 'Alle passenden Jobs wurden bereits beworben oder sind abgeschlossen. Prüfe deine Matches oder warte auf neue Jobs!'
                : 'Aktuell gibt es keine offenen Jobs in deiner Nähe. Schau später wieder vorbei!'}
            </Text>
            <Pressable
              onPress={() => router.push('/(worker)/matches')}
              style={{
                marginTop: 8,
                backgroundColor: COLORS.neon,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: COLORS.black, fontWeight: '700' }}>
                💼 Meine Matches ansehen
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {activeJobs.map((job) => {
              const hasApplied = appsJobIds.has(job.id);
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );
              const canApply = canApplyToJob(job, profile);
              const isNearbyJob = activeTab === 'all' && 'distance' in job;
              const nearbyJobData = isNearbyJob ? (job as NearbyJob) : null;
              const isNew = job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) < 24 * 60 * 60 * 1000;

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
                  {/* Header mit Badges */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text style={{ 
                      flex: 1,
                      fontSize: 18, 
                      fontWeight: '700', 
                      color: COLORS.purple,
                      lineHeight: 24,
                      marginRight: 12,
                    }}>
                      {job.title}
                    </Text>
                    
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

                  {/* Category */}
                  <Text style={{ fontSize: 13, color: COLORS.darkGray, marginBottom: 8 }}>
                    📦 {job.category}
                  </Text>

                  {/* Zeit & Ort */}
                  <View style={{ gap: 6, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      🕐 {timeDisplay}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                      📍 {formatAddress(job.location)}
                    </Text>
                    {nearbyJobData && nearbyJobData.distance && (
                      <Text style={{ fontSize: 13, color: COLORS.neon, fontWeight: '600' }}>
                        📏 {nearbyJobData.distance.toFixed(1)} km entfernt
                      </Text>
                    )}
                  </View>

                  {/* Preis - BUG 1 FIX: job.wages → job.workerAmountCents */}
                  <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.black, marginBottom: 16 }}>
                    {euro(job.workerAmountCents)} / {job.timeMode === 'hours' ? 'Stunde' : 'Gesamt'}
                  </Text>

                  {/* Button */}
                  {hasApplied ? (
                    <View style={{
                      paddingVertical: 16,
                      borderRadius: 14,
                      backgroundColor: '#E8E8E8',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#666' }}>
                        ✓ Bereits beworben
                      </Text>
                    </View>
                  ) : !canApply ? (
                    <View style={{
                      paddingVertical: 16,
                      borderRadius: 14,
                      backgroundColor: COLORS.purpleTransparent30,
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.whiteTransparent40 }}>
                        Qualifikationen fehlen
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleApply(job.id, job.employerId)}
                      disabled={isApplyingJobId === job.id}
                      style={({ pressed }) => ({
                        paddingVertical: 16,
                        borderRadius: 14,
                        backgroundColor: COLORS.neon,
                        alignItems: 'center',
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                        {isApplyingJobId === job.id ? 'Bewerbe...' : 'Ich habe Zeit'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
