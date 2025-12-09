// app/(worker)/jobs/[id].tsx - Job Details für Worker
import React, { useEffect, useState } from 'react';
import { ArrowDoodle } from '../../../components/ArrowDoodle';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getJobById } from '../../../utils/jobStore';
import { Job } from '../../../types/job';
import { euro } from '../../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';
import { getReviewsForEmployer, calculateAverageRating } from '../../../utils/reviewStore';
import { RatingDisplay } from '../../../components/RatingDisplay';
import { getTagLabel } from '../../../utils/taxonomy';
import { addApplication, getWorkerApplications } from '../../../utils/applicationStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { useAuth } from '../../../contexts/AuthContext';

// BACKUP DARK COLORS
const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  cardSoft: '#181433',
  border: 'rgba(0,0,0,0.08)',
  neon: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#1A1A1A",
  lightText: '#E8E8E8',
  dimText: '#A0A0A0',
  darkGray: '#666666',
};

export default function WorkerJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employerRating, setEmployerRating] = useState(0);
  const [employerReviewCount, setEmployerReviewCount] = useState(0);
  const [buttonClickCount, setButtonClickCount] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isMatched, setIsMatched] = useState(false); // Neuer State: Ist gematcht?

  const loadWorkerProfile = async () => {
    try {
      if (!user?.id) {
        console.error('❌ Cannot load worker profile: user.id missing');
        return;
      }
      const profile = await getWorkerProfile(user.id);
      setWorker(profile);
    } catch (err) {
    }
  };

  const checkIfApplied = async () => {
    try {
      if (!id) return;
      const applications = await getWorkerApplications();
      const applied = applications.some(app => app.jobId === String(id));
      const matched = applications.some(app => app.jobId === String(id) && app.status === 'accepted');
      setHasApplied(applied);
      setIsMatched(matched);
    } catch (err) {
      console.error('Error checking applications:', err);
    }
  };

  const loadJob = async () => {
    try {
      if (!id) return;
      const data = await getJobById(String(id));


      setJob(data);
      
      // Load employer reviews
      if (data && data.employerId) {
        const reviews = await getReviewsForEmployer(data.employerId);
        setEmployerReviewCount(reviews.length);
        setEmployerRating(calculateAverageRating(reviews));
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadJob();
    loadWorkerProfile();
    checkIfApplied();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <AppHeader />
        <ArrowDoodle />


          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            Job nicht gefunden
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: COLORS.neon,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: COLORS.bg, fontWeight: '700' }}>Zurück</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 16 }}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, flex: 1 }}>
            Jobdetails
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job Title */}
          <Text style={{
            fontSize: 26,
            fontWeight: '900',
            color: COLORS.white,
            marginBottom: 20,
            letterSpacing: -0.5,
          }}>
            {job.title}
          </Text>

          {/* Main Info Card */}
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 20,
            marginBottom: 20,
          }}>
            {/* Vergütung */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                VERGÜTUNG
              </Text>
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.white }}>
                  {euro(job.workerAmountCents)} (Brutto = Netto)
                </Text>

                {!worker?.isSelfEmployed && (
                  <Text style={{ fontSize: 12, color: COLORS.dimText, marginTop: 4 }}>
                    § 40a EStG – keine Abzüge
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, marginTop: 4 }}>
                {job.timeMode === 'hours' ? 'pro Stunde' : 'Gesamt'}
              </Text>
            </View>

            {/* ZEITRAUM */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                ZEITRAUM
              </Text>

              {/* ZEIT-ANZEIGE (MODERNISIERT) */}
              {(() => {
                // Format date: YYYY-MM-DD → DD.MM.YYYY
                const formatDate = (dateStr) => {
                  if (!dateStr || dateStr === 'None') return null;
                  try {
                    const [year, month, day] = dateStr.split('-');
                    return `${day}.${month}.${year}`;
                  } catch {
                    return null;
                  }
                };

                // Extract time from ISO timestamp or simple time string
                const extractTime = (timeStr) => {
                  if (!timeStr) return null;
                  try {
                    // Check if it's already a simple time format HH:MM
                    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
                      return timeStr; // Already in HH:MM format
                    }
                    
                    // Parse ISO timestamp to Date object (handles UTC conversion automatically)
                    const date = new Date(timeStr);
                    if (isNaN(date.getTime())) return null;
                    
                    // Get local hours and minutes
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${hours}:${minutes}`;
                  } catch {
                    return null;
                  }
                };

                // Neue Felder: date, start_at, end_at
                const jobDate = formatDate(job.date);
                const startTimeRaw = job.start_at || job.startAt || null;
                const endTimeRaw = job.end_at || job.endAt || null;
                const startTime = extractTime(startTimeRaw);
                const endTime = extractTime(endTimeRaw);

                // 1. FIXED TIME mit neuen Feldern
                if (job.timeMode === 'fixed_time' && jobDate && startTime && endTime) {
                  return (
                    <>
                      <Text style={{ fontSize: 16, color: COLORS.white }}>
                        {jobDate}
                      </Text>
                      <Text style={{ fontSize: 16, color: COLORS.white, marginTop: 4 }}>
                        {startTime} – {endTime} Uhr
                      </Text>
                    </>
                  );
                }

                // 2. STUNDENPAKET
                if (job.timeMode === 'hour_package' && job.hours) {
                  return (
                    <>
                      <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '600' }}>
                        {job.hours} Stunden
                      </Text>
                      {jobDate && (
                        <Text style={{ fontSize: 14, color: COLORS.darkGray, marginTop: 8 }}>
                          Datum: {jobDate}
                        </Text>
                      )}
                    </>
                  );
                }

                // 3. FALLBACK
                return (
                  <Text style={{ fontSize: 16, color: COLORS.white }}>
                    Keine Zeitangabe
                  </Text>
                );
              })()}
            </View>

            {/* Standort */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                STANDORT
              </Text>
              <Text style={{ fontSize: 16, color: COLORS.white }}>
                {job.address
                  ? `${job.address.street || ''} ${isMatched ? (job.address.houseNumber || job.address.house_number || '') : ''}, ${job.address.postalCode || job.address.postal_code || ''} ${job.address.city || ''}`.trim()
                  : 'Adresse nicht angegeben'
                }
              </Text>
              {!isMatched && job.address && (
                <Text style={{ fontSize: 12, color: COLORS.dimText, marginTop: 4, fontStyle: 'italic' }}>
                  📍 Genaue Hausnummer nach Match sichtbar
                </Text>
              )}
            </View>

            {/* Kategorie */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                KATEGORIE
              </Text>
              <View style={{
                backgroundColor: COLORS.neon,
                alignSelf: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.bg }}>
                  {job.category || 'Keine Kategorie'}
                </Text>
              </View>
            </View>

            {/* Beschreibung */}
            {job.description && (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                  BESCHREIBUNG
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.white, lineHeight: 22 }}>
                  {job.description}
                </Text>
              </View>
            )}

            {/* Tags anzeigen */}
            {(job.required_all_tags?.length > 0 || job.required_any_tags?.length > 0) && (
              <View style={{ marginTop: 20 }}>
                {job.required_all_tags?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.neon, marginBottom: 6 }}>
                      PFLICHT
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {job.required_all_tags.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            backgroundColor: '#EFABFF',
                            borderRadius: 6,
                            marginRight: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                            {getTagLabel(job.category, tag)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {job.required_any_tags?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#8A8A8A', marginBottom: 6 }}>
                      MINDESTENS EINE
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {job.required_any_tags.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            backgroundColor: '#8A8A8A',
                            borderRadius: 6,
                            marginRight: 6,
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                            {getTagLabel(job.category, tag)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View style={{
            backgroundColor: job.status === 'matched' ? COLORS.neon : '#FFFFFF',
            borderWidth: 1,
            borderColor: job.status === 'matched' ? COLORS.neon : '#E9D5FF',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 40,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: job.status === 'matched' ? '#FFFFFF' : '#1A1A1A' }}>
              {job.status === 'matched'
                ? 'Du bist für diesen Job ausgewählt'
                : job.status === 'open'
                ? 'Job ist offen'
                : job.status === 'pending'
                ? 'In Bearbeitung'
                : 'Status unbekannt'
              }
            </Text>
          </View>

          {/* Button "Ich habe Zeit" */}
          {job.status !== 'matched' && !hasApplied && (
            <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
              <Pressable
                onPress={async () => {
                  
                  if (!worker?.categories || worker?.categories.length === 0 || !worker?.radiusKm || worker?.isSelfEmployed === undefined) {
                    console.error('❌ VALIDATION FAILED!');
                    console.error('Missing categories:', !worker?.categories || worker?.categories.length === 0);
                    console.error('Missing radiusKm:', !worker?.radiusKm);
                    console.error('Missing isSelfEmployed:', worker?.isSelfEmployed === undefined);
                    alert("Bitte vervollständige dein Profil, bevor du dich bewerben kannst.");
                    router.push('/(worker)/edit-profile');
                    return;
                  }

                  const newCount = buttonClickCount + 1;
                  setButtonClickCount(newCount);
                  setDebugLogs(prev => [...prev, `Click #${newCount}`, `Job ID: ${job?.id}`]);

                  try {
                    const result = await addApplication(job.id);
                    setHasApplied(true); // Update state sofort nach erfolgreicher Bewerbung
                    alert('Erfolg! Bewerbung wurde erstellt.');
                    setTimeout(() => router.push('/(worker)/applications'), 500);
                  } catch (err: any) {
                    alert('Fehler: ' + (err.message || 'Unbekannter Fehler'));
                  }
                }}
                style={{
                  width: '60%',
                  backgroundColor: '#EFABFF',
                  paddingVertical: 20,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 }}>
                  ✓ Ich habe Zeit
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
