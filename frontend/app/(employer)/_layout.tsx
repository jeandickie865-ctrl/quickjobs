// app/(employer)/_layout.tsx - FINAL NEON-TECH DESIGN WITH TABS
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
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
  const { user, loading } = useAuth();

  if (loading) {
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
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#4A35D9', // Etwas hellerer Purple für besseren Kontrast
          borderTopWidth: 3,
          borderTopColor: COLORS.neon,
          height: Platform.OS === 'ios' ? 95 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 15,
          elevation: 25,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      {/* Tab 1: Meine Aufträge */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.15)',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              minWidth: 85,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Aufträge
              </Text>
            </View>
          ),
        }}
      />

      {/* Tab 2: Bewerbungen */}
      <Tabs.Screen
        name="applications"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.15)',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              minWidth: 85,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Bewerb.
              </Text>
            </View>
          ),
        }}
      />

      {/* Tab 3: Matches */}
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.15)',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              minWidth: 85,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Matches
              </Text>
            </View>
          ),
        }}
      />

      {/* Tab 4: Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.15)',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              minWidth: 85,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Profil
              </Text>
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

      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
