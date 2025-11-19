import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile } from '../../utils/profileStore';
import { getJobs } from '../../utils/jobStore';
import { addApplication, getApplicationsForWorker } from '../../utils/applicationStore';
import { jobMatchesWorker } from '../../utils/matching';
import { Job } from '../../types/job';
import { WorkerProfile } from '../../types/profile';
import { Button } from '../../components/ui/Button';
import { euro } from '../../utils/pricing';

export default function WorkerFeed() {
  const { colors, spacing } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appsJobIds, setAppsJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingJobId, setIsApplyingJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Debug counters
  const [allJobsCount, setAllJobsCount] = useState(0);
  const [openJobsCount, setOpenJobsCount] = useState(0);

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

      const applications = await getApplicationsForWorker(user.id);
      const jobIdsSet = new Set(applications.map(app => app.jobId));
      setAppsJobIds(jobIdsSet);

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

  async function handleApply(jobId: string) {
    if (!profile || !user) return;
    try {
      setIsApplyingJobId(jobId);
      await addApplication(jobId, user.id);
      const updated = new Set(appsJobIds);
      updated.add(jobId);
      setAppsJobIds(updated);
      setError(null);
    } catch (e) {
      console.error('Error applying:', e);
      setError('Bewerbung konnte nicht gespeichert werden.');
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black }}>
            Jobs für dich
          </Text>
          <Text
            style={{ color: colors.gray600, fontSize: 14, textDecorationLine: 'underline' }}
            onPress={() => router.push('/(worker)/profile')}
          >
            ⚙️ Profil
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
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {matchingJobs.map((job) => {
              const hasApplied = appsJobIds.has(job.id);
              const timeModeLabel =
                job.timeMode === 'fixed_time'
                  ? 'Zeitgenau'
                  : job.timeMode === 'hour_package'
                  ? 'Stundenpaket'
                  : 'Projekt';

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
                      📍 {job.address}
                    </Text>
                    <Text style={{ color: colors.gray700, fontSize: 14 }}>
                      🏷️ {job.category}
                    </Text>
                    <Text style={{ color: colors.gray700, fontSize: 14 }}>
                      ⏱️ {timeModeLabel}
                    </Text>
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
                      onPress={() => handleApply(job.id)}
                      disabled={isApplyingJobId === job.id}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
