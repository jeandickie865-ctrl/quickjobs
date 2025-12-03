// app/(employer)/_layout.tsx – BACKUP DARK DESIGN
import React, { useState, useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob } from '../../utils/applicationStore';

const COLORS = {
  bg: '#0E0B1F',
  card: '#141126',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
};

export default function EmployerLayout() {
  const { user, loading } = useAuth();
  const [matchesCount, setMatchesCount] = useState<number>(0);

  // Count matches (accepted AND paid applications)
  useEffect(() => {
    if (!user || user.role !== 'employer') return;

    const loadMatchesCount = async () => {
      try {
        const jobs = await getEmployerJobs(user.id);
        let count = 0;
        
        for (const job of jobs) {
          const apps = await getApplicationsForJob(job.id);
          const paidMatches = apps.filter(app => 
            app.status === 'accepted' && app.paymentStatus === 'paid'
          );
          count += paidMatches.length;
        }
        
        setMatchesCount(count);
      } catch (err) {
        console.error('Error counting matches:', err);
      }
    };

    loadMatchesCount();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadMatchesCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

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
        tabBarStyle: {
          backgroundColor: '#1A1A2E',
          height: Platform.OS === 'ios' ? 78 : 70,
          paddingBottom: Platform.OS === 'ios' ? 18 : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          shadowOpacity: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
        },
      }}
    >
      {/* Tab 1: Meine Aufträge */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{
                color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: focused ? '800' : '600',
              }}>
                Aufträge
              </Text>
              {focused && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#5941FF',
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
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{
                color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: focused ? '800' : '600',
              }}>
                Bewerb.
              </Text>
              {focused && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#5941FF',
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
          tabBarIcon: () => null,
          tabBarLabel: ({ focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{
                color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: focused ? '800' : '600',
              }}>
                Matches
              </Text>
              {focused && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#5941FF',
                }} />
              )}
              {matchesCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -10,
                  backgroundColor: '#C8FF16',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '900',
                    color: '#000',
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
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{
                color: focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: focused ? '800' : '600',
              }}>
                Profil
              </Text>
              {focused && (
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#5941FF',
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

      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tabs
        }}
      />

      {/* Hide all registration screens from tabs */}
      <Tabs.Screen
        name="registration/[applicationId]"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="registration/start"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="registration/prepare"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="registration/confirm"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="registration/done"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
