// app/(worker)/matching-debug.tsx - MATCHING DEBUG TOOL
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile } from '../../utils/profileStore';
import { getJobs } from '../../utils/jobStore';
import { matchJobToWorkerRobust, MatchResult } from '../../utils/matchingRobust';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#666666',
  green: '#4CAF50',
  red: '#FF4444',
  orange: '#FF9800',
};

export default function MatchingDebugScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && user) {
      loadDebugData();
    }
  }, [authLoading, user]);

  async function loadDebugData() {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load worker profile
      const profile = await getWorkerProfile(user.id);
      if (!profile) {
        console.log('❌ No worker profile found');
        return;
      }
      setWorkerProfile(profile);
      
      // Load all jobs
      const allJobs = await getJobs();
      console.log(`📊 Total jobs in system: ${allJobs.length}`);
      
      // Run matching for each job
      const matchResults: MatchResult[] = [];
      for (const job of allJobs) {
        const result = matchJobToWorkerRobust(job, profile);
        matchResults.push(result);
      }
      
      // Sort: failed matches first, then by job title
      matchResults.sort((a, b) => {
        if (a.matches && !b.matches) return 1;
        if (!a.matches && b.matches) return -1;
        return 0;
      });
      
      setResults(matchResults);
      
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(jobId: string) {
    const newSet = new Set(expandedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setExpandedJobs(newSet);
  }

  if (authLoading) return null;
  if (!user || user.role !== 'worker') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 16 }}>Analysiere Matching...</Text>
      </View>
    );
  }

  const matchedCount = results.filter(r => r.matches).length;
  const failedCount = results.filter(r => !r.matches).length;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.1)',
        }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 16 }}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white, flex: 1 }}>
            🔍 Matching Debug
          </Text>
          <Pressable onPress={loadDebugData} style={{ padding: 4 }}>
            <Ionicons name="refresh" size={24} color={COLORS.neon} />
          </Pressable>
        </View>

        {/* Summary */}
        <View style={{ padding: 20, backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 8 }}>
            📊 Zusammenfassung
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1, backgroundColor: COLORS.green, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>
                {matchedCount}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white, textAlign: 'center' }}>
                Matches
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: COLORS.red, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white, textAlign: 'center' }}>
                {failedCount}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white, textAlign: 'center' }}>
                Nicht matched
              </Text>
            </View>
          </View>

          {/* Worker Profile Summary */}
          {workerProfile && (
            <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                Dein Profil:
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white }}>
                Kategorien: {workerProfile.categories?.join(', ') || 'Keine'}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white }}>
                Skills: {workerProfile.selectedTags?.length || 0} Tags
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.white }}>
                Radius: {workerProfile.radiusKm || 0} km
              </Text>
            </View>
          )}
        </View>

        {/* Results */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {results.map((result, index) => {
            const job = result.details.find(d => d.step.includes('Job'))?.info?.jobTitle;
            const isExpanded = expandedJobs.has(result.jobId);
            
            return (
              <Pressable
                key={index}
                onPress={() => toggleExpand(result.jobId)}
                style={{
                  backgroundColor: result.matches ? 'rgba(76,175,80,0.2)' : 'rgba(255,68,68,0.2)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: result.matches ? COLORS.green : COLORS.red,
                }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                      {result.matches ? '✅' : '❌'} Job #{index + 1}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.white, opacity: 0.7, marginTop: 4 }}>
                      {result.reason}
                    </Text>
                  </View>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={COLORS.white} 
                  />
                </View>

                {/* Details */}
                {isExpanded && (
                  <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon, marginBottom: 8 }}>
                      Matching-Schritte:
                    </Text>
                    {result.details.map((detail, idx) => (
                      <View 
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          marginBottom: 8,
                          paddingLeft: 8,
                        }}
                      >
                        <Text style={{ fontSize: 18, marginRight: 8 }}>
                          {detail.passed ? '✅' : '❌'}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, color: COLORS.white, fontWeight: '600' }}>
                            {detail.step}
                          </Text>
                          {detail.info && (
                            <Text style={{ fontSize: 11, color: COLORS.white, opacity: 0.7, marginTop: 2 }}>
                              {JSON.stringify(detail.info, null, 2)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
