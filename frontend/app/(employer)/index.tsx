// app/(employer)/index.tsx - Green Modern Minimal (Auftraggeber Dashboard)
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';

export default function EmployerDashboard() {
  const { colors, spacing } = useTheme();
  const { user, signOut } = useAuth();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryUltraLight }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      >
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.black, fontSize: 28, fontWeight: '800' }}>
            Meine Aufträge
          </Text>
          <Text style={{ color: colors.gray600, fontSize: 14, marginTop: 4 }}>
            Verwalte deine Aufträge und finde Jobstarter
          </Text>
        </View>

        <Button
          title="+ Neuen Auftrag erstellen"
          onPress={() => router.push('/(employer)/jobs/create')}
        />

        {isLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : jobs.length === 0 ? (
          <Card padding={spacing.xl}>
            <Text style={{ color: colors.black, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
              Noch keine Aufträge erstellt
            </Text>
            <Text style={{ color: colors.gray600, fontSize: 14, textAlign: 'center' }}>
              Erstelle deinen ersten Auftrag, um Jobstarter zu finden
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.md }}>
            {jobs.map((job) => (
              <Pressable
                key={job.id}
                onPress={() =>
                  router.push({
                    pathname: '/(employer)/jobs/[id]',
                    params: { id: job.id },
                  })
                }
              >
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <Text style={{ color: colors.black, fontSize: 17, fontWeight: '700', flex: 1 }}>
                      {job.title}
                    </Text>
                    <View style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: job.status === 'open' ? colors.primaryLight : colors.gray200,
                      borderRadius: 8
                    }}>
                      <Text style={{ color: job.status === 'open' ? colors.primary : colors.gray600, fontSize: 11, fontWeight: '600' }}>
                        {job.status === 'open' ? 'Offen' : 
                         job.status === 'matched' ? 'Vergeben' : 
                         job.status === 'done' ? 'Erledigt' : 'Abgesagt'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: colors.gray600, fontSize: 14, marginBottom: spacing.xs }}>
                    {job.category}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: spacing.xs }}>
                    <Text style={{ color: colors.gray600, fontSize: 13 }}>
                      📍 {formatAddress(job.address) || 'Keine Adresse'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: colors.gray600, fontSize: 13 }}>
                      {job.timeMode === 'fixed_time' ? '⏱ Zeitgenau' :
                       job.timeMode === 'hour_package' ? `⏱ ${job.hours}h` : '⏱ Projekt'}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
                      {euro(job.workerAmountCents)}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button
            title="Logout"
            variant="ghost"
            onPress={async () => {
              await signOut();
              router.replace('/auth/start');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
