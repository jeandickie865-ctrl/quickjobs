// app/(worker)/jobs/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getJobById, getMyApplications, applyForJob } from '../../../services/api';

const COLORS = {
  neon: '#C8FF16',
  bg: '#000',
  white: '#fff',
  gray: '#777',
  dark: '#0A0A0A',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadJob();
    checkIfApplied();
  }, []);

  const loadJob = async () => {
    try {
      const data = await getJobById(id);
      setJob(data);
    } catch (err) {
      console.log('Job load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const apps = await getMyApplications();
      const exists = apps.some((app) => app.job_id === id);
      setHasApplied(exists);
    } catch (err) {
      console.log('Application check error:', err);
    }
  };

  const handleApply = async () => {
    try {
      setIsApplying(true);
      await applyForJob(id);

      setHasApplied(true);
      Alert.alert('Erfolg', 'Bewerbung gesendet');
    } catch (err) {
      Alert.alert('Fehler', err.message);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!job) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: COLORS.white }}>Job nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <Text style={{ color: COLORS.neon, fontSize: 24, fontWeight: '700' }}>
        {job.title}
      </Text>

      <View
        style={{
          backgroundColor: COLORS.dark,
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: COLORS.neon,
          gap: 10,
        }}
      >
        <Text style={{ color: COLORS.white, fontSize: 16 }}>
          {job.description || 'Keine Beschreibung'}
        </Text>

        <Text style={{ color: COLORS.gray, fontSize: 14 }}>
          {job.street}, {job.postal_code} {job.city}
        </Text>

        <Text style={{ color: COLORS.white, fontSize: 14, marginTop: 10 }}>
          Kategorien:
        </Text>
        <Text style={{ color: COLORS.gray }}>
          {job.categories?.join(', ') || '—'}
        </Text>

        <Text style={{ color: COLORS.white, fontSize: 14, marginTop: 10 }}>
          Qualifikationen:
        </Text>
        <Text style={{ color: COLORS.gray }}>
          {job.qualifications?.join(', ') || '—'}
        </Text>
      </View>

      <Pressable
        onPress={handleApply}
        disabled={hasApplied || isApplying}
        style={{
          marginTop: 10,
          borderWidth: 2,
          borderColor: COLORS.neon,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          opacity: hasApplied || isApplying ? 0.6 : 1,
        }}
      >
        {isApplying ? (
          <ActivityIndicator color={COLORS.neon} />
        ) : (
          <Text
            style={{
              color: COLORS.neon,
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            {hasApplied ? 'Beworben' : 'Ich habe Zeit'}
          </Text>
        )}
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
