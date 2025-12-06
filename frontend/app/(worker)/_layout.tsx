import React, { useState } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { getWorkerApplications } from '../../utils/applicationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  purple: '#7C5CFF',
  lightPurple: '#A891FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  inactive: 'rgba(255,255,255,0.65)',
  bg: '#141126',
  card: '#252041',
  border: 'rgba(255,255,255,0.1)',
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

  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          height: 90,
          paddingBottom: Math.max(insets.bottom, 15),
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarShowLabel: false,
        tabBarButton: (props: any) => {
          const { children, onPress, accessibilityState, route } = props;
          const isFocused = accessibilityState?.selected;
          
          // Extract route name from props
          const routeName = route?.name || props.to?.split('/').pop() || '';
          
          // Map route names to display labels
          const labelMap: any = {
            feed: 'Aktuell',
            jobs: 'Jobs',
            applications: 'Bewerbungen',
            matches: 'Matches',
            profile: 'Profil',
          };
          
          const displayLabel = labelMap[routeName] || routeName;
          
          // Get badge if it's matches tab
          const badge = routeName === 'matches' ? matchesCount : undefined;
          
          return (
            <PillTabButton 
              label={displayLabel} 
              isFocused={isFocused} 
              onPress={onPress}
              badge={badge}
            />
          );
        },
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Aktuell' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Alle Jobs' }} />
      <Tabs.Screen name="applications" options={{ title: 'Bewerbungen' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="rate" options={{ href: null }} />
      <Tabs.Screen name="profile-wizard" options={{ href: null }} />
      <Tabs.Screen name="registration-data" options={{ href: null }} />
      <Tabs.Screen name="jobs/[id]" options={{ href: null }} />
    </Tabs>
  );
}
