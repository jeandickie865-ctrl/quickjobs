// app/(employer)/applications.tsx - ALLE BEWERBUNGEN FÜR ARBEITGEBER
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, ActivityIndicator, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationsForEmployer } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { getWorkerProfile } from '../../utils/profileStore';
import { JobApplication } from '../../types/application';
import { Job } from '../../types/job';
import { WorkerProfile } from '../../types/profile';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  errorBg: 'rgba(255,77,77,0.12)',
  error: '#FF4D4D',
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

  // Auto-refresh interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadApplications = async (silent = false) => {
    if (!user) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      setError(null);

      // Alle Bewerbungen für diesen Arbeitgeber laden
      const apps = await getApplicationsForEmployer();
      console.log(`📋 Gefunden: ${apps.length} Bewerbungen für Employer ${user.id}`);

      // Job- und Worker-Details für jede Bewerbung laden
      const withDetails: ApplicationWithDetails[] = [];
      for (const app of apps) {
        const job = await getJobById(app.jobId);
        const worker = await getWorkerProfile(app.workerId);
        withDetails.push({ application: app, job, worker });
      }

      // Sortieren: Neueste zuerst
      withDetails.sort((a, b) => 
        b.application.createdAt.localeCompare(a.application.createdAt)
      );

      setItems(withDetails);
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

  // Setup auto-refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!authLoading && user) {
        loadApplications();
      }

      // Start auto-refresh interval (5 seconds)
      intervalRef.current = setInterval(() => {
        if (!authLoading && user) {
          loadApplications(true); // Silent refresh
        }
      }, 5000);

      // Cleanup on unfocus
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
        return '#FFA500';
      case 'accepted':
        return COLORS.neon;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.darkGray;
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
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Bewerbungen...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '900', 
            color: COLORS.white,
            letterSpacing: 0.2,
          }}>
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.neon} />
        }
      >
        {error && (
          <View style={{
            padding: 16,
            backgroundColor: COLORS.errorBg,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.error,
          }}>
            <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {items.length === 0 ? (
          <View style={{
            padding: 32,
            backgroundColor: COLORS.white,
            borderRadius: 18,
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ color: COLORS.black, fontSize: 18, textAlign: 'center', fontWeight: '700' }}>
              Noch keine Bewerbungen
            </Text>
            <Text style={{ color: COLORS.darkGray, fontSize: 14, textAlign: 'center' }}>
              Sobald sich jemand auf deine Aufträge bewirbt, erscheinen die Bewerbungen hier.
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
                    backgroundColor: COLORS.white,
                    borderRadius: 18,
                    padding: 20,
                    opacity: pressed ? 0.9 : 1,
                    borderWidth: isAccepted ? 2 : 0,
                    borderColor: isAccepted ? COLORS.neon : 'transparent',
                  })}
                >
                  {/* Worker Info mit Foto */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: COLORS.purple,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
                          {initials}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                        {maskedName}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 2 }}>
                        {new Date(application.createdAt).toLocaleDateString('de-DE')}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: statusColor === COLORS.neon ? statusColor : `${statusColor}20`,
                    }}>
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '700', 
                        color: statusColor === COLORS.neon ? COLORS.black : statusColor,
                      }}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Über mich - Worker Beschreibung */}
                  {worker?.shortBio && (
                    <View style={{
                      backgroundColor: 'rgba(89, 65, 255, 0.05)',
                      padding: 12,
                      borderRadius: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: COLORS.purple,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.purple, marginBottom: 4 }}>
                        💬 Über mich
                      </Text>
                      <Text style={{ fontSize: 13, color: COLORS.black, lineHeight: 18 }}>
                        {worker.shortBio}
                      </Text>
                    </View>
                  )}

                  {/* Worker Qualifikationen - WICHTIG FÜR ENTSCHEIDUNG */}
                  {worker && (worker.subcategories?.length > 0 || worker.qualifications?.length > 0) && (
                    <View style={{
                      backgroundColor: 'rgba(200, 255, 22, 0.1)',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: COLORS.neon,
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                        🎯 Qualifikationen & Tätigkeiten
                      </Text>
                      
                      {worker.subcategories && worker.subcategories.length > 0 && (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.darkGray, marginBottom: 4 }}>
                            Tätigkeiten:
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {worker.subcategories.map((sub, idx) => (
                              <View 
                                key={idx}
                                style={{
                                  backgroundColor: COLORS.white,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                  borderWidth: 1,
                                  borderColor: COLORS.neon,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.black }}>
                                  {sub}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {worker.qualifications && worker.qualifications.length > 0 && (
                        <View>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.darkGray, marginBottom: 4 }}>
                            Qualifikationen:
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
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
                                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.black }}>
                                  ✓ {qual}
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
                    <View style={{
                      backgroundColor: COLORS.lightGray,
                      padding: 12,
                      borderRadius: 12,
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 4 }}>
                        {job.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
                        📦 {job.category}
                      </Text>
                    </View>
                  )}

                  {/* Accept Button - nur bei pending */}
                  {application.status === 'pending' && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/payment/${application.id}`);
                      }}
                      style={{
                        backgroundColor: COLORS.neon,
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        shadowColor: 'rgba(200,255,22,0.2)',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                        marginTop: 12,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                        ✓ Annehmen & zur Zahlung
                      </Text>
                    </Pressable>
                  )}

                  {/* Action Hint */}
                  <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="open-outline" size={14} color={COLORS.purple} />
                    <Text style={{ fontSize: 12, color: COLORS.purple, fontWeight: '600' }}>
                      Tippen für Details
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
