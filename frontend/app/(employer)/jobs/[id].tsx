import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { getJobById, deleteJob, updateJob } from '../../../utils/jobStore';
import { getApplicationsForJob, acceptApplication } from '../../../utils/applicationStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { getReviewForJob } from '../../../utils/reviewStore';
import { CostBreakdown } from '../../../components/CostBreakdown';
import { WorkerProfileCard } from '../../../components/WorkerProfileCard';
import { Job } from '../../../types/job';
import { JobApplication } from '../../../types/application';
import { WorkerProfile } from '../../../types/profile';
import { Button } from '../../../components/ui/Button';
import { formatAddress } from '../../../types/address';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Applications
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicants, setApplicants] = useState<{ app: JobApplication; profile: WorkerProfile | null }[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  
  // Review state
  const [hasReview, setHasReview] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

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
        setError('Job nicht gefunden');
      } else if (found.employerId !== user.id) {
        setError('Du kannst nur deine eigenen Jobs ansehen');
      } else {
        setJob(found);
      }
      setLoadingJob(false);
    })();
  }, [id, user, isLoading]);

  // Load applications when job is loaded
  useEffect(() => {
    if (!job || !user) return;

    (async () => {
      setIsLoadingApps(true);
      try {
        console.log('📋 Loading applications for job', job.id);
        const apps = await getApplicationsForJob(job.id);
        console.log('✅ Found applications', apps.length, apps);
        setApplications(apps);
        const withProfiles: { app: JobApplication; profile: WorkerProfile | null }[] = [];
        for (const app of apps) {
          const p = await getWorkerProfile(app.workerId);
          withProfiles.push({ app, profile: p });
        }
        setApplicants(withProfiles);
        console.log('👥 Applicants with profiles loaded', withProfiles.length);
        setAppsError(null);
      } catch (e) {
        console.error('Error loading applicants:', e);
        setAppsError('Bewerber konnten nicht geladen werden.');
      } finally {
        setIsLoadingApps(false);
      }
    })();
  }, [job?.id, user?.id]);

  // Check if review exists for matched worker
  useEffect(() => {
    if (!job || !user || job.status !== 'matched' || !job.matchedWorkerId) {
      setHasReview(false);
      return;
    }

    (async () => {
      setCheckingReview(true);
      try {
        const review = await getReviewForJob(job.id, job.matchedWorkerId!, user.id);
        setHasReview(!!review);
      } catch (error) {
        console.error('Error checking review:', error);
      } finally {
        setCheckingReview(false);
      }
    })();
  }, [job?.id, job?.status, job?.matchedWorkerId, user?.id]);

  async function handleAccept(appId: string) {
    if (!job) return;
    try {
      setIsAcceptingId(appId);
      
      // Find the accepted application to get workerId
      const acceptedApp = applications.find(a => a.id === appId);
      if (!acceptedApp) return;
      
      console.log('✅ Accepting application', { appId, workerId: acceptedApp.workerId, jobId: job.id });
      
      await acceptApplication(job.id, appId);
      await updateJob(job.id, { 
        status: 'matched',
        matchedWorkerId: acceptedApp.workerId  // Set matched worker for chat
      });
      
      // Reload job to reflect changes
      const updatedJob = await getJobById(job.id);
      if (updatedJob) setJob(updatedJob);
      
      // Reload applications
      const apps = await getApplicationsForJob(job.id);
      setApplications(apps);
      const withProfiles: { app: JobApplication; profile: WorkerProfile | null }[] = [];
      for (const app of apps) {
        const p = await getWorkerProfile(app.workerId);
        withProfiles.push({ app, profile: p });
      }
      setApplicants(withProfiles);
      
      // Update local job status
      setJob(prev => (prev ? { ...prev, status: 'matched' } : prev));
      setAppsError(null);
    } catch (e) {
      console.error('Error accepting applicant:', e);
      setAppsError('Kandidat konnte nicht ausgewählt werden.');
    } finally {
      setIsAcceptingId(null);
    }
  }

  async function handleDelete() {
    if (!job) return;
    Alert.alert(
      'Job löschen',
      'Möchtest du diesen Job wirklich löschen?',
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
              setError('Job konnte nicht gelöscht werden.');
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
            {error ?? 'Job nicht gefunden'}
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
              📍 {formatAddress(job.address) || 'Adresse nicht angegeben'}
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
          
          {/* Provision-Hinweis bei Match */}
          {job.status === 'matched' && (
            <View style={{
              backgroundColor: colors.beige50,
              borderRadius: 8,
              padding: spacing.sm,
              borderLeftWidth: 3,
              borderLeftColor: colors.black,
            }}>
              <Text style={{ color: colors.gray700, fontSize: 12, lineHeight: 18 }}>
                💡 <Text style={{ fontWeight: '600' }}>Hinweis:</Text> Für diesen Job wurde ein Match gefunden. 
                Die Plattformgebühr von 20 % ist jetzt fällig.
              </Text>
            </View>
          )}

          {/* Bewertungs-Button */}
          {job.status === 'matched' && job.matchedWorkerId && !hasReview && !checkingReview && (
            <Button
              title="⭐ Job abschließen & bewerten"
              onPress={() => {
                router.push({
                  pathname: '/(employer)/jobs/rate',
                  params: {
                    jobId: job.id,
                    workerId: job.matchedWorkerId!,
                  },
                });
              }}
              variant="secondary"
            />
          )}

          {/* Bewertung bereits abgegeben */}
          {job.status === 'matched' && hasReview && (
            <View style={{
              backgroundColor: colors.beige100,
              borderRadius: 8,
              padding: spacing.sm,
              borderLeftWidth: 3,
              borderLeftColor: colors.black,
            }}>
              <Text style={{ color: colors.gray700, fontSize: 12, lineHeight: 18 }}>
                ✅ Du hast diese Arbeitskraft bereits bewertet.
              </Text>
            </View>
          )}
          
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

        {/* Bewerber / Matches */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: spacing.md,
          gap: 12
        }}>
          <Text style={{ fontWeight: '700', color: colors.black, fontSize: 16 }}>
            Bewerber / Matches
          </Text>

          {isLoadingApps ? (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
              <ActivityIndicator color={colors.black} />
              <Text style={{ color: colors.gray600, fontSize: 14, marginTop: 8 }}>
                Lade Bewerber…
              </Text>
            </View>
          ) : appsError ? (
            <Text style={{ color: '#c00', fontSize: 14 }}>
              {appsError}
            </Text>
          ) : applicants.length === 0 ? (
            <Text style={{ color: colors.gray500, fontSize: 14 }}>
              Noch keine Bewerbungen.
            </Text>
          ) : (
            <View style={{ gap: 12 }}>
              {applicants.map(({ app, profile }) => {
                const isAccepted = app.status === 'accepted';
                const statusLabel =
                  app.status === 'pending' ? 'Offen' :
                  app.status === 'accepted' ? 'Ausgewählt' :
                  app.status === 'rejected' ? 'Abgelehnt' :
                  'Storniert';

                return (
                  <View key={app.id} style={{ gap: 8 }}>
                    {/* Status Badge */}
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: isAccepted ? colors.beige100 : colors.gray100,
                      borderRadius: 6,
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{ color: colors.black, fontSize: 12, fontWeight: '600' }}>
                        Status: {statusLabel}
                      </Text>
                    </View>

                    {/* Worker Profile Card - zeigt eingeschränkte Infos vor Match */}
                    {profile ? (
                      <WorkerProfileCard 
                        profile={profile} 
                        isMatched={isAccepted}
                      />
                    ) : (
                      <Text style={{ color: colors.gray500, fontSize: 14 }}>
                        Profil konnte nicht geladen werden.
                      </Text>
                    )}

                    {/* Action Buttons */}
                    {app.status === 'pending' && job.status === 'open' && (
                      <Button
                        title={isAcceptingId === app.id ? 'Wähle…' : 'Kandidat auswählen'}
                        onPress={() => handleAccept(app.id)}
                        disabled={isAcceptingId === app.id}
                        variant="secondary"
                      />
                    )}

                    {isAccepted && (
                      <View style={{ gap: spacing.sm }}>
                        <View style={{
                          padding: spacing.sm,
                          backgroundColor: colors.beige100,
                          borderRadius: 6,
                        }}>
                          <Text style={{ color: colors.black, fontWeight: '700', fontSize: 14 }}>
                            ✓ Dieser Kandidat ist ausgewählt. Kontaktdaten sind freigeschaltet.
                          </Text>
                        </View>
                        
                        <Button
                          title="💬 Chat öffnen"
                          variant="secondary"
                          onPress={() =>
                            router.push({
                              pathname: '/chat/[applicationId]',
                              params: { applicationId: app.id },
                            })
                          }
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            title={isDeleting ? 'Lösche…' : 'Job löschen'}
            onPress={handleDelete}
            disabled={isDeleting}
            variant="ghost"
          />
          <Button
            title="Zurück zur Übersicht"
            variant="secondary"
            onPress={() => router.replace('/(employer)')}
          />
          <Button
            title="Logout"
            variant="ghost"
            onPress={async () => {
              await signOut();
              router.replace('/auth/start');
            }}
          />
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
