// app/(worker)/matches.tsx - VIVID BLUE-PURPLE & NEON LIME
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsForWorker } from '../../utils/applicationStore';
import { getJobs } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';
import { isWithinLast24Hours } from '../../utils/stringHelpers';

type Match = {
  job: Job;
  application: JobApplication;
};

export default function WorkerMatchesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    if (!user) return;

    try {
      setError(null);

      const apps = await getApplicationsForWorker(user.id);
      const acceptedApps = apps.filter((a) => a.status === 'accepted');
      const allJobs = await getJobs();

      const combined: Match[] = [];

      for (const app of acceptedApps) {
        const job = allJobs.find((j) => j.id === app.jobId);
        if (job) {
          combined.push({ job, application: app });
        }
      }

      combined.sort((a, b) => {
        const dateA = a.application.respondedAt || a.application.createdAt;
        const dateB = b.application.respondedAt || b.application.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setMatches(combined);
    } catch (e) {
      console.error('Error loading matches:', e);
      setError('Matches konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadMatches();
    }
  }, [user, authLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primaryUltraLight }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryUltraLight }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black }}>
            Meine Matches
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray600, marginTop: 4 }}>
            {matches.length} {matches.length === 1 ? 'Auftrag' : 'Aufträge'}
          </Text>
        </View>

        {error && (
          <Card>
            <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text>
          </Card>
        )}

        {matches.length === 0 ? (
          <Card padding={spacing.xl}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.black, textAlign: 'center', marginBottom: 8 }}>
              Noch keine Matches
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray600, textAlign: 'center' }}>
              Bewirb dich auf Aufträge im Feed, um hier deine Matches zu sehen.
            </Text>
          </Card>
        ) : (
          matches.map(({ job, application }) => {
            const isNew = application.respondedAt && isWithinLast24Hours(application.respondedAt);

            return (
              <Pressable
                key={job.id}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[applicationId]',
                    params: { applicationId: application.id },
                  })
                }
              >
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.black, flex: 1 }}>
                      {job.title}
                    </Text>
                    {isNew && (
                      <View style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}>
                        <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>NEU</Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 14, color: colors.gray600, marginBottom: spacing.xs }}>
                    {job.category}
                  </Text>

                  <Text style={{ fontSize: 13, color: colors.gray600, marginBottom: spacing.xs }}>
                    📍 {formatAddress(job.address)}
                  </Text>

                  <Text style={{ fontSize: 13, color: colors.gray600, marginBottom: spacing.md }}>
                    {formatJobTimeDisplay(job)}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                      {euro(job.workerAmountCents)}
                    </Text>
                    <Button
                      title="Zum Chat"
                      onPress={() =>
                        router.push({
                          pathname: '/chat/[applicationId]',
                          params: { applicationId: application.id },
                        })
                      }
                      style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
