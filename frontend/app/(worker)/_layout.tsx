import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { TabButton } from '../../components/TabButton';

const COLORS = {
  bg: '#141126',
  card: '#252041',
  border: 'rgba(255,255,255,0.1)',
  purple: '#7C5CFF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.5)',
};

export default function WorkerLayout() {
  const { user, loading } = useAuth();
  const [matchesCount, setMatchesCount] = useState(0);

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
      screenOptions={({ route }) => {
        const map = {
          feed: { label: 'Aktuell' },
          jobs: { label: 'Alle Jobs' },
          applications: { label: 'Bewerbungen' },
          matches: { label: 'Matches' },
          profile: { label: 'Profil' },
        };

        const tab = map[route.name];

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            height: 85,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 12,
            paddingBottom: 20,
            paddingHorizontal: 8,
            elevation: 0,
          },
          tabBarButton: (props) => {
            const { onPress, accessibilityState } = props;
            const focused = accessibilityState?.selected;

            return (
              <TabButton
                onPress={onPress}
                focused={focused}
                label={tab?.label}
                badge={route.name === 'matches' ? matchesCount : undefined}
              />
            );
          },
        };
      }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="applications" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="registration-data" options={{ href: null }} />
      <Tabs.Screen name="rate" options={{ href: null }} />
      <Tabs.Screen name="profile-wizard" options={{ href: null }} />
    </Tabs>
  );
}
