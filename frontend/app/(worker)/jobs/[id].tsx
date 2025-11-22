// app/(worker)/jobs/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getJobById, getMyApplications, applyForJob } from '../../../services/api';
import { useTheme } from '../../../theme/ThemeProvider';

export default function JobDetailScreen() {
  const { colors } = useTheme();
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
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Job nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
    >
      <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '700' }}>
        {job.title}
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.accent,
          gap: 10,
        }}
      >
        <Text style={{ color: '#000000', fontSize: 16 }}>
          {job.description || 'Keine Beschreibung'}
        </Text>

        <Text style={{ color: '#666666', fontSize: 14 }}>
          {job.street}, {job.postal_code} {job.city}
        </Text>

        <Text style={{ color: '#000000', fontSize: 14, marginTop: 10 }}>
          Kategorien:
        </Text>
        <Text style={{ color: '#666666' }}>
          {job.categories?.join(', ') || '—'}
        </Text>

        <Text style={{ color: '#000000', fontSize: 14, marginTop: 10 }}>
          Qualifikationen:
        </Text>
        <Text style={{ color: '#666666' }}>
          {job.qualifications?.join(', ') || '—'}
        </Text>
      </View>

      <Pressable
        onPress={handleApply}
        disabled={hasApplied || isApplying}
        style={{
          marginTop: 10,
          borderWidth: 2,
          borderColor: colors.accent,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          opacity: hasApplied || isApplying ? 0.6 : 1,
        }}
      >
        {isApplying ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>
            {hasApplied ? 'Beworben' : 'Ich habe Zeit'}
          </Text>
        )}
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
