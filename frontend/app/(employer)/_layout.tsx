import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#EFABFF',
  footerBg: '#C97BEA',
  activeTabBg: '#D48DFF',
  neon: '#EFABFF',
  accent: '#EFABFF',
  white: '#FFFFFF',
  text: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.5)',
  muted: 'rgba(255,255,255,0.85)',
  bg: '#00A07C',
  card: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.25)',
};

// Custom Tab Button Component (Pill-Style)
function PillTabButton({ label, isFocused, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
      }}
    >
      <View
        style={{
          backgroundColor: isFocused ? COLORS.purple : COLORS.lightPurple,
          borderRadius: 20,
          paddingVertical: 10,
          paddingHorizontal: 14,
          minWidth: 60,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: isFocused ? '#FFFFFF' : '#1A0F3D',
            fontSize: 11,
            fontWeight: '700',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

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

  if (!user || user.role !== 'employer') return <Redirect href="/auth/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 80,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#1A0F3D',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          borderRadius: 20,
          marginHorizontal: 3,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: COLORS.lightPurple,
            borderRadius: 18,
            marginHorizontal: 3,
            height: 36,
          }
        }} 
      />
      <Tabs.Screen 
        name="jobs" 
        options={{ 
          title: 'Aufträge',
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: COLORS.lightPurple,
            borderRadius: 18,
            marginHorizontal: 3,
            height: 36,
          }
        }} 
      />
      <Tabs.Screen 
        name="applications" 
        options={{ 
          title: 'Bewerber',
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: COLORS.lightPurple,
            borderRadius: 18,
            marginHorizontal: 3,
            height: 36,
          }
        }} 
      />
      <Tabs.Screen 
        name="matches" 
        options={{ 
          title: 'Matches',
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: COLORS.lightPurple,
            borderRadius: 18,
            marginHorizontal: 3,
            height: 36,
          }
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: COLORS.lightPurple,
            borderRadius: 18,
            marginHorizontal: 3,
            height: 36,
          }
        }} 
      />

      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="payment/index" options={{ href: null }} />
      <Tabs.Screen name="registration/start" options={{ href: null }} />
      <Tabs.Screen name="registration/prepare" options={{ href: null }} />
      <Tabs.Screen name="registration/confirm" options={{ href: null }} />
      <Tabs.Screen name="registration/done" options={{ href: null }} />
      <Tabs.Screen name="registration/[applicationId]" options={{ href: null }} />
      <Tabs.Screen name="jobs/create" options={{ href: null }} />
      <Tabs.Screen name="jobs/[id]" options={{ href: null }} />
      <Tabs.Screen name="jobs/rate" options={{ href: null }} />
    </Tabs>
  );
}
