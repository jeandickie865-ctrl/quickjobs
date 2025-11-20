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

  // Alle Jobs im Umkreis - nur Status-Filter, kein Matching
  const allJobsInRadius = useMemo(
    () =>
      profile
        ? jobs
            .filter(j => j.status === 'open')
            // Hier könnte später Radius-Filter hinzugefügt werden
            // .filter(j => jobWithinRadius(j, profile))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        : [],
    [jobs, profile]
  );

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

        {matchingJobs.length === 0 ? (
          <View style={{
            padding: spacing.xl,
            backgroundColor: colors.white,
            borderRadius: 12,
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <Text style={{ color: colors.gray700, fontSize: 16, textAlign: 'center', fontWeight: '600' }}>
              Keine passenden Jobs gefunden
            </Text>
            <Text style={{ color: colors.gray500, fontSize: 14, textAlign: 'center' }}>
              Aktuell gibt es keine Jobs, die zu deinem Profil passen. Schau später wieder vorbei oder passe dein Profil an.
            </Text>
            <Text style={{ color: colors.gray400, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Debug: {allJobsCount} Jobs insgesamt, {openJobsCount} offene Jobs, 0 passende Jobs für dein Profil.
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
            {matchingJobs.map((job) => {
              const hasApplied = appsJobIds.has(job.id);
              
              // Format date/time info using centralized function
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );

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
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 18, color: colors.black }}>
                    {job.title}
                  </Text>
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: colors.gray700, fontSize: 14 }}>
                      📍 {formatAddress(job.address) || 'Adresse nicht angegeben'}
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
                  ) : (
                    <Button
                      title={isApplyingJobId === job.id ? 'Melde dich…' : 'Ich habe Zeit'}
                      onPress={() => handleApply(job.id, job.employerId)}
                      disabled={isApplyingJobId === job.id}
                    />
                  )}
                </View>
              );
            })}
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
