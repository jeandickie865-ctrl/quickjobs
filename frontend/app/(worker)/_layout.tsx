import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';

const COLORS = {
  purple: '#6B4BFF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.55)',
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
};

export default function WorkerLayout() {
  const { user, loading } = useAuth();
  const [matchesCount, setMatchesCount] = useState(0);

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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.neon} />
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
          height: Platform.OS === 'ios' ? 85 : 75,
          paddingBottom: Platform.OS === 'ios' ? 20 : 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: COLORS.neon,
        tabBarInactiveTintColor: COLORS.inactive,
      }}
    >
      {TAB('feed', 'Aktuelle Jobs')}
      {TAB('applications', 'Bewerbungen')}
      {TAB('matches', 'Matches', matchesCount)}
      {TAB('profile', 'Profil')}
      {TAB('jobs/all', 'alle Jobs')}

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="jobs/[id]" options={{ href: null }} />
      <Tabs.Screen name="rate" options={{ href: null }} />
      <Tabs.Screen name="profile-wizard" options={{ href: null }} />
      <Tabs.Screen name="registration-data" options={{ href: null }} />
    </Tabs>
  );
}

function TAB(name, label, badge) {
  return (
    <Tabs.Screen
      key={name}
      name={name}
      options={{
        tabBarIcon: () => null,
        title: label,
        tabBarBadge: badge !== undefined && badge > 0 ? badge : undefined,
        tabBarBadgeStyle: badge && badge > 0 ? {
          backgroundColor: COLORS.neon,
          color: '#000000',
          fontSize: 10,
          fontWeight: '900',
          minWidth: 18,
        } : undefined,
      }}
    />
  );
}
