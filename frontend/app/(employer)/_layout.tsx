import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
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
          paddingHorizontal: 16,
          minWidth: 60,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: COLORS.white,
            fontSize: 12,
            fontWeight: '600',
          }}
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

  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

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
          const { children, onPress, accessibilityState } = props;
          const isFocused = accessibilityState?.selected;
          const label = props.to?.split('/').pop() || '';
          
          // Map route names to display labels
          const labelMap: any = {
            index: 'Dashboard',
            applications: 'Aufträge',
            matches: 'Matches',
            profile: 'Profil',
          };
          
          return (
            <PillTabButton 
              label={labelMap[label] || label} 
              isFocused={isFocused} 
              onPress={onPress}
            />
          );
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="applications" options={{ title: 'Aufträge' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />

      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="payment/index" options={{ href: null }} />
      <Tabs.Screen name="registration/start" options={{ href: null }} />
      <Tabs.Screen name="registration/prepare" options={{ href: null }} />
      <Tabs.Screen name="registration/confirm" options={{ href: null }} />
      <Tabs.Screen name="registration/done" options={{ href: null }} />
      <Tabs.Screen name="registration/[applicationId]" options={{ href: null }} />
    </Tabs>
  );
}
