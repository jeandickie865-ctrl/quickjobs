// app/(employer)/_layout.tsx - NEON-TECH TAB NAVIGATION
import React, { useEffect, useRef } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  whiteTransparent60: 'rgba(255,255,255,0.6)',
  neonTransparent20: 'rgba(200,255,22,0.2)',
};

// Custom Tab Icon with Animation
function TabIcon({ 
  focused, 
  iconName, 
  color 
}: { 
  focused: boolean; 
  iconName: keyof typeof Ionicons.glyphMap; 
  color: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      // Scale animation: 1.0 → 1.08 → 1.0
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [focused]);

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      backgroundColor: focused ? COLORS.neonTransparent20 : 'transparent',
      borderRadius: 12,
      padding: 8,
    }}>
      <Ionicons
        name={iconName}
        size={24}
        color={color}
      />
    </Animated.View>
  );
}

export default function EmployerLayout() {
  const { user, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

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
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.purple,
            borderTopWidth: 1,
            borderTopColor: COLORS.neon,
            height: Platform.OS === 'ios' ? 85 : 72,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarActiveTintColor: COLORS.neon,
          tabBarInactiveTintColor: COLORS.whiteTransparent60,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
        }}
      >
        {/* Tab 1: Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon 
                focused={focused} 
                iconName="grid-outline" 
                color={color} 
              />
            ),
          }}
        />

        {/* Tab 2: Auftrag erstellen */}
        <Tabs.Screen
          name="jobs/create"
          options={{
            title: 'Erstellen',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon 
                focused={focused} 
                iconName="add-circle-outline" 
                color={color} 
              />
            ),
          }}
        />

        {/* Tab 3: Matches */}
        <Tabs.Screen
          name="matches"
          options={{
            title: 'Matches',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon 
                focused={focused} 
                iconName="people-outline" 
                color={color} 
              />
            ),
          }}
        />

        {/* Tab 4: Zahlung */}
        <Tabs.Screen
          name="payment"
          options={{
            title: 'Zahlung',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon 
                focused={focused} 
                iconName="card-outline" 
                color={color} 
              />
            ),
          }}
        />

        {/* Tab 5: Profil */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon 
                focused={focused} 
                iconName="person-circle-outline" 
                color={color} 
              />
            ),
          }}
        />

        {/* Hidden Routes (nicht in Tabs sichtbar) */}
        <Tabs.Screen
          name="jobs/[id]"
          options={{
            href: null, // Hide from tabs
          }}
        />
        
        <Tabs.Screen
          name="jobs/rate"
          options={{
            href: null, // Hide from tabs
          }}
        />

        <Tabs.Screen
          name="chat/[userId]"
          options={{
            href: null, // Hide from tabs
          }}
        />
      </Tabs>
    </Animated.View>
  );
}
