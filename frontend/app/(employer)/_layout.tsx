// app/(employer)/_layout.tsx – BACKUP DARK DESIGN
import React, { useState, useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob } from '../../utils/applicationStore';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
};

export default function EmployerLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'employer') return;

    const loadMatchesCount = async () => {
      try {
        const jobs = await getEmployerJobs(user.id);
        let count = 0;

        for (const job of jobs) {
          const apps = await getApplicationsForJob(job.id);
          const paidMatches = apps.filter(
            app => app.status === 'accepted' && app.paymentStatus === 'paid'
          );
          count += paidMatches.length;
        }

        setMatchesCount(count);
      } catch {}
    };

    loadMatchesCount();
    const interval = setInterval(loadMatchesCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth/start" />;
  if (user.role !== 'employer') return <Redirect href="/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
        },
      }}
    >
      {TAB('index', 'Aufträge')}
      {TAB('applications', 'Bewerbungen')}
      {TAB('matches', 'Matches', matchesCount)}
      {TAB('profile', 'Profil')}

      {/* Hidden */}
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="registration/[applicationId]" options={{ href: null }} />
      <Tabs.Screen name="registration/start" options={{ href: null }} />
      <Tabs.Screen name="registration/prepare" options={{ href: null }} />
      <Tabs.Screen name="registration/confirm" options={{ href: null }} />
      <Tabs.Screen name="registration/done" options={{ href: null }} />
      <Tabs.Screen name="matches_OLD" options={{ href: null }} />
      <Tabs.Screen name="index-old-backup" options={{ href: null }} />
      <Tabs.Screen name="_layout-old-backup" options={{ href: null }} />
      <Tabs.Screen name="payment-old-backup" options={{ href: null }} />
      <Tabs.Screen name="applications-old-backup" options={{ href: null }} />
    </Tabs>
  );
}

function TAB(name, label, badge = 0) {
  const COLORS = {
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    purple: '#6B4BFF',
    neon: '#C8FF16',
  };

  return (
    <Tabs.Screen
      key={name}
      name={name}
      options={{
        tabBarIcon: () => null,
        tabBarLabel: ({ focused }) => (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                color: focused ? COLORS.white : COLORS.muted,
                fontWeight: focused ? '800' : '600',
              }}
            >
              {label}
            </Text>

            {focused && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: COLORS.neon,
                }}
              />
            )}

            {badge > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -14,
                  backgroundColor: COLORS.neon,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: '#000',
                    fontSize: 11,
                    fontWeight: '900',
                  }}
                >
                  {badge}
                </Text>
              </View>
            )}
          </View>
        ),
      }}
    />
  );
}
