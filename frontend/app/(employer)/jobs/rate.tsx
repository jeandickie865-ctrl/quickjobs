// app/(employer)/jobs/rate.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { getJobById, updateJob } from '../../../utils/jobStore';
import { getWorkerProfile } from '../../../utils/profileStore';
import { addReview } from '../../../utils/reviewStore';
import { getAuthHeaders } from '../../../utils/api';
import { Job } from '../../../types/job';
import { WorkerProfile } from '../../../types/profile';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://job-connector-7.preview.emergentagent.com/api';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  whiteTransparent30: 'rgba(255,255,255,0.3)',
  neonShadow: 'rgba(200,255,22,0.15)',
  dimmed: 'rgba(0,0,0,0.7)',
};

export default function RateWorkerScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; jobId?: string; workerId?: string }>();

  // Get jobId from either 'id' or 'jobId' param
  const jobId = params.id || params.jobId;

  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animations
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
      console.log('❌ No jobId provided');
      setLoading(false);
      return;
    }

    try {
      console.log('📋 Employer Rate: Loading job:', jobId);
      const jobData = await getJobById(String(jobId));
      setJob(jobData);
      console.log('✅ Employer Rate: Job loaded:', jobData?.title);
      
      // Get workerId from params or from job
      const targetWorkerId = params.workerId || jobData?.matchedWorkerId;
      console.log('👤 Employer Rate: Loading worker with ID:', targetWorkerId);
      
      if (targetWorkerId) {
        // DIRECT API CALL - Bypass getWorkerProfile
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/profiles/worker/${targetWorkerId}`, {
          method: 'GET',
          headers,
        });
        
        console.log('📡 Employer Rate: Worker API response status:', response.status);
        
        if (response.ok) {
          const workerData = await response.json();
          setWorker(workerData);
          console.log('✅ Employer Rate: Worker loaded:', workerData?.firstName, workerData?.lastName);
        } else {
          const errorText = await response.text();
          console.error('❌ Employer Rate: Failed to load worker:', response.status, errorText);
        }
      } else {
        console.error('❌ Employer Rate: No workerId available!');
      }
    } catch (error) {
      console.error('❌ Employer Rate: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!job || !worker || !user) return;

    if (rating < 1 || rating > 5) {
      Alert.alert('Fehler', 'Bitte wähle mindestens 1 Stern');
      return;
    }

    setSaving(true);
    try {
      const review = {
        jobId: String(jobId),
        workerId: worker.userId,
        employerId: user.id,
        rating,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      console.log('💾 Saving employer review:', review);
      await addReview(review);
      console.log('✅ Review saved successfully');
      
      // Job als "completed" markieren nach Bewertung
      await updateJob(job.id, { status: 'completed' });
      console.log('✅ Job marked as completed after employer review');
      
      setShowSuccessModal(true);

      // Auto-redirect nach 2.5 Sekunden
      setTimeout(() => {
        router.replace(`/(employer)/jobs/${jobId}`);
      }, 2500);
    } catch (error) {
      console.error('Error saving review:', error);
      Alert.alert('Fehler', 'Bewertung konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;
  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

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
    console.log('❌ Employer Rate: Job fehlt!', jobId);
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.white, fontSize: 18, marginBottom: 16 }}>Job nicht gefunden</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: COLORS.neon, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: COLORS.black, fontWeight: '700' }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }
  
  if (!worker) {
    console.log('❌ Employer Rate: Worker fehlt!', params.workerId);
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: COLORS.white, fontSize: 18, marginBottom: 16 }}>Worker-Profil nicht gefunden</Text>
        <Text style={{ color: COLORS.whiteTransparent30, fontSize: 14, marginBottom: 16 }}>WorkerId: {params.workerId}</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: COLORS.neon, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: COLORS.black, fontWeight: '700' }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        marginLeft: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.12,
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
            Bewertung abgeben
          </Text>
          <View style={{ width: 26 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
        >
          {/* Worker Info Card */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
              AUFTRAGNEHMER
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.purple, marginBottom: 4 }}>
              {worker.name || 'Auftragnehmer'}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
              für Job: {job.title}
            </Text>
          </View>

          {/* Rating Card */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 24,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
              STERNE-BEWERTUNG
            </Text>

            {/* Stars */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: 16, 
              marginBottom: 20,
              paddingVertical: 10,
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable 
                  key={star} 
                  onPress={() => setRating(star)}
                  style={({ pressed }) => ({
                    padding: 4,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={56}
                    color={star <= rating ? '#C8FF16' : '#CCCCCC'}
                  />
                </Pressable>
              ))}
            </View>

            {/* Rating Text */}
            {rating > 0 && (
              <Text style={{ fontSize: 15, color: COLORS.darkGray, textAlign: 'center', fontWeight: '600' }}>
                {rating === 1 && 'Schlecht'}
                {rating === 2 && 'Nicht so gut'}
                {rating === 3 && 'Okay'}
                {rating === 4 && 'Gut'}
                {rating === 5 && 'Ausgezeichnet'}
              </Text>
            )}
          </View>

          {/* Comment Card */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
              KOMMENTAR (OPTIONAL)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Wie war deine Erfahrung mit diesem Worker?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: COLORS.black,
                backgroundColor: '#F8F8F8',
                borderRadius: 12,
                padding: 16,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={rating === 0 || saving}
            style={({ pressed }) => ({
              backgroundColor: rating === 0 || saving ? '#E8E8E8' : COLORS.neon,
              paddingVertical: 18,
              borderRadius: 18,
              alignItems: 'center',
              marginTop: 20,
              opacity: pressed ? 0.9 : 1,
              shadowColor: rating > 0 && !saving ? COLORS.neon : 'transparent',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            })}
          >
            <Text style={{ 
              fontSize: 17, 
              fontWeight: '700', 
              color: rating === 0 || saving ? COLORS.darkGray : COLORS.black,
            }}>
              {saving ? 'Speichert...' : 'Bewertung speichern'}
            </Text>
          </Pressable>

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={{
          flex: 1,
          backgroundColor: COLORS.dimmed,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <Animated.View style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            width: '100%',
            maxWidth: 340,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
            transform: [{ scale: successScale }],
          }}>
            {/* Neon Checkmark */}
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.neon,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}>
              <Ionicons name="checkmark" size={50} color={COLORS.black} />
            </View>

            {/* Success Text */}
            <Text style={{
              fontSize: 24,
              fontWeight: '900',
              color: COLORS.purple,
              textAlign: 'center',
              marginBottom: 12,
            }}>
              Danke für deine Bewertung!
            </Text>

            <Text style={{
              fontSize: 15,
              color: COLORS.darkGray,
              textAlign: 'center',
              lineHeight: 22,
            }}>
              Dein Feedback wurde erfolgreich gespeichert.
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
