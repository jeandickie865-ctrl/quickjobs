import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Auftrag } from '../../types/job';
import { WorkerProfile } from '../../types/profile';
import { getWorkerProfile } from '../../utils/profileStore';
import { getOpenAufträge } from '../../utils/jobStore';
import { filterMatchingAufträge, sortAufträgeByMatch, calculateDistance } from '../../utils/matching';
import { euro } from '../../utils/pricing';
import { listCategories } from '../../src/taxonomy';

export default function WorkerFeed() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [allAufträge, setAllAufträge] = useState<Job[]>([]);
  const [matchingAufträge, setMatchingAufträge] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [workerProfile, openAufträge] = await Promise.all([
        getWorkerProfile(user.id),
        getOpenAufträge()
      ]);

      setProfile(workerProfile);
      setAllAufträge(openAufträge);

      if (workerProfile) {
        const matches = filterMatchingAufträge(openAufträge, workerProfile);
        const sorted = sortAufträgeByMatch(matches, workerProfile);
        setMatchingAufträge(sorted);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.black} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile || profile.categories.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
          <Text style={{ color: colors.black, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
            Profil vervollständigen
          </Text>
          <Text style={{ color: colors.gray600, fontSize: 15, textAlign: 'center' }}>
            Bitte ergänze dein Profil mit Kategorien und Qualifikationen, um passende Aufträge zu sehen.
          </Text>
          <Pressable
            onPress={() => router.push('/(worker)/profile')}
            style={{
              backgroundColor: colors.black,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
              marginTop: spacing.sm
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>
              Zum Profil
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const categories = listCategories();
  const getCategoryLabel = (key: string) => {
    return categories.find(c => c.key === key)?.label || key;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.black}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800' }}>
            Aufträge für dich
          </Text>
          <Pressable onPress={() => router.push('/(worker)/profile')}>
            <Text style={{ color: colors.gray700, fontSize: 14 }}>⚙️ Profil</Text>
          </Pressable>
        </View>

        {matchingAufträge.length === 0 ? (
          <View style={{
            padding: spacing.xl,
            backgroundColor: colors.white,
            borderRadius: 12,
            alignItems: 'center',
            gap: 8
          }}>
            <Text style={{ color: colors.gray700, fontSize: 16, textAlign: 'center' }}>
              {allAufträge.length === 0 
                ? 'Noch keine Aufträge verfügbar'
                : 'Keine passenden Aufträge gefunden'
              }
            </Text>
            <Text style={{ color: colors.gray500, fontSize: 14, textAlign: 'center' }}>
              {allAufträge.length === 0
                ? 'Schau später nochmal vorbei'
                : 'Versuche deinen Radius oder deine Kategorien anzupassen'
              }
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {matchingAufträge.map((job) => {
              const distance = profile ? calculateDistance(profile.homeLat, profile.homeLon, job.lat, job.lon) : 0;
              
              return (
                <Pressable
                  key={job.id}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.gray200,
                    gap: 10
                  }}
                  onPress={() => {
                    // TODO: Job-Detail-Screen
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: colors.black, fontSize: 17, fontWeight: '700' }}>
                        {job.title}
                      </Text>
                      <Text style={{ color: colors.gray600, fontSize: 13 }}>
                        {getCategoryLabel(job.category)}
                      </Text>
                    </View>
                    <Text style={{ color: colors.black, fontSize: 18, fontWeight: '800' }}>
                      {euro(job.workerAmountCents)}
                    </Text>
                  </View>

                  {job.description && (
                    <Text 
                      style={{ color: colors.gray700, fontSize: 14 }} 
                      numberOfLines={2}
                    >
                      {job.description}
                    </Text>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: colors.beige100,
                      borderRadius: 6
                    }}>
                      <Text style={{ fontSize: 12 }}>📍</Text>
                      <Text style={{ color: colors.gray700, fontSize: 12, fontWeight: '500' }}>
                        {distance.toFixed(1)} km
                      </Text>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: colors.beige100,
                      borderRadius: 6
                    }}>
                      <Text style={{ fontSize: 12 }}>⏱</Text>
                      <Text style={{ color: colors.gray700, fontSize: 12, fontWeight: '500' }}>
                        {job.timeMode === 'fixed_time' && job.startAt 
                          ? new Date(job.startAt).toLocaleDateString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : job.timeMode === 'hour_package' 
                            ? `${job.hours}h` 
                            : 'Projekt'
                        }
                      </Text>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: colors.beige100,
                      borderRadius: 6
                    }}>
                      <Text style={{ fontSize: 12 }}>💰</Text>
                      <Text style={{ color: colors.gray700, fontSize: 12, fontWeight: '500' }}>
                        {job.paymentToWorker === 'cash' ? 'Bar' : 
                         job.paymentToWorker === 'bank' ? 'Überweisung' : 'PayPal'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: colors.gray500, fontSize: 12, marginTop: 4 }}>
                    📍 {job.address}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
