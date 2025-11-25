import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsForWorker } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { Auftrag } from '../../types/job';
import { JobApplication } from '../../types/application';
import { Button } from '../../components/ui/Button';
import { formatAddress } from '../../types/address';
import { euro } from '../../utils/pricing';

type ApplicationWithAuftrag = {
  app: JobApplication;
  job: Auftrag | null;
};

export default function WorkerApplicationsScreen() {
  const { colors, spacing } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const apps = await getApplicationsForWorker(user.id);
        
        // WICHTIG: Nur pending und rejected Applications zeigen
        // Accepted gehören in den "Matches" Tab!
        const pendingAndRejectedApps = apps.filter(app => 
          app.status === 'pending' || app.status === 'rejected'
        );
        
        const result: ApplicationWithJob[] = [];
        for (const app of pendingAndRejectedApps) {
          const job = await getJobById(app.jobId);
          result.push({ app, job });
        }
        // Neuste Bewerbungen oben
        result.sort((a, b) => b.app.createdAt.localeCompare(a.app.createdAt));
        setItems(result);
      } catch (e) {
        console.log('Worker applications load error', e);
        setError('Bewerbungen konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== 'worker') {
    return <Redirect href="/start" />;
  }

  const getStatusLabel = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'Offen';
      case 'accepted':
        return 'Ausgewählt ✓';
      case 'rejected':
        return 'Abgelehnt';
      case 'canceled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'accepted':
        return colors.black;
      case 'rejected':
        return '#c00';
      case 'canceled':
        return colors.gray500;
      default:
        return colors.gray700;
    }
  };

  const getJobStatusLabel = (jobStatus?: Job['status']) => {
    switch (jobStatus) {
      case 'open':
        return 'Noch offen';
      case 'matched':
        return 'Gematcht';
      case 'closed':
        return 'Geschlossen';
      default:
        return jobStatus ?? '';
    }
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.beige50 }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { padding: spacing.md, paddingBottom: spacing.xl }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Text style={[styles.title, { color: colors.black }]}>
            Meine Bewerbungen
          </Text>
          <Text style={[styles.subtitle, { color: colors.gray700, marginTop: 4 }]}>
            Alle Aufträge, für die du dich gemeldet hast
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.black} />
            <Text style={[styles.loadingText, { color: colors.gray700, marginTop: spacing.sm }]}>
              Lade Bewerbungen…
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View
            style={[
              styles.errorContainer,
              {
                backgroundColor: '#fee',
                borderColor: '#fcc',
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && !error && (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: colors.white,
                borderColor: colors.gray200,
                padding: spacing.xl,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.black }]}>
              Noch keine Bewerbungen
            </Text>
            <Text style={[styles.emptyText, { color: colors.gray600, marginTop: spacing.xs }]}>
              Du hast dich bisher für keine Aufträge gemeldet.{'\n'}
              Schau im Feed nach passenden Aufträge!
            </Text>
            <Button
              title="Aufträge ansehen"
              onPress={() => router.push('/(worker)/feed')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {/* Applications List */}
        {!loading && items.map(({ app, job }) => {
          const statusLabel = getStatusLabel(app.status);
          const statusColor = getStatusColor(app.status);
          const jobStatusLabel = getJobStatusLabel(job?.status);
          const title = job?.title ?? 'Auftrag nicht mehr verfügbar';
          const address = job?.address ? formatAddress(job.address) : 'Adresse nicht verfügbar';
          const category = job?.category ?? '';
          const workerAmount = job?.workerAmountCents ? euro(job.workerAmountCents) : '';

          const isMatched = app.status === 'accepted';
          const isPending = app.status === 'pending';

          return (
            <Pressable
              key={app.id}
              onPress={() => {
                if (job?.id) {
                  // Navigate to job details screen (we need to create this route for workers)
                  router.push(`/(worker)/jobs/${job.id}`);
                }
              }}
              style={({ pressed }) => [
                styles.applicationCard,
                {
                  backgroundColor: colors.white,
                  borderColor: isMatched ? colors.black : colors.gray200,
                  borderWidth: isMatched ? 2 : 1,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {/* Auftrag Title */}
              <Text style={[styles.jobTitle, { color: colors.black }]}>
                {title}
              </Text>

              {/* Auftrag Details */}
              <View style={{ gap: 4, marginTop: spacing.xs }}>
                {!!category && (
                  <Text style={[styles.jobDetail, { color: colors.gray700 }]}>
                    🏷️ {category}
                  </Text>
                )}
                {!!address && (
                  <Text style={[styles.jobDetail, { color: colors.gray700 }]}>
                    📍 {address}
                  </Text>
                )}
                {!!workerAmount && (
                  <Text style={[styles.jobDetail, { color: colors.gray700 }]}>
                    💰 {workerAmount}
                  </Text>
                )}
              </View>

              {/* Status Section */}
              <View
                style={[
                  styles.statusContainer,
                  {
                    backgroundColor: colors.beige50,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: colors.gray600 }]}>
                    Status:
                  </Text>
                  <Text style={[styles.statusValue, { color: statusColor, fontWeight: '700' }]}>
                    {statusLabel}
                  </Text>
                </View>
                {!!jobStatusLabel && (
                  <Text style={[styles.jobStatusText, { color: colors.gray500 }]}>
                    Job: {jobStatusLabel}
                  </Text>
                )}
                <Text style={[styles.dateText, { color: colors.gray500 }]}>
                  Beworben am {formatDate(app.createdAt)}
                </Text>
              </View>

              {/* Matched Info */}
              {isMatched && (
                <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                  <View
                    style={[
                      styles.matchedInfo,
                      {
                        backgroundColor: colors.beige100,
                        borderLeftColor: colors.black,
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.matchedText, { color: colors.black }]}>
                      ✓ Du wurdest ausgewählt!{'\n'}
                      Nutze den Chat, um Details zu besprechen.
                    </Text>
                  </View>
                  
                  <Button
                    title="💬 Chat mit Auftraggeber"
                    variant="primary"
                    onPress={() =>
                      router.push({
                        pathname: '/chat/[applicationId]',
                        params: { applicationId: app.id },
                      })
                    }
                    style={{ backgroundColor: '#C8FF16' }}
                    textStyle={{ color: '#000000', fontWeight: '700' }}
                  />
                </View>
              )}

              {/* Pending Info */}
              {isPending && job?.status === 'open' && (
                <View style={{ marginTop: spacing.xs }}>
                  <Text style={[styles.pendingText, { color: colors.gray600 }]}>
                    Deine Bewerbung wird geprüft.
                  </Text>
                </View>
              )}

              {/* Action Button */}
              {job && (
                <View style={{ marginTop: spacing.sm }}>
                  <Button
                    title="📄 Jobdetails ansehen"
                    variant="primary"
                    onPress={() => router.push(`/(worker)/jobs/${job.id}`)}
                    style={{ backgroundColor: '#5941FF' }}
                    textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  emptyContainer: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  applicationCard: {
    borderRadius: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  jobDetail: {
    fontSize: 13,
  },
  statusContainer: {
    borderRadius: 8,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 12,
  },
  jobStatusText: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
  },
  matchedInfo: {
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  matchedText: {
    fontSize: 12,
    lineHeight: 18,
  },
  pendingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
