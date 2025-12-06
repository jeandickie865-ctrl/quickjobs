import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
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

export default function EmployerLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 90,
          paddingBottom: Math.max(insets.bottom, 15),
          paddingTop: 12,
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
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: () => null }} />
      <Tabs.Screen name="applications" options={{ title: 'Aufträge', tabBarIcon: () => null }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: () => null }} />

      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="payment/index" options={{ href: null }} />
      <Tabs.Screen name="registration/start" options={{ href: null }} />
      <Tabs.Screen name="registration/prepare" options={{ href: null }} />
      <Tabs.Screen name="registration/confirm" options={{ href: null }} />
      <Tabs.Screen name="registration/done" options={{ href: null }} />
      <Tabs.Screen name="registration/[applicationId]" options={{ href: null }} />
    </Tabs>
  );
}
