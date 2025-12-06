import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#7C5CFF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.65)',
  bg: '#141126',
  card: '#252041',
  border: 'rgba(255,255,255,0.1)',
};

export default function WorkerLayout() {
  const { user, loading } = useAuth();
  const [matchesCount, setMatchesCount] = useState(0);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      async function loadMatchesCount() {
        try {
          const apps = await getWorkerApplications();
          const accepted = apps.filter(a => a.status === 'accepted');
          setMatchesCount(accepted.length);
        } catch (err) {
          console.error('Matches count error:', err);
        }
      }
      loadMatchesCount();
    }, [user])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 75,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarActiveTintColor: COLORS.neon,
        tabBarInactiveTintColor: COLORS.inactive,
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Aktuell', tabBarIcon: () => null }} />
      <Tabs.Screen name="jobs" options={{ title: 'Alle Jobs', tabBarIcon: () => null }} />
      <Tabs.Screen name="applications" options={{ title: 'Bewerbungen', tabBarIcon: () => null }} />
      <Tabs.Screen name="matches" options={{ 
        title: 'Matches', 
        tabBarIcon: () => null,
        tabBarBadge: matchesCount > 0 ? matchesCount : undefined,
      }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: () => null }} />

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="rate" options={{ href: null }} />
      <Tabs.Screen name="profile-wizard" options={{ href: null }} />
      <Tabs.Screen name="registration-data" options={{ href: null }} />
    </Tabs>
  );
}
