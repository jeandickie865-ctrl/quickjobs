// app/(employer)/jobs/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getJobById, getApplicationsForJob, selectWorker, getWorkerProfileById } from '../../../services/api';

const COLORS = {
  neon: '#C8FF16',
  bg: '#000',
  white: '#fff',
  gray: '#999',
  dark: '#0A0A0A',
};

export default function EmployerJobApplicants() {
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
      // Job laden
      const jobData = await getJobById(id);
      setJob(jobData);

      // Bewerbungen laden
      const applications = await getApplicationsForJob(id);

      // Für jede Bewerbung Worker-Profil laden
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.white }}>Job nicht gefunden</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text style={{ color: COLORS.neon, fontSize: 24, fontWeight: '700' }}>
        Bewerber für: {job.title}
      </Text>

      {apps.length === 0 && (
        <Text style={{ color: COLORS.white, opacity: 0.6 }}>Noch keine Bewerber vorhanden.</Text>
      )}

      {apps.map((app) => (
        <View
          key={app.id}
          style={{
            backgroundColor: COLORS.dark,
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: COLORS.neon,
            gap: 12,
          }}
        >
          {/* Worker Foto */}
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
                borderColor: COLORS.neon,
              }}
            />

            <View>
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>
                {app.worker?.name || 'Arbeitnehmer'}
              </Text>
              <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                {app.worker?.city || '—'}
              </Text>
            </View>
          </View>

          {/* Kategorien */}
          <Text style={{ color: COLORS.white, fontWeight: '600' }}>Kategorien:</Text>
          <Text style={{ color: COLORS.gray }}>
            {app.worker?.categories?.join(', ') || '—'}
          </Text>

          {/* Aktivitäten */}
          <Text style={{ color: COLORS.white, fontWeight: '600', marginTop: 6 }}>
            Aktivitäten:
          </Text>
          <Text style={{ color: COLORS.gray }}>
            {app.worker?.activities?.join(', ') || '—'}
          </Text>

          {/* Status */}
          <Text style={{ color: COLORS.gray, fontSize: 12 }}>
            Beworben am: {new Date(app.created_at).toLocaleDateString()}
          </Text>

          {/* Auswahl-Button */}
          <Pressable
            onPress={() => handleSelect(app.id)}
            disabled={selecting === app.id || app.status !== 'applied'}
            style={{
              marginTop: 10,
              borderWidth: 2,
              borderColor: COLORS.neon,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
              opacity: selecting === app.id || app.status !== 'applied' ? 0.5 : 1,
            }}
          >
            {selecting === app.id ? (
              <ActivityIndicator color={COLORS.neon} />
            ) : (
              <Text style={{ color: COLORS.neon, fontWeight: '700' }}>
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
