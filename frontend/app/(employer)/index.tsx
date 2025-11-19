import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { euro } from '../../utils/pricing';

export default function EmployerDashboard() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const employerJobs = await getEmployerJobs(user.id);
      setJobs(employerJobs);
      setIsLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800' }}>
            Meine Jobs
          </Text>
        </View>

        <Button
          title="+ Neuen Job erstellen"
          onPress={() => router.push('/(employer)/jobs/create')}
        />

        {isLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.black} />
          </View>
        ) : jobs.length === 0 ? (
          <View style={{
            padding: spacing.xl,
            backgroundColor: colors.white,
            borderRadius: 12,
            alignItems: 'center',
            gap: 8
          }}>
            <Text style={{ color: colors.gray700, fontSize: 16, textAlign: 'center' }}>
              Noch keine Jobs erstellt
            </Text>
            <Text style={{ color: colors.gray500, fontSize: 14, textAlign: 'center' }}>
              Erstelle deinen ersten Job, um Arbeitnehmer zu finden
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {jobs.map((job) => (
              <Pressable
                key={job.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.gray200,
                  gap: 8
                }}
                onPress={() => router.push(`/(employer)/jobs/${job.id}`)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ color: colors.black, fontSize: 16, fontWeight: '700', flex: 1 }}>
                    {job.title}
                  </Text>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: job.status === 'open' ? colors.beige100 : colors.gray200,
                    borderRadius: 6
                  }}>
                    <Text style={{ color: colors.black, fontSize: 11, fontWeight: '600' }}>
                      {job.status === 'open' ? 'Offen' : 
                       job.status === 'matched' ? 'Vergeben' : 
                       job.status === 'done' ? 'Erledigt' : 'Abgesagt'}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.gray700, fontSize: 14 }}>
                  {job.category}
                </Text>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ color: colors.gray600, fontSize: 13 }}>
                    📍 {job.address}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: colors.gray600, fontSize: 13 }}>
                    {job.timeMode === 'fixed_time' ? '⏱ Zeitgenau' :
                     job.timeMode === 'hour_package' ? `⏱ ${job.hours}h` : '⏱ Projekt'}
                  </Text>
                  <Text style={{ color: colors.black, fontSize: 15, fontWeight: '700' }}>
                    {euro(job.workerAmountCents)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
