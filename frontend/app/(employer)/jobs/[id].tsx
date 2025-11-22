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
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Title */}
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: '800', 
        marginBottom: 8,
        letterSpacing: -0.5 
      }}>
        Bewerber
      </Text>
      
      <Text style={{ 
        color: colors.neon, 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 24 
      }}>
        {job.title}
      </Text>

      {apps.length === 0 && (
        <View style={{
          backgroundColor: colors.white,
          padding: 32,
          borderRadius: 18,
          alignItems: 'center',
        }}>
          <Text style={{ 
            color: colors.gray600, 
            fontSize: 16, 
            textAlign: 'center' 
          }}>
            Noch keine Bewerber vorhanden.
          </Text>
        </View>
      )}

      {apps.map((app) => (
        <View
          key={app.id}
          style={{
            backgroundColor: colors.white,
            padding: 20,
            borderRadius: 18,
            marginBottom: 16,
            gap: 16,
          }}
        >
          {/* Profile Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{
              borderWidth: 4,
              borderColor: colors.neon,
              borderRadius: 40,
              padding: 2,
            }}>
              <Image
                source={
                  app.worker?.photo_url
                    ? { uri: app.worker.photo_url }
                    : { uri: 'https://via.placeholder.com/70/CCCCCC/000000?text=W' }
                }
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: '#E0E0E0',
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: colors.black, 
                fontSize: 18, 
                fontWeight: '700',
                marginBottom: 4 
              }}>
                {app.worker?.name || 'Arbeitnehmer'}
              </Text>
              <Text style={{ color: colors.gray600, fontSize: 14 }}>
                📍 {app.worker?.city || '—'}
              </Text>
            </View>
          </View>

          {/* Categories */}
          <View>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8 
            }}>
              KATEGORIEN
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(app.worker?.categories || []).map((cat, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>
                    {cat}
                  </Text>
                </View>
              ))}
              {(!app.worker?.categories || app.worker.categories.length === 0) && (
                <Text style={{ color: colors.gray500, fontSize: 14 }}>—</Text>
              )}
            </View>
          </View>

          {/* Activities */}
          <View>
            <Text style={{ 
              color: colors.neon, 
              fontSize: 12, 
              fontWeight: '700', 
              letterSpacing: 0.5,
              marginBottom: 8 
            }}>
              AKTIVITÄTEN
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(app.worker?.activities || []).slice(0, 5).map((act, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: colors.gray100,
                    borderRadius: 12,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ color: colors.gray700, fontSize: 12 }}>
                    {act}
                  </Text>
                </View>
              ))}
              {(!app.worker?.activities || app.worker.activities.length === 0) && (
                <Text style={{ color: colors.gray500, fontSize: 14 }}>—</Text>
              )}
            </View>
          </View>

          {/* Application Date */}
          <Text style={{ 
            color: colors.gray500, 
            fontSize: 12,
            marginTop: 4 
          }}>
            Beworben am: {new Date(app.created_at).toLocaleDateString('de-DE')}
          </Text>

          {/* Select Button */}
          <Pressable
            onPress={() => handleSelect(app.id)}
            disabled={selecting === app.id || app.status !== 'applied'}
            style={{
              marginTop: 8,
              backgroundColor: 
                selecting === app.id || app.status !== 'applied' 
                  ? colors.gray400 
                  : colors.neon,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {selecting === app.id ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={{ 
                color: colors.black, 
                fontWeight: '700', 
                fontSize: 16 
              }}>
                {app.status === 'applied' ? '✓ Diesen auswählen' : '✓ Bereits ausgewählt'}
              </Text>
            )}
          </Pressable>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
