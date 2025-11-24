// app/(employer)/_layout.tsx - FINAL NEON-TECH DESIGN WITH TABS
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  whiteTransparent45: 'rgba(255,255,255,0.45)',
  whiteTransparent55: 'rgba(255,255,255,0.55)',
};

export default function EmployerLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.purple }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/start" />;
  }

  if (user.role !== 'employer') {
    return <Redirect href="/start" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.purple,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 80,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: COLORS.neon,
        tabBarInactiveTintColor: COLORS.whiteTransparent45,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Tab 1: Meine Aufträge */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Meine Aufträge',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="briefcase-outline"
                size={28}
                color={color}
              />
              {focused && (
                <View style={{
                  position: 'absolute',
                  bottom: -14,
                  left: -8,
                  right: -8,
                  height: 3,
                  backgroundColor: COLORS.neon,
                  borderRadius: 2,
                }} />
              )}
            </View>
          ),
        }}
      />

      {/* Tab 2: Auftrag erstellen */}
      <Tabs.Screen
        name="jobs/create"
        options={{
          title: 'Erstellen',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={color}
              />
              {focused && (
                <View style={{
                  position: 'absolute',
                  bottom: -14,
                  left: -8,
                  right: -8,
                  height: 3,
                  backgroundColor: COLORS.neon,
                  borderRadius: 2,
                }} />
              )}
            </View>
          ),
        }}
      />

      {/* Tab 3: Matches */}
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="heart-outline"
                size={28}
                color={color}
              />
              {focused && (
                <View style={{
                  position: 'absolute',
                  bottom: -14,
                  left: -8,
                  right: -8,
                  height: 3,
                  backgroundColor: COLORS.neon,
                  borderRadius: 2,
                }} />
              )}
            </View>
          ),
        }}
      />

      {/* Tab 4: Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="person-circle-outline"
                size={28}
                color={color}
              />
              {focused && (
                <View style={{
                  position: 'absolute',
                  bottom: -14,
                  left: -8,
                  right: -8,
                  height: 3,
                  backgroundColor: COLORS.neon,
                  borderRadius: 2,
                }} />
              )}
            </View>
          ),
        }}
      />

      {/* Hidden Routes (nicht in Tabs) */}
      <Tabs.Screen
        name="jobs"
        options={{
          href: null, // Hide from tabs
        }}
      />

      <Tabs.Screen
        name="payment"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
