// app/(worker)/matches.tsx - NEON TECH DESIGN
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getMyApplications, getJobById } from '../../services/api';
import { useTheme } from '../../theme/ThemeProvider';

export default function WorkerMatchesScreen() {
  const { colors } = useTheme();
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
    let bgColor = colors.neon;

    if (status === 'applied') label = 'Bewerbung gesendet';
    if (status === 'selected') {
      label = '✓ Ausgewählt';
      bgColor = '#10B981';
    }
    if (status === 'pending_payment') {
      label = '⏳ Zahlung läuft';
      bgColor = '#F59E0B';
    }
    if (status === 'active') {
      label = '🎉 Match aktiv';
      bgColor = colors.neon;
    }

    return (
      <View
        style={{
          backgroundColor: bgColor,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: colors.black, fontWeight: '700', fontSize: 12 }}>
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
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.neon} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: '800', 
        marginBottom: 24,
        letterSpacing: -0.5 
      }}>
        Deine Bewerbungen
      </Text>

      {applications.length === 0 && (
        <View style={{
          backgroundColor: colors.white,
          padding: 32,
          borderRadius: 18,
          alignItems: 'center',
        }}>
          <Text style={{ 
            color: colors.gray600, 
            fontSize: 16, 
            textAlign: 'center',
            lineHeight: 24 
          }}>
            Du hast noch keine Bewerbungen.
          </Text>
        </View>
      )}

      {applications.map((app) => (
        <View
          key={app.id}
          style={{
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
            gap: 12,
          }}
        >
          {/* Job Title */}
          <Text style={{ 
            color: colors.black, 
            fontSize: 20, 
            fontWeight: '700',
            marginBottom: 4 
          }}>
            {app.job?.title || 'Job'}
          </Text>

          {/* Status Badge */}
          {renderStatus(app.status)}

          {/* Job Details */}
          {app.job && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.gray600, fontSize: 14 }}>
                📍 {app.job.city}
              </Text>
              {app.job.categories && app.job.categories.length > 0 && (
                <Text style={{ color: colors.gray600, fontSize: 14, marginTop: 4 }}>
                  🏷️ {app.job.categories.slice(0, 3).join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Date */}
          <Text style={{ 
            color: colors.gray500, 
            fontSize: 12, 
            marginTop: 4 
          }}>
            Beworben am: {new Date(app.created_at).toLocaleDateString('de-DE')}
          </Text>

          {/* Chat Button for Active Matches */}
          {app.status === 'active' && (
            <Pressable
              onPress={() => router.push(`/chat/${app.id}`)}
              style={{
                marginTop: 12,
                backgroundColor: colors.neon,
                paddingVertical: 14,
                alignItems: 'center',
                borderRadius: 14,
              }}
            >
              <Text style={{ 
                color: colors.black, 
                fontWeight: '700', 
                fontSize: 16 
              }}>
                💬 Zum Chat
              </Text>
            </Pressable>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
