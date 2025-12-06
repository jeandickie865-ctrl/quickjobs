import React from 'react';
import { Tabs, Redirect } from 'expo-router';
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

export default function EmployerLayout() {
  const { user, loading } = useAuth();

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
      screenOptions={({ route }) => {
        const map = {
          index: { label: 'Dashboard' },
          applications: { label: 'Aufträge' },
          matches: { label: 'Matches' },
          profile: { label: 'Profil' },
        };

        const tab = map[route.name];

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            height: 60,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 8,
            paddingBottom: 12,
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
              />
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="applications" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="registration" options={{ href: null }} />
    </Tabs>
  );
}
