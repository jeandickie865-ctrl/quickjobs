// app/(employer)/matches.tsx - NEON-TECH MATCHES SCREEN
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { getApplicationsForJob, JobApplication } from '../../utils/applicationStore';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  neonShadow: 'rgba(200,255,22,0.2)',
};

type Match = {
  job: Auftrag;
  application: JobApplication;
};

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Neon Glimmer Effect (Loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMatches();
  }, [user]);

  async function loadMatches() {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load employer's jobs
      const employerJobs = await getEmployerJobs(user.id);
      
      // Find all accepted applications
      const allMatches: Match[] = [];
      for (const job of employerJobs) {
        const jobApps = await getApplicationsForJob(job.id);
        const acceptedApps = jobApps.filter(app => app.status === 'accepted');
        
        for (const app of acceptedApps) {
          allMatches.push({ job, application: app });
        }
      }
      
      // Sort by creation date (newest first)
      allMatches.sort((a, b) => 
        new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
      );
      
      setMatches(allMatches);
      
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <Animated.View style={{
        position: 'absolute',
        top: -80,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: glimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.08, 0.15],
        }),
        blur: 60,
      }} />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>
            Meine Matches
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.white, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
            Alle bestätigten Arbeitsverhältnisse
          </Text>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 20 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={COLORS.neon} size="large" />
            <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 18,
            padding: 40,
            alignItems: 'center',
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
          }}>
            <Ionicons name="people-outline" size={64} color={COLORS.darkGray} />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: COLORS.black, 
              marginTop: 16,
              textAlign: 'center'
            }}>
              Noch keine Matches
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: COLORS.darkGray, 
              marginTop: 8,
              textAlign: 'center'
            }}>
              Sobald du eine Bewerbung akzeptierst, erscheint sie hier.
            </Text>
          </View>
        ) : (
          <>
            {matches.map((match) => (
              <View
                key={`${match.job.id}-${match.application.id}`}
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: 18,
                  padding: 20,
                  shadowColor: COLORS.neon,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                }}
              >
                {/* Worker Info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: COLORS.neon,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.black }}>
                      {match.application.workerName?.charAt(0) || 'W'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.black }}>
                      {match.application.workerName || 'Worker'}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.darkGray, marginTop: 2 }}>
                      Match seit {formatDate(match.application.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Job Info */}
                <View style={{ 
                  backgroundColor: COLORS.lightGray, 
                  borderRadius: 12, 
                  padding: 12,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 6 }}>
                    {match.job.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="briefcase-outline" size={14} color={COLORS.darkGray} />
                    <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
                      {match.job.category}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      // TODO: Navigate to chat
                      console.log('Navigate to chat for job', match.job.id);
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: COLORS.neon,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: COLORS.neon,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="chatbubble-outline" size={18} color={COLORS.black} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black }}>
                        Zum Chat
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push(`/(employer)/jobs/${match.job.id}`)}
                    style={({ pressed }) => ({
                      borderWidth: 2,
                      borderColor: COLORS.neon,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                      Auftragsdetails
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
