// app/(employer)/applications.tsx - ALLE BEWERBUNGEN FÜR ARBEITGEBER (BACKUP DESIGN)
import React, { useState, useEffect, useRef } from 'react';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { ScrollView, View, Text, ActivityIndicator, Pressable, RefreshControl, Image } from 'react-native';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getApplicationsForEmployer } from '../../utils/applicationStore';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getJobById } from '../../utils/jobStore';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { getWorkerProfile } from '../../utils/profileStore';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { JobApplication } from '../../types/application';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { Job } from '../../types/job';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { WorkerProfile } from '../../types/profile';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import { Ionicons } from '@expo/vector-icons';
import { ArrowDoodle } from '../../components/ArrowDoodle';
import Constants from 'expo-constants';
import { ArrowDoodle } from '../../components/ArrowDoodle';

const COLORS = {
  bg: '#00A07C',
  card: '#FFFFFF',
  border: 'rgba(255,255,255,0.25)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.85)',
  purple: '#EFABFF',
  purpleLight: '#EFABFF',
  neon: '#EFABFF',
  error: '#E64A4A',
};

type ApplicationWithDetails = {
  application: JobApplication;
  job: Job | null;
  worker: WorkerProfile | null;
};

export default function EmployerApplicationsScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<ApplicationWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadApplications = async (silent = false) => {
    if (!user) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      setError(null);

      const apps = await getApplicationsForEmployer();
      console.log(`📋 Gefunden: ${apps.length} Bewerbungen für Employer ${user.id}`);

      const withDetails: ApplicationWithDetails[] = [];
      for (const app of apps) {
        const job = await getJobById(app.jobId);
        const worker = await getWorkerProfile(app.workerId);
        withDetails.push({ application: app, job, worker });
      }

      const pendingOnly = withDetails.filter(item => item.application.status === 'pending');

      pendingOnly.sort((a, b) =>
        b.application.createdAt.localeCompare(a.application.createdAt)
      );

      setItems(pendingOnly);
    } catch (e) {
      console.error('Error loading applications:', e);
      if (!silent) {
        setError('Bewerbungen konnten nicht geladen werden.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) {
        loadApplications();
      }

      intervalRef.current = setInterval(() => {
        if (!authLoading && user) {
          loadApplications(true);
        }
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [user, authLoading])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const getStatusLabel = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'Offen';
      case 'accepted':
        return 'Angenommen';
      case 'rejected':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getStatusColor = (status: JobApplication['status']) => {
    switch (status) {
      case 'pending':
        return COLORS.purple;
      case 'accepted':
        return COLORS.neon;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.muted;
    }
  };

  const getMaskedName = (worker: WorkerProfile | null) => {
    if (!worker) return 'Unbekannt';
    const first = worker.firstName || '';
    const last = worker.lastName || '';
    if (first && last) {
      return `${first} ${last.charAt(0)}.`;
    }
    return first || 'Unbekannt';
  };

  const getInitials = (worker: WorkerProfile | null) => {
    if (!worker) return '?';
    const first = worker.firstName?.charAt(0) || '';
    const last = worker.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  if (authLoading) return null;
  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* ARROW DOODLE */}
        <View style={{
          position: "absolute",
          top: 20,
          right: 20,
          opacity: 0.9,
          zIndex: 20
        }}>
          <ArrowDoodle size={130} />
        </View>


          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.muted, marginTop: 16 }}>Lädt Bewerbungen</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
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
          <Text
            style={{
              fontSize: 24,
              fontWeight: '900',
              color: COLORS.white,
            }}
          >
            Bewerbungen
          </Text>
          <Pressable onPress={() => router.push('/(employer)/profile')}>
            <Ionicons name="person-circle-outline" size={26} color={COLORS.neon} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.neon}
          />
        }
      >
        {error && (
          <View
            style={{
              padding: 16,
              backgroundColor: 'rgba(230,74,74,0.12)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.error,
            }}
          >
            <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>
              {error}
            </Text>
          </View>
        )}

        {items.length === 0 ? (
          <View
            style={{
              padding: 32,
              backgroundColor: COLORS.card,
              borderRadius: 18,
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontSize: 18,
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              Noch keine Bewerbungen
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Neue Bewerbungen zu deinen Aufträgen erscheinen hier.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {items.map(({ application, job, worker }) => {
              const statusLabel = getStatusLabel(application.status);
              const statusColor = getStatusColor(application.status);
              const maskedName = getMaskedName(worker);
              const initials = getInitials(worker);
              const isAccepted = application.status === 'accepted';

              return (
                <Pressable
                  key={application.id}
                  onPress={() => {
                    if (job) {
                      router.push(`/(employer)/jobs/${job.id}`);
                    }
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: COLORS.card,
                    borderRadius: 18,
                    padding: 20,
                    opacity: pressed ? 0.9 : 1,
                    borderWidth: 1,
                    borderColor: isAccepted ? COLORS.neon : COLORS.border,
                  })}
                >
                  {/* Worker Kopfbereich */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    {worker?.photoUrl || worker?.profilePhotoUri ? (
                      <Image
                        source={{ uri: worker.photoUrl || worker.profilePhotoUri }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          marginRight: 12,
                          borderWidth: 2,
                          borderColor: COLORS.neon,
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
                          marginRight: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: COLORS.white,
                          }}
                        >
                          {initials}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: COLORS.white,
                        }}
                      >
                        {maskedName}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.muted,
                          marginTop: 2,
                        }}
                      >
                        {new Date(application.createdAt).toLocaleDateString('de-DE')}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor:
                          statusColor === COLORS.neon
                            ? 'rgba(200,255,22,0.2)'
                            : statusColor === COLORS.error
                            ? 'rgba(255,77,77,0.16)'
                            : 'rgba(107,75,255,0.16)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color:
                            statusColor === COLORS.neon
                              ? COLORS.neon
                              : statusColor === COLORS.error
                              ? COLORS.error
                              : COLORS.purple,
                        }}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Über mich */}
                  {worker?.shortBio && (
                    <View
                      style={{
                        backgroundColor: 'rgba(107,75,255,0.12)',
                        padding: 12,
                        borderRadius: 12,
                        borderLeftWidth: 3,
                        borderLeftColor: COLORS.purple,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginBottom: 4,
                        }}
                      >
                        Über mich
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: COLORS.muted,
                          lineHeight: 18,
                        }}
                      >
                        {worker.shortBio}
                      </Text>
                    </View>
                  )}

                  {/* Bewertungen */}
                  {worker && <WorkerRatings workerId={worker.userId} />}

                  {/* Beschäftigungsstatus */}
                  {worker && (
                    <View
                      style={{
                        backgroundColor: worker.isSelfEmployed
                          ? 'rgba(200,255,22,0.1)'
                          : 'rgba(107,75,255,0.12)',
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: worker.isSelfEmployed ? COLORS.neon : COLORS.purple,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: COLORS.white,
                          marginBottom: 4,
                        }}
                      >
                        {worker.isSelfEmployed ? 'Selbstständig' : 'Nicht selbstständig'}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: COLORS.muted,
                        }}
                      >
                        {worker.isSelfEmployed
                          ? 'Kann nach der Provision an BACKUP direkt starten.'
                          : 'BACKUP unterstützt bei der Anmeldung.'}
                      </Text>
                    </View>
                  )}

                  {/* Qualifikationen / Tätigkeiten */}
                  {worker &&
                    (worker.subcategories?.length > 0 ||
                      worker.qualifications?.length > 0) && (
                      <View
                        style={{
                          backgroundColor: 'rgba(200,255,22,0.08)',
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: COLORS.neon,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: COLORS.white,
                            marginBottom: 8,
                          }}
                        >
                          Qualifikationen und Tätigkeiten
                        </Text>

                        {worker.subcategories && worker.subcategories.length > 0 && (
                          <View style={{ marginBottom: 8 }}>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: COLORS.muted,
                                marginBottom: 4,
                              }}
                            >
                              Tätigkeiten
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              {worker.subcategories.map((sub, idx) => (
                                <View
                                  key={idx}
                                  style={{
                                    backgroundColor: COLORS.card,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: COLORS.neon,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '600',
                                      color: COLORS.white,
                                    }}
                                  >
                                    {sub}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {worker.qualifications && worker.qualifications.length > 0 && (
                          <View>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '600',
                                color: COLORS.muted,
                                marginBottom: 4,
                              }}
                            >
                              Qualifikationen
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              {worker.qualifications.map((qual, idx) => (
                                <View
                                  key={idx}
                                  style={{
                                    backgroundColor: COLORS.neon,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: '700',
                                      color: '#000000',
                                    }}
                                  >
                                    {qual}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                  {/* Job Info */}
                  {job && (
                    <View
                      style={{
                        backgroundColor: COLORS.card,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: COLORS.white,
                          marginBottom: 4,
                        }}
                      >
                        {job.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.muted,
                        }}
                      >
                        Kategorie: {job.category}
                      </Text>
                    </View>
                  )}

                  {/* Button nur bei pending */}
                  {application.status === 'pending' && (
                    <View
                      style={{
                        marginTop: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Pressable
                        onPress={e => {
                          e.stopPropagation();
                          router.push(`/payment/${application.id}`);
                        }}
                        style={{
                          backgroundColor: COLORS.purple,
                          borderRadius: 14,
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          alignItems: 'center',
                          width: '60%',
                          maxWidth: 300,
                          minWidth: 220,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: COLORS.white,
                          }}
                        >
                          Annehmen und zur Zahlung
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <View
                    style={{
                      marginTop: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="open-outline" size={14} color={COLORS.muted} />
                    <Text
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                      }}
                    >
                      Tippe auf die Karte für weitere Details.
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Worker Ratings Component
function WorkerRatings({ workerId }: { workerId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const apiUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/reviews/worker/${workerId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchReviews();
    }
  }, [workerId]);

  if (loading) {
    return null; // Show nothing while loading
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <View
      style={{
        backgroundColor: 'rgba(200,255,22,0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.neon,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white }}>
          Bewertungen
        </Text>
        {reviews.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
              {averageRating.toFixed(1)}
            </Text>
            <Ionicons name="star" size={16} color={COLORS.neon} />
          </View>
        )}
      </View>

      {reviews.length === 0 ? (
        <Text style={{ fontSize: 12, color: COLORS.muted, fontStyle: 'italic' }}>
          Noch keine Bewertungen vorhanden
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                size={18}
                color={star <= Math.round(averageRating) ? COLORS.neon : COLORS.muted}
              />
            ))}
            <Text style={{ fontSize: 12, color: COLORS.muted, marginLeft: 6 }}>
              ({reviews.length} {reviews.length === 1 ? 'Bewertung' : 'Bewertungen'})
            </Text>
          </View>

          {reviews.slice(0, 2).map((review, index) => (
            <View
              key={index}
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: 8,
                borderRadius: 8,
                marginTop: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={12}
                      color={star <= review.rating ? COLORS.neon : COLORS.muted}
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 10, color: COLORS.muted }}>
                  {new Date(review.createdAt).toLocaleDateString('de-DE')}
                </Text>
              </View>
              {review.comment && (
                <Text style={{ fontSize: 11, color: COLORS.white, lineHeight: 16 }}>
                  {review.comment}
                </Text>
              )}
            </View>
          ))}

          {reviews.length > 2 && (
            <Text style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginTop: 4 }}>
              +{reviews.length - 2} weitere {reviews.length - 2 === 1 ? 'Bewertung' : 'Bewertungen'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
