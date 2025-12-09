import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#EFABFF',
  lightPurple: '#D48DFF',
  footerBg: '#C97BEA',
  activeTabBg: '#D48DFF',
  neon: '#EFABFF',
  accent: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#1A1A1A",
  text: '#1A1A1A',
  muted: 'rgba(0,0,0,0.6)',
  bg: '#FFFFFF',
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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
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
      
      async function loadUnreadChatCount() {
        try {
          const apps = await getWorkerApplications();
          const accepted = apps.filter(a => a.status === 'accepted');
          
          let totalUnread = 0;
          for (const app of accepted) {
            try {
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/chat/unread-count/${app.id}`, {
                headers: {
                  'Authorization': `Bearer ${user.token}`,
                }
              });
              if (response.ok) {
                const data = await response.json();
                totalUnread += data.unreadCount || 0;
              }
            } catch (err) {
              console.error('Error fetching unread for app:', app.id, err);
            }
          }
          setUnreadChatCount(totalUnread);
        } catch (err) {
          console.error('Unread chat count error:', err);
        }
      }
      
      loadMatchesCount();
      loadUnreadChatCount();
      
      // Poll für ungelesene Nachrichten alle 10 Sekunden
      const interval = setInterval(loadUnreadChatCount, 10000);
      return () => clearInterval(interval);
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
          width: '100%',
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingHorizontal: 12,
          borderTopWidth: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        tabBarItemStyle: {
          flex: 1,
          backgroundColor: COLORS.lightPurple,
          borderRadius: 16,
          marginHorizontal: 2,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#1A1A1A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 0,
          marginBottom: 0,
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
        }} 
      />
      <Tabs.Screen 
        name="alljobs/index" 
        options={{ 
          title: 'Alle Jobs',
          tabBarLabel: 'Alle Jobs',
        }} 
      />
      <Tabs.Screen 
        name="applications" 
        options={{ 
          title: 'Bewerbungen',
          tabBarLabel: 'Bewerb.',
        }} 
      />
      <Tabs.Screen 
        name="matches" 
        options={{ 
          title: 'Matches',
          tabBarLabel: 'Matches',
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profil',
          tabBarLabel: 'Profil',
        }} 
      />

      {/* Hidden Screens - no tab bar button */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="edit-profile" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="rate" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="profile-wizard" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="registration-data" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="documents" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
      <Tabs.Screen 
        name="alljobs/[id]" 
        options={{ 
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none', width: 0, height: 0, position: 'absolute' },
        }} 
      />
    </Tabs>
  );
}
