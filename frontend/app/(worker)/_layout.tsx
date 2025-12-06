import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';
import { TabButton } from '../../components/TabButton';

const COLORS = {
  purple: '#6B4BFF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.5)',
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 70,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
        tabBarButton: (props: any) => {
          const { onPress, accessibilityState } = props;
          const focused = accessibilityState?.selected;

          let iconName: any = 'home';
          let label = 'Home';
          let badge = undefined;

          if (route.name === 'feed') {
            iconName = 'thunderstorm';
            label = 'Aktuell';
          } else if (route.name === 'jobs') {
            iconName = 'briefcase';
            label = 'Alle Jobs';
          } else if (route.name === 'applications') {
            iconName = 'document-text';
            label = 'Bewerbungen';
          } else if (route.name === 'matches') {
            iconName = 'heart';
            label = 'Matches';
            badge = matchesCount;
          } else if (route.name === 'profile') {
            iconName = 'person';
            label = 'Profil';
          }

          return (
            <TabButton
              onPress={onPress}
              focused={focused}
              label={label}
              badge={badge}
            />
          );
        },
      })}
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
          backgroundColor: '#FF4444',
          color: COLORS.white,
          fontSize: 9,
          fontWeight: '700',
          minWidth: 16,
          height: 16,
          borderRadius: 8,
        } : undefined,
      }}
    />
  );
}
