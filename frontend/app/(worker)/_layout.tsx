import React, { useState, useEffect } from 'react';
import { Tabs, Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationsForWorker } from '../../utils/applicationStore';

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
  const [matchesCount, setMatchesCount] = useState(0);

  // Load matches count
  useEffect(() => {
    if (!user) return;
    
    async function loadMatchesCount() {
      try {
        const apps = await getApplicationsForWorker(user.id);
        const acceptedApps = apps.filter(app => app.status === 'accepted');
        setMatchesCount(acceptedApps.length);
      } catch (error) {
        console.error('Error loading matches count:', error);
      }
    }
    
    loadMatchesCount();
  }, [user]);

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
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#4A35D9',
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
      {/* Tab 1: Aktuelle Jobs */}
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.15)',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              minWidth: 100,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Aktuelle Jobs
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
              paddingHorizontal: 20,
              borderRadius: 12,
              minWidth: 100,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Bewerbungen
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
              minWidth: 100,
              alignItems: 'center',
              flexDirection: 'row',
              gap: 6,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Matches
              </Text>
              {matchesCount > 0 && (
                <View style={{
                  backgroundColor: focused ? COLORS.purple : COLORS.neon,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  minWidth: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '900',
                    color: focused ? COLORS.neon : COLORS.black,
                  }}>
                    {matchesCount}
                  </Text>
                </View>
              )}
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
              minWidth: 100,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: focused ? '#000000' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Profil
              </Text>
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
      
      <Tabs.Screen
        name="rate"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}