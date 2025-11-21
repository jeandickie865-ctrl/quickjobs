import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile } from '../../utils/profileStore';
import { getJobs } from '../../utils/jobStore';
import { applyForJob, getApplicationsForWorker } from '../../utils/applicationStore';
import { jobMatchesWorker, jobMatchesWorkerWithDebug, MatchDebug } from '../../utils/matching';
import { nearbyJobs, NearbyJob } from '../../utils/nearbyJobs';
import { Job } from '../../types/job';
import { WorkerProfile } from '../../types/profile';
import { Button } from '../../components/ui/Button';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';

export default function WorkerFeed() {
  const { colors, spacing } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appsJobIds, setAppsJobIds] = useState<Set<string>>(new Set());
  const [acceptedJobsCount, setAcceptedJobsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingJobId, setIsApplyingJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matching' | 'all'>('matching');
  
  // Debug counters
  const [allJobsCount, setAllJobsCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [debugInfos, setDebugInfos] = useState<MatchDebug[]>([]);

  const loadData = async () => {
    if (!user) return;

    try {
      const workerProfile = await getWorkerProfile(user.id);
      
      if (!workerProfile || !workerProfile.categories || workerProfile.categories.length === 0 || !workerProfile.selectedTags || workerProfile.selectedTags.length === 0) {
        setError('Bitte zuerst dein Profil ausfüllen.');
        setIsLoading(false);
        return;
      }

      setProfile(workerProfile);

      const allJobs = await getJobs();
      setAllJobsCount(allJobs.length);
      const openJobs = allJobs.filter(j => j.status === 'open');
      setOpenJobsCount(openJobs.length);
      setJobs(openJobs);

      // Generate debug info for all open jobs
      if (workerProfile) {
        const infos = openJobs.map(job => jobMatchesWorkerWithDebug(job, workerProfile));
        setDebugInfos(infos);
      }

      const applications = await getApplicationsForWorker(user.id);
      const jobIdsSet = new Set(applications.map(app => app.jobId));
      setAppsJobIds(jobIdsSet);

      // Count accepted applications for info box
      const acceptedApps = applications.filter(app => app.status === 'accepted');
      setAcceptedJobsCount(acceptedApps.length);

      setError(null);
    } catch (e) {
      console.error('Error loading feed:', e);
      setError('Fehler beim Laden der Jobs.');
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

  // Prüfen, ob Worker sich für einen Job bewerben kann
  const canApplyToJob = (job: Job, workerProfile: WorkerProfile | null): boolean => {
    if (!workerProfile) return false;

    // Spezialfall: Sicherheit - Pflicht-Tags prüfen
    if (job.category.toLowerCase() === 'sicherheit') {
      const securityRequiredTags = ['34a', 'bewacher-id', 'führungszeugnis'];
      const workerTags = new Set(workerProfile.selectedTags.map(t => t.toLowerCase()));
      
      // Alle Pflicht-Tags müssen vorhanden sein
      return securityRequiredTags.every(tag => workerTags.has(tag));
    }

    // Für andere Kategorien: Immer erlaubt
    return true;
  };

  // Hilfsfunktion: Distanz zwischen zwei Punkten berechnen
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Erdradius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Passende Jobs - mit Matching-Filter
  const matchingJobs = useMemo(
    () =>
      profile
        ? jobs
            .filter(j => j.status === 'open')
            .filter(j => jobMatchesWorker(j, profile))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        : [],
    [jobs, profile]
  );

  // Alle Jobs im Umkreis - mit Radius-Filter und Distanz-Info
  const allJobsInRadius: NearbyJob[] = useMemo(() => {
    if (!profile) return [];

    const openJobs = jobs.filter(j => j.status === 'open');
    return nearbyJobs(openJobs, profile);
  }, [jobs, profile]);

  // Aktive Job-Liste basierend auf Tab
  const activeJobs = activeTab === 'matching' ? matchingJobs : allJobsInRadius;

  async function handleApply(jobId: string, employerId: string | undefined) {
    if (!user) {
      console.log('❌ handleApply: no user');
      setError('Du bist nicht eingeloggt.');
      return;
    }

    if (!profile) {
      console.log('❌ handleApply: no profile');
      setError('Profil nicht gefunden.');
      return;
    }

    if (!employerId) {
      console.log('❌ handleApply: employerId is missing from job');
      setError('Dieser Job hat keinen Arbeitgeber zugewiesen. Bitte lade die Seite neu.');
      return;
    }

    try {
      setIsApplyingJobId(jobId);
      console.log('🚀 handleApply: start', {
        jobId,
        workerId: user.id,
        employerId,
      });

      await applyForJob(jobId, user.id, employerId);

      console.log('✅ handleApply: success');
      const updated = new Set(appsJobIds);
      updated.add(jobId);
      setAppsJobIds(updated);
      setError(null);
    } catch (e) {
      console.log('❌ handleApply: ERROR', e);
      const msg =
        e instanceof Error
          ? e.message
          : 'Unbekannter Fehler beim Bewerben.';
      setError('Bewerbung konnte nicht gespeichert werden: ' + msg);
    } finally {
      setIsApplyingJobId(null);
    }
  }

  if (authLoading) {
    return null;
  }

  if (!user || user.role !== 'worker') {
    return <Redirect href="/start" />;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.black} />
          <Text style={{ color: colors.gray700, marginTop: spacing.sm }}>Lade Jobs…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && (!profile || !profile.categories || profile.categories.length === 0)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ color: colors.black, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            Profil vervollständigen
          </Text>
          <Text style={{ color: colors.gray700, fontSize: 15, textAlign: 'center' }}>
            Bitte zuerst dein Profil ausfüllen, um passende Jobs zu sehen.
          </Text>
          <Button
            title="Zum Profil"
            onPress={() => router.replace('/(worker)/profile')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.black}
          />
        }
      >
        {/* Header mit Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black }}>
            Jobs für dich
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Text
              style={{ color: colors.gray600, fontSize: 14, textDecorationLine: 'underline' }}
              onPress={() => router.push('/(worker)/matches')}
            >
              🎯 Matches
            </Text>
            <Text
              style={{ color: colors.gray600, fontSize: 14, textDecorationLine: 'underline' }}
              onPress={() => router.push('/(worker)/profile')}
            >
              ⚙️ Profil
            </Text>
          </View>
        </View>

        {/* Tab-Buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.white, borderRadius: 12, padding: 4 }}>
          <Text
            onPress={() => setActiveTab('matching')}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 8,
              fontWeight: '700',
              fontSize: 14,
              backgroundColor: activeTab === 'matching' ? colors.black : 'transparent',
              color: activeTab === 'matching' ? colors.white : colors.gray700,
            }}
          >
            Passende Jobs
          </Text>
          <Text
            onPress={() => setActiveTab('all')}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 8,
              fontWeight: '700',
              fontSize: 14,
              backgroundColor: activeTab === 'all' ? colors.black : 'transparent',
              color: activeTab === 'all' ? colors.white : colors.gray700,
            }}
          >
            Alle Jobs im Umkreis
          </Text>
        </View>

        {error && (
          <View style={{
            padding: spacing.md,
            backgroundColor: '#fee',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#f88'
          }}>
            <Text style={{ color: '#c00', fontSize: 14 }}>
              {error}
            </Text>
          </View>
        )}

        {activeJobs.length === 0 ? (
          <View style={{
            padding: spacing.xl,
            backgroundColor: colors.white,
            borderRadius: 12,
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <Text style={{ color: colors.gray700, fontSize: 16, textAlign: 'center', fontWeight: '600' }}>
              {activeTab === 'matching' 
                ? 'Keine passenden Jobs gefunden'
                : 'Keine Jobs im Umkreis gefunden'}
            </Text>
            <Text style={{ color: colors.gray500, fontSize: 14, textAlign: 'center' }}>
              {activeTab === 'matching'
                ? 'Aktuell gibt es keine Jobs, die zu deinem Profil passen. Schau später wieder vorbei oder passe dein Profil an.'
                : 'Aktuell gibt es keine offenen Jobs in deiner Nähe. Schau später wieder vorbei.'}
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Debug: {allJobsCount} Jobs insgesamt, {openJobsCount} offene Jobs, {matchingJobs.length} passende Jobs für dein Profil.
            </Text>
            {profile && (
              <View style={{ marginTop: spacing.sm, width: '100%', gap: 4 }}>
                <Text style={{ color: colors.gray400, fontSize: 11 }}>
                  Profil: Kategorien = [{profile.categories.join(', ')}]
                </Text>
                <Text style={{ color: colors.gray400, fontSize: 11 }}>
                  Profil: Tags = [{profile.selectedTags.slice(0, 10).join(', ')}{profile.selectedTags.length > 10 ? '...' : ''}]
                </Text>
                {debugInfos.slice(0, 3).map(info => (
                  <View key={info.jobId} style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.gray200 }}>
                    <Text style={{ color: colors.gray500, fontSize: 11 }}>
                      Job {info.jobId.substring(0, 12)}: Kategorie = {info.jobCategory}, categoryOk = {String(info.categoryOk)}
                    </Text>
                    <Text style={{ color: colors.gray500, fontSize: 11 }}>
                      Pflicht-Tags Job = [{info.requiredAllJob.join(', ')}]
                    </Text>
                    <Text style={{ color: colors.gray500, fontSize: 11 }}>
                      Fehlende Pflicht-Tags im Profil = [{info.missingRequiredAll.join(', ')}]
                    </Text>
                    <Text style={{ color: colors.gray500, fontSize: 11 }}>
                      Any-Tags Job = [{info.requiredAnyJob.join(', ')}], Schnittmenge = [{info.anyIntersection.join(', ')}], requiredAnyOk = {String(info.requiredAnyOk)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {activeJobs.map((job) => {
              const hasApplied = appsJobIds.has(job.id);
              
              // Format date/time info using centralized function
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );

              // Prüfen, ob Job zum Profil passt (für Chip-Anzeige)
              const matchesProfile = profile ? jobMatchesWorker(job, profile) : false;
              
              // Prüfen, ob Worker sich bewerben kann (Pflicht-Qualifikationen)
              const canApply = canApplyToJob(job, profile);

              // Check if this is a NearbyJob with distance info
              const isNearbyJob = activeTab === 'all' && 'distance' in job;
              const nearbyJobData = isNearbyJob ? (job as NearbyJob) : null;

              return (
                <View
                  key={job.id}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: spacing.md,
                    gap: 10,
                    borderWidth: 1,
                    borderColor: colors.gray200,
                    opacity: nearbyJobData?.disabled ? 0.5 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 18, color: colors.black }}>
                    {job.title}
                  </Text>

                  {/* Profil-Match-Chip (nur im "Alle Jobs" Tab) */}
                  {activeTab === 'all' && (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: matchesProfile ? colors.beige200 : colors.gray100,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: matchesProfile ? colors.black : colors.gray600,
                      }}>
                        {matchesProfile ? '✓ passt zu deinem Profil' : '○ außerhalb deines Profils'}
                      </Text>
                    </View>
                  )}

                  {/* Disabled-Hinweis */}
                  {nearbyJobData?.disabled && nearbyJobData.disabledReason && (
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      backgroundColor: colors.gray200,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: colors.gray700,
                      }}>
                        🔒 {nearbyJobData.disabledReason}
                      </Text>
                    </View>
                  )}

                  <View style={{ gap: 4 }}>
                    <Text style={{ color: colors.gray700, fontSize: 14 }}>
                      📍 {formatAddress(job.address) || 'Adresse nicht angegeben'}
                      {nearbyJobData && nearbyJobData.distance !== Infinity && (
                        <Text style={{ color: colors.gray500, fontSize: 13 }}>
                          {' '}· {nearbyJobData.distance.toFixed(1)} km entfernt
                        </Text>
                      )}
                    </Text>
                    <Text style={{ color: colors.gray700, fontSize: 14 }}>
                      🏷️ {job.category}
                    </Text>
                    {timeDisplay && (
                      <Text style={{ color: colors.gray700, fontSize: 14 }}>
                        ⏱️ {timeDisplay}
                      </Text>
                    )}
                  </View>
                  {job.description && (
                    <Text style={{ color: colors.gray600, fontSize: 13 }} numberOfLines={2}>
                      {job.description}
                    </Text>
                  )}
                  <Text style={{ color: colors.black, fontWeight: '700', fontSize: 17, marginTop: 4 }}>
                    Lohn: {euro(job.workerAmountCents)}
                  </Text>

                  {hasApplied ? (
                    <View style={{
                      padding: spacing.sm,
                      backgroundColor: colors.beige100,
                      borderRadius: 8,
                      marginTop: 4
                    }}>
                      <Text style={{ color: colors.gray700, textAlign: 'center', fontSize: 14 }}>
                        ✓ Du hast dich schon für diesen Job gemeldet.
                      </Text>
                    </View>
                  ) : nearbyJobData?.disabled ? (
                    <View style={{ gap: spacing.xs }}>
                      <Button
                        title="Ich habe Zeit"
                        onPress={() => {}}
                        disabled={true}
                      />
                      <View style={{
                        padding: spacing.sm,
                        backgroundColor: '#f3f4f6',
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.gray400,
                      }}>
                        <Text style={{ color: colors.gray700, fontSize: 12, lineHeight: 16 }}>
                          🔒 {nearbyJobData.disabledReason || 'Dieser Job steht dir aktuell nicht zur Verfügung.'}
                        </Text>
                      </View>
                    </View>
                  ) : canApply ? (
                    <Button
                      title={isApplyingJobId === job.id ? 'Melde dich…' : 'Ich habe Zeit'}
                      onPress={() => handleApply(job.id, job.employerId)}
                      disabled={isApplyingJobId === job.id}
                    />
                  ) : (
                    <View style={{ gap: spacing.xs }}>
                      <Button
                        title="Ich habe Zeit"
                        onPress={() => {}}
                        disabled={true}
                      />
                      <View style={{
                        padding: spacing.sm,
                        backgroundColor: '#fef3cd',
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: '#f0ad4e',
                      }}>
                        <Text style={{ color: '#8a6d3b', fontSize: 12, lineHeight: 16 }}>
                          ⚠️ Für diesen Job brauchst du Pflicht-Qualifikationen, die du nicht hinterlegt hast.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Hinweis: Jobs außerhalb des Profils (nur im "Alle Jobs" Tab) */}
        {activeTab === 'all' && activeJobs.length > 0 && profile && (() => {
          const jobsOutsideProfile = activeJobs.filter(job => !jobMatchesWorker(job, profile));
          return jobsOutsideProfile.length > 0;
        })() && (
          <View style={{
            padding: spacing.md,
            backgroundColor: '#fef3cd',
            borderRadius: 12,
            borderLeftWidth: 3,
            borderLeftColor: '#f0ad4e',
          }}>
            <Text style={{ color: '#8a6d3b', fontSize: 13, lineHeight: 18 }}>
              💡 Einige Jobs liegen außerhalb deines Profils. Bewirb dich nur, wenn du die Tätigkeit sicher ausführen kannst.
            </Text>
          </View>
        )}

        {/* Info: Akzeptierte Jobs sind unter Matches */}
        {acceptedJobsCount > 0 && (
          <View style={{
            padding: spacing.md,
            backgroundColor: colors.beige100,
            borderRadius: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.black,
          }}>
            <Text style={{ color: colors.black, fontSize: 14, lineHeight: 20 }}>
              🎉 <Text style={{ fontWeight: '700' }}>Du hast {acceptedJobsCount} {acceptedJobsCount === 1 ? 'Match' : 'Matches'}!</Text>
              {'\n'}
              Arbeitgeber haben deine Bewerbungen angenommen. Du findest sie unter{' '}
              <Text
                style={{ fontWeight: '700', textDecorationLine: 'underline' }}
                onPress={() => router.push('/(worker)/matches')}
              >
                Matches
              </Text>.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
