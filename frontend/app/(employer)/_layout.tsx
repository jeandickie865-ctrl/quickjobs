import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuthHeaders } from '../../utils/api';
import { API_URL } from '../../config';

const COLORS = {
  purple: '#EFABFF',
  footerBg: '#C97BEA',
  activeTabBg: '#D48DFF',
  neon: '#EFABFF',
  accent: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#1A1A1A",
  text: '#1A1A1A',
  inactive: 'rgba(255,255,255,0.5)',
  muted: 'rgba(0,0,0,0.6)',
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
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

export default function EmployerLayout() {
  const { user, loading } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const insets = useSafeAreaInsets();
  
  React.useEffect(() => {
    if (!user) return;
    
    async function loadUnreadChatCount() {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jobs/employer/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          }
        });
        
        if (response.ok) {
          const jobs = await response.json();
          let totalUnread = 0;
          
          for (const job of jobs) {
            try {
              const appsResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/applications/job/${job.id}`, {
                headers: {
                  'Authorization': `Bearer ${user.token}`,
                }
              });
              
              if (appsResponse.ok) {
                const applications = await appsResponse.json();
                const acceptedApps = applications.filter((app: any) => app.status === 'accepted');
                
                for (const app of acceptedApps) {
                  try {
                    const unreadResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/chat/unread-count/${app.id}`, {
                      headers: {
                        'Authorization': `Bearer ${user.token}`,
                      }
                    });
                    if (unreadResponse.ok) {
                      const data = await unreadResponse.json();
                      totalUnread += data.unreadCount || 0;
                    }
                  } catch (err) {
                    console.error('Error fetching unread for app:', app.id, err);
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching applications for job:', job.id, err);
            }
          }
          setUnreadChatCount(totalUnread);
        }
      } catch (err) {
        console.error('Unread chat count error:', err);
      }
    }
    
    loadUnreadChatCount();
    
    // Poll alle 10 Sekunden
    const interval = setInterval(loadUnreadChatCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

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
          backgroundColor: COLORS.footerBg,
          height: 80,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingHorizontal: 8,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
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
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
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
