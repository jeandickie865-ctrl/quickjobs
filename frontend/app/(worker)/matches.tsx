import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsForWorker } from '../../utils/applicationStore';
import { getJobs } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { Button } from '../../components/ui/Button';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { formatJobTimeDisplay } from '../../utils/date';
import { isWithinLast24Hours } from '../../utils/stringHelpers';
import { getInitials } from '../../utils/stringHelpers';

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
      console.log('📋 loadMatches: Loading matches for worker', user.id);

      // 1. Alle Bewerbungen des Workers holen
      const apps = await getApplicationsForWorker(user.id);
      console.log('✅ loadMatches: Found applications', apps.length);

      // 2. Nur akzeptierte Bewerbungen
      const acceptedApps = apps.filter((a) => a.status === 'accepted');
      console.log('✅ loadMatches: Accepted applications', acceptedApps.length);

      // 3. Jobs laden
      const allJobs = await getJobs();

      const combined: Match[] = [];

      for (const app of acceptedApps) {
        const job = allJobs.find((j) => j.id === app.jobId);
        if (job) {
          combined.push({ job, application: app });
        } else {
          console.warn('⚠️ loadMatches: Job not found for application', app.jobId);
        }
      }

      // 4. Sort by respondedAt DESC (neueste zuerst)
      combined.sort((a, b) => {
        const dateA = a.application.respondedAt || a.application.createdAt;
        const dateB = b.application.respondedAt || b.application.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      console.log('✅ loadMatches: Matches loaded and sorted', combined.length);
      setMatches(combined);
    } catch (e) {
      console.error('❌ loadMatches: Error loading matches:', e);
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

  if (authLoading) {
    return null;
  }

  if (!user || user.role !== 'worker') {
    return <Redirect href="/start" />;
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.black} />
          <Text style={{ color: colors.gray700, marginTop: spacing.sm }}>
            Lade deine Matches…
          </Text>
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.black}
          />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.black, letterSpacing: -0.5 }}>
              Meine Matches
            </Text>
            <Text
              style={{ color: colors.primary, fontSize: 15, fontWeight: '600', paddingHorizontal: spacing.sm, paddingVertical: 4 }}
              onPress={() => router.push('/(worker)/feed')}
            >
              🔎 Jobs
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.gray500, marginTop: 4 }}>
            {matches.length} {matches.length === 1 ? 'akzeptierte Bewerbung' : 'akzeptierte Bewerbungen'}
          </Text>
        </View>

        {error && (
          <View style={{
            padding: spacing.md,
            backgroundColor: colors.errorLight,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.error,
          }}>
            <Text style={{ color: colors.error, fontSize: 14, fontWeight: '600' }}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {matches.length === 0 ? (
          <View style={{
            padding: spacing.xl,
            backgroundColor: colors.white,
            borderRadius: 12,
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>
              🎯
            </Text>
            <Text style={{ color: colors.black, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
              Noch keine Matches
            </Text>
            <Text style={{ color: colors.gray600, fontSize: 14, textAlign: 'center' }}>
              Sobald ein Arbeitgeber deine Bewerbung annimmt, erscheint der Job hier.
            </Text>
            <Button
              title="Jobs ansehen"
              onPress={() => router.push('/(worker)/feed')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {matches.map(({ job, application }) => {
              // Format time display using centralized function
              const timeDisplay = formatJobTimeDisplay(
                job.startAt,
                job.endAt,
                job.timeMode,
                job.hours,
                job.dueAt
              );

              // Check if match is new (within 24 hours)
              const matchTimestamp = application.respondedAt || application.createdAt;
              const isNew = matchTimestamp && isWithinLast24Hours(matchTimestamp);

              return (
                <View
                  key={application.id}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    padding: spacing.md,
                    gap: spacing.sm,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                    borderLeftWidth: 4,
                    borderLeftColor: isNew ? colors.primary : colors.success,
                  }}
                >
                  {/* Match Badges */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: colors.successLight,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.success,
                    }}>
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>
                        ✓ MATCH BESTÄTIGT
                      </Text>
                    </View>
                    
                    {/* NEU Badge if within 24 hours */}
                    {isNew && (
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: colors.primary,
                        borderRadius: 8,
                      }}>
                        <Text style={{ color: colors.white, fontSize: 11, fontWeight: '800' }}>
                          🆕 NEU
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Job Info */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontWeight: '800', fontSize: 18, color: colors.black }}>
                      {job.title}
                    </Text>
                    <View style={{ gap: 4 }}>
                      {/* Arbeitgeber Info */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: colors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>
                            AG
                          </Text>
                        </View>
                        <Text style={{ color: colors.gray700, fontSize: 14, fontWeight: '600' }}>
                          Arbeitgeber
                        </Text>
                      </View>
                      
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
                  </View>

                  {/* Description */}
                  {job.description && (
                    <Text style={{ color: colors.gray600, fontSize: 13 }} numberOfLines={2}>
                      {job.description}
                    </Text>
                  )}

                  {/* Payment */}
                  <Text style={{ color: colors.black, fontWeight: '700', fontSize: 17 }}>
                    Lohn: {euro(job.workerAmountCents)}
                  </Text>

                  {/* Info Box */}
                  <View style={{
                    padding: spacing.sm,
                    backgroundColor: colors.beige50,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.black,
                  }}>
                    <Text style={{ color: colors.gray700, fontSize: 12, lineHeight: 18 }}>
                      🎉 <Text style={{ fontWeight: '600' }}>Glückwunsch!</Text> Der Arbeitgeber hat dich für diesen Job ausgewählt. 
                      Ihr könnt jetzt Details besprechen.
                    </Text>
                  </View>

                  {/* Chat Button - Prominent */}
                  <Button
                    title="💬 Zum Chat"
                    onPress={() => {
                      console.log('🚀 matches: Opening chat for application', application.id);
                      router.push({
                        pathname: '/chat/[applicationId]',
                        params: { applicationId: application.id },
                      });
                    }}
                    variant="primary"
                  />
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
