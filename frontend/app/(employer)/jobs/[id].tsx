// app/(employer)/jobs/[id].tsx - BACKUP DARK DESIGN
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getJobById, deleteJob } from '../../../utils/jobStore';
import { getApplicationsForJob } from '../../../utils/applicationStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { getReviewsForEmployer, getReviewsForWorker, calculateAverageRating } from '../../../utils/reviewStore';
import { Job } from '../../../types/job';
import { JobApplication } from '../../../types/application';
import { WorkerProfile } from '../../../types/profile';
import { formatAddress } from '../../../types/address';
import { getInitials } from '../../../utils/stringHelpers';
import { euro } from '../../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';
import { RatingDisplay } from '../../../components/RatingDisplay';
import { WorkerProfileEmployerView } from '../../../components/WorkerProfileEmployerView';

const COLORS = {
  bg: '#00A07C',
  card: '#FFFFFF',
  border: 'rgba(255,255,255,0.25)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.85)',
  purple: '#EFABFF',
  neon: '#EFABFF',
  error: '#E64A4A',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicants, setApplicants] = useState<{
    app: JobApplication;
    profile: WorkerProfile | null;
    avgRating: number;
    reviewCount: number;
  }[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  const [hasReview, setHasReview] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState<{
    workerId: string;
    applicationId: string;
  } | null>(null);

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

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const loadApplications = async (silent = false) => {
    if (!job || !user) return;

    if (!silent) {
      setIsLoadingApps(true);
    }

    try {
      const apps = await getApplicationsForJob(job.id);
      setApplications(apps);
      const withProfiles = await Promise.all(
        apps.map(async app => {
          const p = await getWorkerProfile(app.workerId);
          const reviews = await getReviewsForWorker(app.workerId);
          const avgRating = calculateAverageRating(reviews);
          return {
            app,
            profile: p,
            avgRating,
            reviewCount: reviews.length
          };
        })
      );
      setApplicants(withProfiles);
    } catch (e) {
      console.error('Error loading applicants:', e);
    } finally {
      if (!silent) {
        setIsLoadingApps(false);
      }
    }
  };

  useEffect(() => {
    if (!job || !user) return;

    loadApplications();

    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      loadApplications(true);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [job?.id, user?.id]);

  useEffect(() => {
    if (!job || !user || job.status !== 'matched' || !job.matchedWorkerId) {
      setHasReview(false);
      return;
    }
    (async () => {
      const reviews = await getReviewsForEmployer(job.employerId);
      setHasReview(reviews.length > 0);
    })();
  }, [job?.id, job?.status, job?.matchedWorkerId, user?.id]);

  async function handleAcceptApplication(appId: string, workerId: string, workerName: string) {
    if (!job || !user) {
      console.error('handleAcceptApplication: Missing job or user');
      return;
    }

    console.log('handleAcceptApplication:');
    console.log('   - Application ID:', appId);
    console.log('   - Worker ID:', workerId);
    console.log('   - Worker Name:', workerName);
    console.log('Navigating to /payment/' + appId);

    router.push(`/payment/${appId}`);
  }

  function handleDelete() {
    if (!job) return;

    Alert.alert(
      'Auftrag löschen',
      'Auftrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteJob(job.id);
              console.log('Auftrag gelöscht');
              router.replace('/(employer)');
            } catch (e) {
              console.error('Fehler: Auftrag konnte nicht gelöscht werden.', e);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (isLoading) return null;

  if (!user || user.role !== 'employer') {
    return <Redirect href="/start" />;
  }

  if (loadingJob) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 24 }}>
            {error ?? 'Auftrag nicht gefunden'}
          </Text>
          <Pressable
            onPress={() => router.replace('/(employer)')}
            style={{
              backgroundColor: COLORS.purple,
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 16,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
              Zurück
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const statusLabel =
    job.status === 'open'
      ? 'Offen'
      : job.status === 'matched'
      ? 'Vergeben'
      : job.status === 'done'
      ? 'Erledigt'
      : job.status === 'canceled'
      ? 'Abgesagt'
      : job.status;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            Job-Details
          </Text>
          <Pressable onPress={handleDelete} disabled={isDeleting}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 200 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Job Header Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: COLORS.white,
              marginBottom: 12,
            }}
          >
            {job.title}
          </Text>

          {/* Kategorie Badge */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: COLORS.neon,
              borderRadius: 10,
              alignSelf: 'flex-start',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#000' }}>
              {job.category}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor:
                job.status === 'open'
                  ? 'rgba(107,75,255,0.2)'
                  : 'rgba(200,255,22,0.2)',
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: job.status === 'open' ? COLORS.purple : COLORS.neon,
              }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.border }} />

        {/* Zeiten Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: COLORS.neon,
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            ZEITEN
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.white, lineHeight: 22 }}>
            {(() => {
              const start = job.start_at || job.startAt || null;
              const end = job.end_at || job.endAt || null;

              if (job.date && start && end) {
                return `${job.date} von ${start} bis ${end}`;
              }

              if (job.startAt && job.endAt && job.startAt !== 'null' && job.endAt !== 'null') {
                try {
                  if (job.startAt.includes(':') && job.startAt.length <= 5) {
                    return `${job.date || 'Datum unbekannt'} von ${job.startAt} bis ${job.endAt}`;
                  }
                  const start = new Date(job.startAt);
                  const end = new Date(job.endAt);
                  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    return `${start.toLocaleString('de-DE')} - ${end.toLocaleString('de-DE')}`;
                  }
                } catch (e) {}
              }

              if (job.dueAt && job.dueAt !== 'null') {
                try {
                  const due = new Date(job.dueAt);
                  if (!isNaN(due.getTime())) {
                    return `Deadline: ${due.toLocaleDateString('de-DE')}`;
                  }
                } catch (e) {}
              }

              if (job.hours && job.hours > 0) {
                return `Stundenpaket: ${job.hours} Stunden`;
              }

              return 'Keine Zeitangaben';
            })()}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.border }} />

        {/* Adresse Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: COLORS.neon,
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            ADRESSE
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.white, lineHeight: 22 }}>
            {formatAddress(job.address) || 'Keine Adresse angegeben'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.border }} />

        {/* Anforderungen Card */}
        {job.requiredTags && job.requiredTags.length > 0 && (
          <>
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: COLORS.neon,
                  marginBottom: 12,
                  letterSpacing: 0.5,
                }}
              >
                ANFORDERUNGEN
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {job.requiredTags.map((tag, idx) => (
                  <View
                    key={idx}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: 'rgba(107,75,255,0.2)',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: COLORS.purple,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: COLORS.white, fontWeight: '600' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.border }} />
          </>
        )}

        {/* Preis Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: COLORS.neon,
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            LOHN
          </Text>
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.white }}>
              {euro(job.workerAmountCents)} Arbeitnehmerlohn
            </Text>

            {(() => {
              const brutto = job.workerAmountCents;
              const pauschal = Math.round(brutto * 0.3);
              const total = brutto + pauschal;

              return (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                    Arbeitgeberkosten
                  </Text>

                  <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
                    Arbeitnehmerlohn: {euro(brutto)}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
                    Pauschalabgaben (30 % nach § 40a EStG): {euro(pauschal)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: COLORS.neon,
                      marginTop: 8,
                    }}
                  >
                    Gesamtkosten: {euro(total)}
                  </Text>
                </View>
              );
            })()}
          </View>
          <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
            {job.timeMode === 'hours' ? 'pro Stunde' : 'Gesamt'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.border }} />

        {/* Bewerberliste Card */}
        {job.status === 'open' && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: COLORS.neon,
                marginBottom: 16,
                letterSpacing: 0.5,
              }}
            >
              BEWERBER ({applicants.length})
            </Text>

            {isLoadingApps ? (
              <ActivityIndicator color={COLORS.neon} />
            ) : applicants.length === 0 ? (
              <Text style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center' }}>
                Noch keine Bewerbungen
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {applicants.map(({ app, profile, avgRating, reviewCount }) => {
                  const displayName = profile?.firstName
                    ? `${profile.firstName}${
                        profile.lastName ? ' ' + profile.lastName.charAt(0) + '.' : ''
                      }`
                    : 'Anonym';

                  return (
                    <View
                      key={app.id}
                      style={{
                        padding: 16,
                        backgroundColor: '#1C182B',
                        borderRadius: 12,
                        gap: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      {/* Klickbarer Profil-Bereich */}
                      <Pressable
                        onPress={() =>
                          setSelectedWorker({
                            workerId: app.workerId,
                            applicationId: app.id,
                          })
                        }
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: 12,
                          }}
                        >
                          {/* Profilbild */}
                          {profile?.profilePhotoUri ? (
                            <Image
                              source={{ uri: profile.profilePhotoUri }}
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#E0E0E0',
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: COLORS.purple,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  color: COLORS.white,
                                  fontSize: 20,
                                  fontWeight: '700',
                                }}
                              >
                                {getInitials(displayName)}
                              </Text>
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '700',
                                  color: COLORS.white,
                                }}
                              >
                                {displayName}
                              </Text>
                              <Ionicons name="eye-outline" size={16} color={COLORS.neon} />
                            </View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: COLORS.muted,
                                marginTop: 2,
                              }}
                            >
                              Beworben am {new Date(app.createdAt).toLocaleDateString('de-DE')}
                            </Text>
                            <View style={{ marginTop: 6 }}>
                              <RatingDisplay
                                averageRating={avgRating}
                                reviewCount={reviewCount}
                                size="small"
                                color={COLORS.neon}
                              />
                            </View>
                          </View>
                        </View>

                        {/* Steckbrief */}
                        {profile?.shortBio && (
                          <View
                            style={{
                              backgroundColor: COLORS.card,
                              padding: 12,
                              borderRadius: 8,
                              borderLeftWidth: 3,
                              borderLeftColor: COLORS.neon,
                              marginTop: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: COLORS.muted,
                                fontStyle: 'italic',
                              }}
                            >
                              "{profile.shortBio}"
                            </Text>
                          </View>
                        )}
                      </Pressable>

                      {/* Accept Button */}
                      <Pressable
                        onPress={() =>
                          handleAcceptApplication(app.id, app.workerId, displayName)
                        }
                        disabled={isAcceptingId === app.id}
                        style={({ pressed }) => ({
                          backgroundColor: COLORS.purple,
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: 'center',
                          opacity: pressed ? 0.9 : 1,
                          width: '60%',
                          maxWidth: 300,
                          minWidth: 220,
                          alignSelf: 'center',
                          marginTop: 16,
                          marginBottom: 16,
                        })}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white }}>
                          {isAcceptingId === app.id ? 'Wird akzeptiert...' : 'Auswählen'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {job.status === 'matched' && (
          <View style={{ gap: 12 }}>
            {(() => {
              const matchedApp = applications.find(
                app => app.workerId === job.matchedWorkerId && app.status === 'accepted'
              );
              const isPaid = matchedApp?.paymentStatus === 'paid';

              if (isPaid) {
                return (
                  <Pressable
                    onPress={() => {
                      if (matchedApp) {
                        router.push(`/chat/${matchedApp.id}`);
                      } else {
                        alert('Chat nicht verfügbar');
                      }
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: COLORS.purple,
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      opacity: pressed ? 0.9 : 1,
                      width: '60%',
                      maxWidth: 300,
                      minWidth: 220,
                      alignSelf: 'center',
                    })}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                      Zum Chat
                    </Text>
                  </Pressable>
                );
              }

              return null;
            })()}

            {!hasReview && (
              <Pressable
                onPress={() => router.push(`/(employer)/jobs/rate?id=${job.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: COLORS.purple,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                  width: '60%',
                  maxWidth: 300,
                  minWidth: 220,
                  alignSelf: 'center',
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                  Job abschließen & bewerten
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Worker Profile Modal */}
      <WorkerProfileEmployerView
        workerId={selectedWorker?.workerId || ''}
        applicationId={selectedWorker?.applicationId}
        visible={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
      />
    </View>
  );
}
