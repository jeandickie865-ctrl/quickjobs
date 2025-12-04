import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerApplications } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { Button } from '../../components/ui/Button';
import { formatAddress } from '../../types/address';
import { euro } from '../../utils/pricing';
import { API_URL } from '../../config';
import { getAuthHeaders } from '../../utils/api';

type ApplicationWithJob = {
  app: JobApplication;
  job: Job | null;
};

export default function WorkerApplicationsScreen() {
  const { colors, spacing } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadApplications = async (silent = false) => {
    if (!user) return;

    // Don't show loading spinner on auto-refresh
    if (!silent) {
      setLoading(true);
    }

    try {
      setError(null);
      const apps = await getWorkerApplications();
      
      // WICHTIG: Nur pending und rejected Applications zeigen
      // Accepted gehören in den "Matches" Tab!
      const pendingAndRejectedApps = apps.filter(app => 
        app.status === 'pending' || app.status === 'rejected'
      );
      
      // Performance: Alle Jobs parallel laden
      const jobs = await Promise.all(
        pendingAndRejectedApps.map(app => 
          getJobById(app.jobId).catch(() => null)
        )
      );
      
      const result: ApplicationWithJob[] = pendingAndRejectedApps.map((app, index) => ({
        app,
        job: jobs[index]
      }));
      
      // Neuste Bewerbungen oben
      result.sort((a, b) => b.app.createdAt.localeCompare(a.app.createdAt));
      setItems(result);
    } catch (e) {
      console.error('Worker applications load error:', e);
      if (!silent) {
        setError('Bewerbungen konnten nicht geladen werden. Bitte versuche es erneut.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Setup auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Load data immediately
      if (user) {
        loadApplications();
      }

      // Start auto-refresh interval (15 seconds - optimiert für Performance)
      intervalRef.current = setInterval(() => {
        if (user) {
          loadApplications(true); // Silent refresh
        }
      }, 15000);

      // Cleanup on unfocus
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [user])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#0E0B1F' }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#C8FF16" />
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#0E0B1F' }]} edges={['top','bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { padding: spacing.md, paddingBottom: spacing.xl }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>
            Meine Bewerbungen
          </Text>
          <Text style={[styles.subtitle, { color: '#A0A0A0', marginTop: 4 }]}>
            Alle Aufträge, für die du dich gemeldet hast
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#C8FF16" />
            <Text style={[styles.loadingText, { color: '#A0A0A0', marginTop: spacing.sm }]}>
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
                backgroundColor: '#141126',
                borderColor: '#FF4D4D',
                padding: spacing.md,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: '#FF4D4D' }]}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && !error && (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: '#141126',
                borderColor: 'rgba(255,255,255,0.08)',
                padding: spacing.xl,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: '#FFFFFF' }]}>
              Noch keine Bewerbungen
            </Text>
            <Text style={[styles.emptyText, { color: '#A0A0A0', marginTop: spacing.xs }]}>
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
                  backgroundColor: '#141126',
                  borderColor: isMatched ? '#C8FF16' : 'rgba(255,255,255,0.08)',
                  borderWidth: isMatched ? 2 : 1,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {/* Auftrag Title */}
              <Text style={[styles.jobTitle, { color: '#FFFFFF' }]}>
                {title}
              </Text>

              {/* Auftrag Details */}
              <View style={{ gap: 4, marginTop: spacing.xs }}>
                {!!category && (
                  <Text style={[styles.jobDetail, { color: '#A0A0A0' }]}>
                    {category}
                  </Text>
                )}
                {!!address && (
                  <Text style={[styles.jobDetail, { color: '#A0A0A0' }]}>
                    {address}
                  </Text>
                )}
                {!!workerAmount && (
                  <Text style={[styles.jobDetail, { color: '#A0A0A0' }]}>
                    {workerAmount}
                  </Text>
                )}
              </View>

              {/* Status Section */}
              <View
                style={[
                  styles.statusContainer,
                  {
                    backgroundColor: '#0E0B1F',
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: '#A0A0A0' }]}>
                    Status:
                  </Text>
                  <Text style={[styles.statusValue, { color: statusColor === colors.black ? '#C8FF16' : statusColor, fontWeight: '700' }]}>
                    {statusLabel}
                  </Text>
                </View>
                {!!jobStatusLabel && (
                  <Text style={[styles.jobStatusText, { color: '#888' }]}>
                    Job: {jobStatusLabel}
                  </Text>
                )}
                <Text style={[styles.dateText, { color: '#888' }]}>
                  Beworben am {formatDate(app.createdAt)}
                </Text>
              </View>

              {/* Löschen-Button für abgelehnte Bewerbungen */}
              {app.status === 'rejected' && (
                <Pressable
                  onPress={async (e) => {
                    e.stopPropagation();
                    try {
                      const headers = { 'Content-Type': 'application/json' };
                      const token = await AsyncStorage.getItem('token');
                      if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                      }
                      await fetch(`/api/applications/${app.id}`, {
                        method: 'DELETE',
                        headers,
                      });
                      // Aus Liste entfernen
                      setItems(items.filter(item => item.app.id !== app.id));
                    } catch (err) {
                      console.error('Delete error:', err);
                    }
                  }}
                  style={({ pressed }) => ({
                    marginTop: spacing.sm,
                    backgroundColor: pressed ? '#e00' : '#c00',
                    padding: spacing.sm,
                    borderRadius: 8,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    🗑️ Bewerbung löschen
                  </Text>
                </Pressable>
              )}

              {/* Matched Info */}
              {isMatched && (
                <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                  <View
                    style={[
                      styles.matchedInfo,
                      {
                        backgroundColor: 'rgba(200,255,22,0.1)',
                        borderLeftColor: '#C8FF16',
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.matchedText, { color: '#C8FF16' }]}>
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
                  <Text style={[styles.pendingText, { color: '#A0A0A0' }]}>
                    Deine Bewerbung wird geprüft.
                  </Text>
                </View>
              )}

              {/* Action Button */}
              {job && (
                <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
                  <View style={{ width: '60%', maxWidth: 300, minWidth: 220 }}>
                    <Button
                      title="Jobdetails ansehen"
                      variant="primary"
                      onPress={() => router.push(`/(worker)/jobs/${job.id}`)}
                      style={{ backgroundColor: '#C8FF16' }}
                      textStyle={{ color: '#000000', fontWeight: '700' }}
                    />
                  </View>
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
