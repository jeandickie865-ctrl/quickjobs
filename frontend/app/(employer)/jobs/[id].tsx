// app/(employer)/jobs/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getJobById, getApplicationsForJob, selectWorker, getWorkerProfileById } from '../../../services/api';
import { useTheme } from '../../../theme/ThemeProvider';

export default function EmployerJobApplicants() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();

  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const jobData = await getJobById(id);
      setJob(jobData);

      const applications = await getApplicationsForJob(id);

      const appsWithProfile = await Promise.all(
        applications.map(async (app) => {
          const worker = await getWorkerProfileById(app.worker_id);
          return { ...app, worker };
        })
      );

      setApps(appsWithProfile);
    } catch (err) {
      console.log('Error loading applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (applicationId) => {
    try {
      setSelecting(applicationId);
      await selectWorker(applicationId);
      Alert.alert('Erfolg', 'Worker wurde ausgewählt.');
      loadData();
    } catch (err) {
      Alert.alert('Fehler', err.message);
    } finally {
      setSelecting(null);
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '700' }}>
        Bewerber für: {job.title}
      </Text>

      {apps.length === 0 && (
        <Text style={{ color: colors.text, opacity: 0.6 }}>Noch keine Bewerber vorhanden.</Text>
      )}

      {apps.map((app) => (
        <View
          key={app.id}
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.accent,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image
              source={
                app.worker?.photo_url
                  ? { uri: app.worker.photo_url }
                  : { uri: 'https://via.placeholder.com/60' }
              }
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 2,
                borderColor: colors.accent,
              }}
            />

            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                {app.worker?.name || 'Arbeitnehmer'}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {app.worker?.city || '—'}
              </Text>
            </View>
          </View>

          <Text style={{ color: colors.text, fontWeight: '600' }}>Kategorien:</Text>
          <Text style={{ color: colors.textMuted }}>
            {app.worker?.categories?.join(', ') || '—'}
          </Text>

          <Text style={{ color: colors.text, fontWeight: '600', marginTop: 6 }}>
            Aktivitäten:
          </Text>
          <Text style={{ color: colors.textMuted }}>
            {app.worker?.activities?.join(', ') || '—'}
          </Text>

          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Beworben am: {new Date(app.created_at).toLocaleDateString()}
          </Text>

          <Pressable
            onPress={() => handleSelect(app.id)}
            disabled={selecting === app.id || app.status !== 'applied'}
            style={{
              marginTop: 10,
              borderWidth: 2,
              borderColor: colors.accent,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
              opacity: selecting === app.id || app.status !== 'applied' ? 0.5 : 1,
            }}
          >
            {selecting === app.id ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={{ color: colors.accent, fontWeight: '700' }}>
                {app.status === 'applied' ? 'Diesen auswählen' : 'Bereits ausgewählt'}
              </Text>
            )}
          </Pressable>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
