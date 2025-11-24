import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#8A8A8A',
};

export default function WorkerLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.purple }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/start" />;
  }

  if (user.role !== 'worker') {
    return <Redirect href="/start" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.purple,
          borderTopWidth: 2,
          borderTopColor: COLORS.neon,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: COLORS.neon,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Feed */}
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="grid-outline"
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

      {/* Tab 2: Bewerbungen */}
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Bewerbungen',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name="document-text-outline"
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

      {/* Hidden Routes */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="jobs/[id]"
        options={{
          href: null,
        }}
      />

      {/* Hide Backup Files */}
      <Tabs.Screen
        name="feed-old-backup"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="matches-old-backup"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="profile-old-backup"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="profile-readonly-backup"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="matching-debug-backup"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}