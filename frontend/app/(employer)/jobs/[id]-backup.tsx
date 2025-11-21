import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { getJobById, deleteJob, updateAuftrag } from '../../../utils/jobStore';
import { getApplicationsForJob, acceptApplication } from '../../../utils/applicationStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { CostBreakdown } from '../../../components/CostBreakdown';
import { Auftrag } from '../../../types/job';
import { JobApplication } from '../../../types/application';
import { WorkerProfile } from '../../../types/profile';
import { Button } from '../../../components/ui/Button';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Auftrag | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Applications
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicants, setApplicants] = useState<{ app: JobApplication; profile: WorkerProfile | null }[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;
    
    (async () => {
      if (!id) {
        setError('Job-ID fehlt');
        setLoadingJob(false);
        return;
      }
      const found = await getJobById(String(id));
      if (!found) {
        setError('Auftrag nicht gefunden');
      } else if (found.employerId !== user.id) {
        setError('Du kannst nur deine eigenen Aufträge ansehen');
      } else {
        setJob(found);
      }
      setLoadingJob(false);
    })();
  }, [id, user, isLoading]);

  async function handleDelete() {
    if (!job) return;
    Alert.alert(
      'Auftrag löschen',
      'Möchtest du diesen Auftrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteJob(job.id);
              router.replace('/(employer)');
            } catch (e) {
              setError('Auftrag konnte nicht gelöscht werden.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  }

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== 'employer') {
    return <Redirect href="/start" />;
  }

  if (loadingJob) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.gray700 }}>Lädt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md, gap: spacing.md }}>
          <Text style={{ color: colors.black, fontSize: 16, textAlign: 'center' }}>
            {error ?? 'Auftrag nicht gefunden'}
          </Text>
          <Button title="Zurück" onPress={() => router.replace('/(employer)')} />
        </View>
      </SafeAreaView>
    );
  }

  // Hilfstexte für Anzeige
  const timeModeLabel =
    job.timeMode === 'fixed_time'
      ? 'Zeitgenau'
      : job.timeMode === 'hour_package'
      ? 'Stundenpaket'
      : 'Projekt';
  
  const statusLabel = 
    job.status === 'open' ? 'Offen' : 
    job.status === 'matched' ? 'Vergeben' :
    job.status === 'done' ? 'Erledigt' :
    job.status === 'canceled' ? 'Abgesagt' : 
    job.status;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        {/* Header */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.black }}>
            {job.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: job.status === 'open' ? colors.beige100 : colors.gray200,
              borderRadius: 6
            }}>
              <Text style={{ color: colors.black, fontSize: 12, fontWeight: '600' }}>
                {statusLabel}
              </Text>
            </View>
            <Text style={{ color: colors.gray600, fontSize: 14 }}>
              • {timeModeLabel}
            </Text>
          </View>
        </View>

        {/* Kategorie & Adresse */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          gap: 8
        }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: '600', color: colors.gray600, fontSize: 12 }}>
              KATEGORIE
            </Text>
            <Text style={{ color: colors.black, fontSize: 16 }}>
              {job.category}
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: '600', color: colors.gray600, fontSize: 12 }}>
              STANDORT
            </Text>
            <Text style={{ color: colors.black, fontSize: 16 }}>
              📍 {job.address}
            </Text>
          </View>
        </View>

        {/* Beschreibung */}
        {job.description && (
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: spacing.md,
            gap: 6
          }}>
            <Text style={{ fontWeight: '700', color: colors.black, fontSize: 16 }}>
              Beschreibung
            </Text>
            <Text style={{ color: colors.gray700, lineHeight: 20 }}>
              {job.description}
            </Text>
          </View>
        )}

        {/* Anforderungen */}
        {(job.required_all_tags.length > 0 || job.required_any_tags.length > 0) && (
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: spacing.md,
            gap: 12
          }}>
            <Text style={{ fontWeight: '700', color: colors.black, fontSize: 16 }}>
              Anforderungen
            </Text>
            
            {job.required_all_tags.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontWeight: '600', color: colors.gray600, fontSize: 12 }}>
                  PFLICHT-TAGS
                </Text>
                <Text style={{ color: colors.gray700 }}>
                  {job.required_all_tags.join(', ')}
                </Text>
              </View>
            )}
            
            {job.required_any_tags.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontWeight: '600', color: colors.gray600, fontSize: 12 }}>
                  AKZEPTIERTE FAHRZEUGE
                </Text>
                <Text style={{ color: colors.gray700 }}>
                  {job.required_any_tags.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Vergütung */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          gap: 12
        }}>
          <Text style={{ fontWeight: '700', color: colors.black, fontSize: 16 }}>
            Vergütung
          </Text>
          <CostBreakdown workerAmountCents={job.workerAmountCents} />
          <View style={{ gap: 4, marginTop: 4 }}>
            <Text style={{ fontWeight: '600', color: colors.gray600, fontSize: 12 }}>
              ZAHLUNG AN ARBEITNEHMER
            </Text>
            <Text style={{ color: colors.gray700 }}>
              {job.paymentToWorker === 'cash' ? '💵 Bar' : 
               job.paymentToWorker === 'bank' ? '🏦 Überweisung' : 
               '💳 PayPal'}
            </Text>
          </View>
        </View>

        {/* Bewerber / Matches Placeholder */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          gap: 6
        }}>
          <Text style={{ fontWeight: '700', color: colors.black, fontSize: 16 }}>
            Bewerber / Matches
          </Text>
          <Text style={{ color: colors.gray500, fontSize: 14 }}>
            Das Matching und Bewerbungen werden im nächsten Schritt implementiert. 
            Aktuell gibt es hier noch keine Liste.
          </Text>
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            title={isDeleting ? 'Lösche…' : 'Auftrag löschen'}
            onPress={handleDelete}
            disabled={isDeleting}
            variant="ghost"
          />
          <Button
            title="Zurück zur Übersicht"
            variant="secondary"
            onPress={() => router.replace('/(employer)')}
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
