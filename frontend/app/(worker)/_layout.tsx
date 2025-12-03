import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.55)',
  bg: '#1A143A',
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
        } catch (err) {}
      }
      loadMatchesCount();
    }, [user])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.purple }}>
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
          backgroundColor: '#1A1A2E',
          height: Platform.OS === 'ios' ? 78 : 70,
          paddingBottom: Platform.OS === 'ios' ? 18 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          shadowOpacity: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
        },
      }}
    >
      {/* Helper: clean label + dot */}
      {TAB('feed', 'Aktuelle Jobs')}
      {TAB('applications', 'Bewerbungen')}
      {TAB('matches', 'Matches', matchesCount)}
      {TAB('profile', 'Profil')}
      {TAB('jobs/all', 'Jobs/All')}

      {/* Hidden routes */}
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
        tabBarLabel: ({ focused }) => (
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text
              style={{
                color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: focused ? '800' : '600',
              }}
            >
              {label}
            </Text>

            {focused ? (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#5941FF',
                }}
              />
            ) : null}

            {badge ? (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -22,
                  backgroundColor: '#C8FF16',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '900',
                    color: '#000',
                  }}
                >
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
        ),
      }}
    />
  );
}