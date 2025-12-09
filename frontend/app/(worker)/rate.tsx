// app/(worker)/rate.tsx - Worker bewertet Employer
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getJobById } from '../../utils/jobStore';
import { getEmployerProfilePublicView } from '../../utils/employerProfileStore';
import { addReview } from '../../utils/reviewStore';
import { Job } from '../../types/job';
import { EmployerProfile } from '../../utils/employerProfileStore';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/AppHeader';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#9333EA',      // Lila
  primaryLight: '#C084FC', // Helles Lila
  secondary: '#FF773D',    // Orange
  accent: '#EFABFF',       // Rosa
  accentLight: '#FCE7FF',  // Sehr helles Rosa
  border: '#E9D5FF',       // Lila Border
  inputBg: '#FAF5FF',      // Sehr helles Lila für Inputs
  inputBorder: '#DDD6FE',  // Lila Border für Inputs
  text: '#1A1A1A',         // Dunkelgrau für Text
  textMuted: '#6B7280',    // Grau für sekundären Text
  error: '#EF4444',        // Rot für Fehler
};

export default function RateEmployerScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string; employerId?: string }>();
  const jobId = params.jobId;
  const employerId = params.employerId;

  const [job, setJob] = useState<Job | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuccessModal]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!jobId) {
      setLoading(false);
      return;
    }

    try {
      
      const jobData = await getJobById(String(jobId));
      
      if (jobData) {
        setJob(jobData);
        
        // Use employerId from params OR from job
        const targetEmployerId = employerId || jobData.employerId;
        
        if (targetEmployerId) {
          const employerData = await getEmployerProfilePublicView(String(targetEmployerId));
          setEmployer(employerData);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('❌ Error loading data for Worker Rate:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!job || !user) return;

    if (rating < 1 || rating > 5) {
      alert('Bitte wähle mindestens 1 Stern');
      return;
    }

    setSaving(true);
    try {
      const review = {
        jobId: String(jobId),
        workerId: user.id,
        employerId: job.employerId,
        reviewerRole: 'worker', // Worker bewertet Employer
        rating,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const result = await addReview(review);
      
      // Note: Job status will be managed by backend automatically
      
      // Erfolgsmeldung
      alert('Bewertung wurde erfolgreich gespeichert!');
      
      // Zurück navigieren
      router.back();
    } catch (error) {
      console.error('❌ Error saving review:', error);
      alert('Bewertung konnte nicht gespeichert werden: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!job) {
    
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle" size={64} color={COLORS.neon} style={{ marginBottom: 16 }} />
          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            Job konnte nicht geladen werden
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            JobId: {jobId || 'nicht vorhanden'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: COLORS.neon,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              shadowColor: 'rgba(200,255,22,0.2)',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Zurück</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (!employer) {
    
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle" size={64} color={COLORS.neon} style={{ marginBottom: 16 }} />
          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            Auftraggeber konnte nicht geladen werden
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            EmployerId: {employerId || job?.employerId || 'nicht vorhanden'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: COLORS.neon,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              shadowColor: 'rgba(200,255,22,0.2)',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Zurück</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <AppHeader />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            >
              {/* Titel */}
              <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 24 }}>
                Auftraggeber bewerten
              </Text>

              {/* Job Info */}
              <View style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>
                  Job
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '600' }}>
                  {job.title}
                </Text>
              </View>

              {/* Employer Info */}
              <View style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 32,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>
                  Auftraggeber
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '600' }}>
                  {employer?.companyName || employer?.company || employer?.firstName || employer?.lastName || 'Auftraggeber'}
                </Text>
              </View>

              {/* Rating */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '700', marginBottom: 16 }}>
                  Wie war deine Erfahrung?
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      style={{
                        padding: 8,
                      }}
                    >
                      <Ionicons
                        name={rating >= star ? 'star' : 'star-outline'}
                        size={40}
                        color={rating >= star ? '#FF773D' : COLORS.border}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: '700', marginBottom: 12 }}>
                  Kommentar (optional)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Teile deine Erfahrung..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: COLORS.inputBg,
                    borderRadius: 12,
                    padding: 16,
                    color: COLORS.text,
                    fontSize: 15,
                    minHeight: 100,
                    textAlignVertical: 'top',
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                  }}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSave}
                disabled={saving || rating === 0}
                style={({ pressed }) => ({
                  backgroundColor: rating === 0 ? COLORS.border : COLORS.secondary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    Bewertung abgeben
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Success Modal */}
          {showSuccessModal && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}>
              <Animated.View style={{
                backgroundColor: COLORS.white,
                borderRadius: 24,
                padding: 32,
                alignItems: 'center',
                transform: [{ scale: successScale }],
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: COLORS.neon,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                }}>
                  <Ionicons name="checkmark" size={50} color={COLORS.black} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.black, marginBottom: 12 }}>
                  Vielen Dank!
                </Text>
                <Text style={{ fontSize: 16, color: COLORS.darkGray, textAlign: 'center' }}>
                  Deine Bewertung wurde gespeichert
                </Text>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
