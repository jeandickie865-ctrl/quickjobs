// app/(worker)/matches.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getMyApplications, getJobById } from '../../services/api';

const COLORS = {
  neon: '#C8FF16',
  bg: '#000',
  white: '#fff',
  gray: '#777',
  dark: '#0A0A0A',
};

export default function WorkerMatchesScreen() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const apps = await getMyApplications();

      const appsWithJob = await Promise.all(
        apps.map(async (app) => {
          const job = await getJobById(app.job_id);
          return { ...app, job };
        })
      );

      setApplications(appsWithJob);
    } catch (err) {
      console.log('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status) => {
    let label = '';

    if (status === 'applied') label = 'Bewerbung gesendet';
    if (status === 'selected') label = 'Ausgewählt – warte auf Zahlung';
    if (status === 'pending_payment') label = 'Zahlung läuft';
    if (status === 'active') label = 'Match aktiv';

    return (
      <View
        style={{
          backgroundColor: COLORS.neon,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: COLORS.bg, fontWeight: '700', fontSize: 12 }}>
          {label}
        </Text>
      </View>
    );
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
        <ActivityIndicator color={COLORS.neon} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text style={{ color: COLORS.neon, fontSize: 22, fontWeight: '700', marginBottom: 10 }}>
        Deine Bewerbungen
      </Text>

      {applications.length === 0 && (
        <Text style={{ color: COLORS.white, fontSize: 16, opacity: 0.6 }}>
          Du hast noch keine Bewerbungen.
        </Text>
      )}

      {applications.map((app) => (
        <View
          key={app.id}
          style={{
            borderWidth: 2,
            borderColor: COLORS.neon,
            borderRadius: 12,
            padding: 16,
            backgroundColor: COLORS.dark,
            gap: 10,
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '600' }}>
            {app.job?.title || 'Job'}
          </Text>

          {renderStatus(app.status)}

          <Text style={{ color: COLORS.gray, fontSize: 12 }}>
            Beworben am: {new Date(app.created_at).toLocaleDateString()}
          </Text>

          {app.status === 'active' && (
            <Pressable
              onPress={() => router.push(`/chat/${app.id}`)}
              style={{
                marginTop: 12,
                borderWidth: 2,
                borderColor: COLORS.neon,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 10,
              }}
            >
              <Text style={{ color: COLORS.neon, fontWeight: '700' }}>Zum Chat</Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
