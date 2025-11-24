// app/(employer)/jobs/[id].tsx - FINAL NEON-TECH DESIGN
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { getJobById, deleteJob, updateJob } from '../../../utils/jobStore';
import { getApplicationsForJob, acceptApplication } from '../../../utils/applicationStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { getReviewForJob } from '../../../utils/reviewStore';
import { Job } from '../../../types/job';
import { JobApplication } from '../../../types/application';
import { WorkerProfile } from '../../../types/profile';
import { formatAddress } from '../../../types/address';
import { getInitials } from '../../../utils/stringHelpers';
import { euro } from '../../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  purpleDark: '#3E2DD9',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  neonTransparent20: 'rgba(200,255,22,0.2)',
  neonShadow: 'rgba(200,255,22,0.15)',
  error: '#FF4D4D',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Applications
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicants, setApplicants] = useState<{ app: JobApplication; profile: WorkerProfile | null }[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);

  // Review state
  const [hasReview, setHasReview] = useState(false);

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

  // Load applications
  useEffect(() => {
    if (!job || !user) return;

    (async () => {
      setIsLoadingApps(true);
      try {
        const apps = await getApplicationsForJob(job.id);
        setApplications(apps);
        const withProfiles: { app: JobApplication; profile: WorkerProfile | null }[] = [];
        for (const app of apps) {
          const p = await getWorkerProfile(app.workerId);
          withProfiles.push({ app, profile: p });
        }
        setApplicants(withProfiles);
      } catch (e) {
        console.error('Error loading applicants:', e);
      } finally {
        setIsLoadingApps(false);
      }
    })();
  }, [job?.id, user?.id]);

  // Check review
  useEffect(() => {
    if (!job || !user || job.status !== 'matched' || !job.matchedWorkerId) {
      setHasReview(false);
      return;
    }
    (async () => {
      const review = await getReviewForJob(job.id);
      setHasReview(!!review);
    })();
  }, [job?.id, job?.status, job?.matchedWorkerId, user?.id]);

  async function handleAcceptApplication(appId: string, workerId: string, workerName: string) {
    if (!job || !user) {
      console.error('❌ handleAcceptApplication: Missing job or user');
      return;
    }

    console.log('💳 handleAcceptApplication called:');
    console.log('   - Application ID:', appId);
    console.log('   - Worker ID:', workerId);
    console.log('   - Worker Name:', workerName);
    console.log('🔄 Navigating to /payment/' + appId);
    
    // Weiterleitung zur Payment-Seite (Zahlung BEVOR Match)
    router.push(`/payment/${appId}`);
  }

  async function handleDelete() {
    if (!job) return;

    // Browser-kompatible Bestätigung
    const confirmed = window.confirm('Auftrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.');
    
    if (confirmed) {
      try {
        setIsDeleting(true);
        await deleteJob(job.id);
        console.log('✅ Auftrag gelöscht');
        router.replace('/(employer)');
      } catch (e) {
        console.error('❌ Fehler: Auftrag konnte nicht gelöscht werden.', e);
      } finally {
        setIsDeleting(false);
      }
    }
  }

  if (isLoading) return null;

  if (!user || user.role !== 'employer') {
    return <Redirect href="/start" />;
  }

  if (loadingJob) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 24 }}>
            {error ?? 'Auftrag nicht gefunden'}
          </Text>
          <Pressable
            onPress={() => router.replace('/(employer)')}
            style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700' }}>
              Zurück
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const statusLabel = 
    job.status === 'open' ? 'Offen' : 
    job.status === 'matched' ? 'Vergeben' :
    job.status === 'done' ? 'Erledigt' :
    job.status === 'canceled' ? 'Abgesagt' : 
    job.status;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Gradient Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.purpleDark,
      }} />

      {/* Optional Glow */}
      <View style={{
        position: 'absolute',
        top: -60,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.1,
        blur: 60,
      }} />

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
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
        contentContainerStyle={{ padding: 20, gap: 16 }}
      >
        {/* Job Header Card */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 20,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 6,
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '700', 
            color: COLORS.purple,
            marginBottom: 12,
          }}>
            {job.title}
          </Text>

          {/* Kategorie Badge */}
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: COLORS.neon,
            borderRadius: 10,
            alignSelf: 'flex-start',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.black }}>
              {job.category}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: job.status === 'open' ? '#E8F5E9' : '#E3F2FD',
            borderRadius: 8,
            alignSelf: 'flex-start',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: job.status === 'open' ? '#2E7D32' : '#1976D2' }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Section Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.neonTransparent20 }} />

        {/* Zeiten Card */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 20,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
            ZEITEN
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
            {job.startAt && job.endAt 
              ? `${new Date(job.startAt).toLocaleString('de-DE')} - ${new Date(job.endAt).toLocaleString('de-DE')}`
              : job.dueAt 
              ? `Deadline: ${new Date(job.dueAt).toLocaleDateString('de-DE')}`
              : `Stundenpaket: ${job.hours} Stunden`}
          </Text>
        </View>

        {/* Section Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.neonTransparent20 }} />

        {/* Adresse Card */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 20,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
            ADRESSE
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
            📍 {formatAddress(job.address) || 'Keine Adresse angegeben'}
          </Text>
        </View>

        {/* Section Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.neonTransparent20 }} />

        {/* Anforderungen Card */}
        {(job.requiredTags && job.requiredTags.length > 0) && (
          <>
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
                ANFORDERUNGEN
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {job.requiredTags.map((tag, idx) => (
                  <View key={idx} style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: '#F5F5F5',
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 13, color: COLORS.darkGray, fontWeight: '600' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section Divider */}
            <View style={{ height: 1, backgroundColor: COLORS.neonTransparent20 }} />
          </>
        )}

        {/* Preis Card - BUG 1 FIX: job.wages → job.workerAmountCents */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 20,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8, letterSpacing: 0.5 }}>
            LOHN
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.black }}>
            {euro(job.workerAmountCents)}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.darkGray, marginTop: 4 }}>
            {job.timeMode === 'hours' ? 'pro Stunde' : 'Gesamt'}
          </Text>
        </View>

        {/* Section Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.neonTransparent20 }} />

        {/* Bewerberliste Card */}
        {job.status === 'open' && (
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              BEWERBER ({applications.length})
            </Text>

            {isLoadingApps ? (
              <ActivityIndicator color={COLORS.purple} />
            ) : applicants.length === 0 ? (
              <Text style={{ fontSize: 14, color: COLORS.darkGray, textAlign: 'center' }}>
                Noch keine Bewerbungen
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {applicants.map(({ app, profile }) => {
                  // Format name: "Vorname Nachname" -> "Vorname N."
                  const displayName = profile?.firstName 
                    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName.charAt(0) + '.' : ''}`
                    : 'Anonym';
                  
                  return (
                  <View key={app.id} style={{
                    padding: 16,
                    backgroundColor: '#F8F8F8',
                    borderRadius: 12,
                    gap: 12,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
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
                        <View style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: COLORS.purple,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>
                            {getInitials(displayName)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                          {displayName}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.darkGray, marginTop: 2 }}>
                          Beworben am {new Date(app.createdAt).toLocaleDateString('de-DE')}
                        </Text>
                      </View>
                    </View>

                    {/* Steckbrief */}
                    {profile?.shortBio && (
                      <View style={{
                        backgroundColor: COLORS.white,
                        padding: 12,
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: COLORS.neon,
                      }}>
                        <Text style={{ fontSize: 13, color: COLORS.darkGray, fontStyle: 'italic' }}>
                          "{profile.shortBio}"
                        </Text>
                      </View>
                    )}

                    {/* Accept Button */}
                    <Pressable
                      onPress={() => handleAcceptApplication(app.id, app.workerId, displayName)}
                      disabled={isAcceptingId === app.id}
                      style={({ pressed }) => ({
                        backgroundColor: COLORS.neon,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black }}>
                        {isAcceptingId === app.id ? 'Wird akzeptiert...' : 'Auswählen'}
                      </Text>
                    </Pressable>
                  </View>
                )})})
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {job.status === 'matched' && (
          <View style={{ gap: 12 }}>
            {/* Chat Button */}
            <Pressable
              onPress={() => router.push(`/(employer)/chat/${job.matchedWorkerId}`)}
              style={({ pressed }) => ({
                backgroundColor: COLORS.neon,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                💬 Zum Chat
              </Text>
            </Pressable>

            {/* Rate Button */}
            {!hasReview && (
              <Pressable
                onPress={() => router.push(`/(employer)/jobs/rate?id=${job.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: COLORS.neon,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  Job abschließen & bewerten
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
