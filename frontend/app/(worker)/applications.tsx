import React, { useEffect, useState, useRef } from 'react';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { Redirect, useRouter, useFocusEffect } from 'expo-router';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { useTheme } from '../../theme/ThemeProvider';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getWorkerApplications } from '../../utils/applicationStore';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getJobById } from '../../utils/jobStore';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { Job } from '../../types/job';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { JobApplication } from '../../types/application';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { Button } from '../../components/ui/Button';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { formatAddress } from '../../types/address';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { euro } from '../../utils/pricing';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { API_URL } from '../../config';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getAuthHeaders } from '../../utils/api';
import { ArrowDoodle } from '../../components/ArrowDoodle';

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
      // Race Condition verhindern: nur starten, wenn noch kein Interval läuft
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (user) {
            loadApplications(true); // Silent refresh
          }
        }, 15000);
      }

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
      <SafeAreaView style={[styles.container, { backgroundColor: '#00A07C' }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#EFABFF" />
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#00A07C' }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { padding: spacing.md, paddingBottom: 200 }
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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
            <ActivityIndicator size="large" color="#EFABFF" />
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
                backgroundColor: '#00A07C',
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
                backgroundColor: '#00A07C',
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
                  router.push(`/(worker)/alljobs/${job.id}`);
                }
              }}
              style={({ pressed }) => [
                styles.applicationCard,
                {
                  backgroundColor: '#00A07C',
                  borderColor: isMatched ? '#EFABFF' : 'rgba(255,255,255,0.08)',
                  borderWidth: isMatched ? 2 : 1,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.9 : 1,
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
                    backgroundColor: '#00A07C',
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: '#A0A0A0' }]}>
                    Status:
                  </Text>
                  <Text style={[styles.statusValue, { color: statusColor === colors.black ? '#EFABFF' : statusColor, fontWeight: '700' }]}>
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
                      const headers = await getAuthHeaders();
                      const response = await fetch(`${API_URL}/applications/${app.id}`, {
                        method: 'DELETE',
                        headers,
                      });
                      
                      if (!response.ok) {
                        throw new Error('Löschen fehlgeschlagen');
                      }
                      
                      // Aus Liste entfernen und neu laden
                      setItems(items.filter(item => item.app.id !== app.id));
                      loadApplications(true);
                    } catch (err) {
                      console.error('Delete error:', err);
                      alert('Fehler beim Löschen der Bewerbung. Bitte versuche es erneut.');
                    }
                  }}
                  style={({ pressed }) => ({
                    marginTop: spacing.md,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: pressed ? 'rgba(255,77,77,0.5)' : 'rgba(255,77,77,0.3)',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    alignItems: 'center',
                    alignSelf: 'center',
                    width: '60%',
                    maxWidth: 240,
                  })}
                >
                  <Text style={{ color: 'rgba(255,77,77,0.8)', fontWeight: '600', fontSize: 14 }}>
                    Bewerbung entfernen
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
                        borderLeftColor: '#EFABFF',
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[styles.matchedText, { color: '#EFABFF' }]}>
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
                    style={{ backgroundColor: '#EFABFF' }}
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
                  <View style={{ width: '100%', maxWidth: 360 }}>
                    <Button
                      title="Jobdetails ansehen"
                      variant="primary"
                      onPress={() => router.push(`/(worker)/alljobs/${job.id}`)}
                      style={{ backgroundColor: '#EFABFF' }}
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
