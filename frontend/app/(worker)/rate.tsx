// app/(worker)/rate.tsx - Worker bewertet Employer
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getJobById, updateJob } from '../../utils/jobStore';
import { getEmployerProfile } from '../../utils/employerProfileStore';
import { addReview } from '../../utils/reviewStore';
import { Job } from '../../types/job';
import { EmployerProfile } from '../../utils/employerProfileStore';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
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
      console.log('❌ No jobId provided for Worker Rate');
      setLoading(false);
      return;
    }

    try {
      console.log('📋 Worker Rate: Loading job:', jobId);
      console.log('📋 Worker Rate: EmployerId from params:', employerId);
      
      const jobData = await getJobById(String(jobId));
      
      if (jobData) {
        console.log('✅ Job loaded:', jobData.title);
        setJob(jobData);
        
        // Use employerId from params OR from job
        const targetEmployerId = employerId || jobData.employerId;
        console.log('👔 Loading employer:', targetEmployerId);
        
        if (targetEmployerId) {
          const employerData = await getEmployerProfile(String(targetEmployerId));
          setEmployer(employerData);
          console.log('✅ Employer loaded:', employerData?.firstName);
        } else {
          console.log('❌ No employerId available');
        }
      } else {
        console.log('❌ Job not found:', jobId);
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
      Alert.alert('Fehler', 'Bitte wähle mindestens 1 Stern');
      return;
    }

    setSaving(true);
    try {
      const review = {
        jobId: String(jobId),
        workerId: user.id,
        employerId: job.employerId,
        rating,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      console.log('💾 Worker: Saving review:', JSON.stringify(review, null, 2));
      const result = await addReview(review);
      console.log('✅ Worker: Review saved successfully:', JSON.stringify(result, null, 2));
      
      // Job als "completed" markieren nach Bewertung
      console.log('📝 Worker: Marking job as completed:', job.id);
      await updateJob(job.id, { status: 'completed' });
      console.log('✅ Job marked as completed after worker review');
      
      setShowSuccessModal(true);

      setTimeout(() => {
        router.replace('/(worker)/matches');
      }, 2500);
    } catch (error) {
      console.error('❌ Error saving review:', error);
      Alert.alert('Fehler', 'Bewertung konnte nicht gespeichert werden: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!job) {
    console.log('❌ Worker Rate: Job nicht gefunden. JobId:', jobId);
    
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle" size={64} color={COLORS.neon} style={{ marginBottom: 16 }} />
          <Text style={{ color: COLORS.white, fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            Job konnte nicht geladen werden
          </Text>
          <Text style={{ color: COLORS.whiteTransparent30, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            JobId: {jobId || 'nicht vorhanden'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: COLORS.neon,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: COLORS.black, fontWeight: '700' }}>Zurück</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 16 }}>
              <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, flex: 1 }}>
              Auftraggeber bewerten
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            >
              {/* Job Info */}
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.neon, fontWeight: '700', marginBottom: 8 }}>
                  JOB
                </Text>
                <Text style={{ fontSize: 18, color: COLORS.white, fontWeight: '700' }}>
                  {job.title}
                </Text>
              </View>

              {/* Employer Info */}
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 32,
              }}>
                <Text style={{ fontSize: 14, color: COLORS.neon, fontWeight: '700', marginBottom: 8 }}>
                  AUFTRAGGEBER
                </Text>
                <Text style={{ fontSize: 18, color: COLORS.white, fontWeight: '700' }}>
                  {employer?.company || employer?.firstName || 'Auftraggeber'}
                </Text>
              </View>

              {/* Rating */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '700', marginBottom: 16 }}>
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
                        color={rating >= star ? COLORS.neon : 'rgba(255,255,255,0.3)'}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '700', marginBottom: 12 }}>
                  Kommentar (optional)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Teile deine Erfahrung..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    color: COLORS.white,
                    fontSize: 15,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSave}
                disabled={saving || rating === 0}
                style={({ pressed }) => ({
                  backgroundColor: rating === 0 ? 'rgba(200,255,22,0.3)' : COLORS.neon,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
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
