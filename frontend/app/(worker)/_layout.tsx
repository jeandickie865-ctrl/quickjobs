import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#EFABFF',
  footerBg: '#C97BEA',
  activeTabBg: '#D48DFF',
  neon: '#EFABFF',
  accent: '#EFABFF',
  white: '#FFFFFF',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.85)',
  bg: '#00A07C',
};

// Custom Tab Button Component (Pill-Style)
function PillTabButton({ label, isFocused, onPress, badge }: any) {
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
          backgroundColor: isFocused ? COLORS.activeTabBg : 'transparent',
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          minWidth: 60,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: COLORS.white,
            fontSize: 11,
            fontWeight: isFocused ? '700' : '600',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: COLORS.neon,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={{ color: COLORS.bg, fontSize: 11, fontWeight: 'bold' }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  if (!user || user.role !== 'worker') return <Redirect href="/auth/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.footerBg,
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
        name="feed" 
        options={{ 
          title: 'Aktuelle Jobs',
          tabBarLabel: 'Aktuelle Jobs',
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
        name="alljobs/index" 
        options={{ 
          title: 'Alle Jobs',
          tabBarLabel: 'Alle Jobs',
          tabBarLabelStyle: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
          },
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
          title: 'Bewerbungen',
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
          tabBarBadge: matchesCount > 0 ? matchesCount : undefined,
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

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="rate" options={{ href: null }} />
      <Tabs.Screen name="profile-wizard" options={{ href: null }} />
      <Tabs.Screen name="registration-data" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="alljobs/[id]" options={{ href: null }} />
    </Tabs>
  );
}
