// app/(worker)/jobs/[id].tsx - Job Details für Worker
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getJobById } from '../../../utils/jobStore';
import { Job } from '../../../types/job';
import { euro } from '../../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';

// NEON COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#666666',
  lightGray: '#F5F5F5',
};

export default function WorkerJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      if (!id) return;
      const data = await getJobById(String(id));
      setJob(data);
    } catch (err) {
      console.log('Job load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
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
            <Text style={{ color: COLORS.black, fontWeight: '700' }}>Zurück</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
            Jobdetails
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
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
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
          }}>
            {/* Vergütung */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                VERGÜTUNG
              </Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.black }}>
                {euro(job.workerAmountCents)}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, marginTop: 4 }}>
                {job.timeMode === 'hours' ? 'pro Stunde' : 'Gesamt'}
              </Text>
            </View>

            {/* Zeitraum */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                ZEITRAUM
              </Text>
              {job.timeMode === 'fixed_time' && job.startAt && job.endAt ? (
                <>
                  <Text style={{ fontSize: 16, color: COLORS.black }}>
                    📅 {new Date(job.startAt).toLocaleDateString('de-DE', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <Text style={{ fontSize: 16, color: COLORS.black, marginTop: 4 }}>
                    🕐 {new Date(job.startAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - {new Date(job.endAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 16, color: COLORS.black }}>
                  {job.hours} Stunden
                </Text>
              )}
            </View>

            {/* Standort */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                STANDORT
              </Text>
              <Text style={{ fontSize: 16, color: COLORS.black }}>
                📍 {job.address?.street || 'Keine Straße'}, {job.address?.postalCode || ''} {job.address?.city || 'Keine Stadt'}
              </Text>
            </View>

            {/* Kategorie */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                KATEGORIE
              </Text>
              <View style={{
                backgroundColor: COLORS.purple,
                alignSelf: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.white }}>
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
                <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                  {job.description}
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View style={{
            backgroundColor: job.status === 'matched' ? COLORS.neon : COLORS.lightGray,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.black }}>
              {job.status === 'matched' ? '✓ Du bist für diesen Job ausgewählt!' : 
               job.status === 'open' ? '🔓 Job ist offen' : 
               job.status === 'pending' ? '⏳ In Bearbeitung' : 'Status unbekannt'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
