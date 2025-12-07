import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { Job } from '../../../types/job';
import { getEmployerJobs } from '../../../utils/jobStore';
import { euro } from '../../../utils/pricing';
import { formatAddress } from '../../../types/address';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#141126',
  card: '#1C1838',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#7C5CFF',
  neon: '#C8FF16',
};

// 🚨 Sofortmeldepflichtige Kategorien
const SOFORTMELDEPFLICHTIG = new Set([
  'cleaning',
  'gastronomy',
  'logistics',
  'transport',
  'moving'
]);

export default function EmployerJobsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isUpcomingJob = (job: Job) => {
    if (!job) return false;
    
    const now = new Date();
    
    // Neue Format: ISO-Timestamps (startAt, endAt)
    if (job.startAt && job.startAt.includes('T')) {
      const jobStartDate = new Date(job.startAt);
      const jobEndDate = job.endAt ? new Date(job.endAt) : jobStartDate;
      
      // Job ist upcoming wenn endAt in der Zukunft ist
      return jobEndDate > now;
    }
    
    // Altes Format: date + startAt/endAt als Uhrzeiten
    if (!job.date) return false;
    if (!job.startAt || !job.endAt) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobDate = new Date(job.date);
    jobDate.setHours(0, 0, 0, 0);

    return jobDate >= today;
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function load() {
        if (!user) return;
        setIsLoading(true);

        try {
          const allJobs = await getEmployerJobs(user.id);
          if (!mounted) return;

          const upcoming = allJobs
            .filter(isUpcomingJob)
            .sort((a, b) => {
              const dateA = new Date(a.date + 'T' + a.startAt);
              const dateB = new Date(b.date + 'T' + b.startAt);
              return dateA.getTime() - dateB.getTime();
            });

          setJobs(upcoming);
        } catch (error) {
          console.error('Error loading jobs:', error);
        } finally {
          if (mounted) setIsLoading(false);
        }
      }

      load();
      return () => { mounted = false; };
    }, [user])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.white }}>
          Meine Aufträge
        </Text>
      </View>

      {/* Create Job Button */}
      <View style={{ padding: 16 }}>
        <Pressable
          onPress={() => router.push('/(employer)/jobs/create')}
          style={{
            backgroundColor: COLORS.purple,
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
            Neuen Auftrag erstellen
          </Text>
        </Pressable>
      </View>

      {/* Jobs List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {jobs.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 16, marginTop: 16, textAlign: 'center' }}>
              Noch keine Aufträge erstellt
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              Erstellen Sie Ihren ersten Auftrag
            </Text>
          </View>
        ) : (
          jobs.map((job) => {
            const needsRegistration = SOFORTMELDEPFLICHTIG.has(job.category);
            const statusColor = 
              job.status === 'matched' ? COLORS.neon :
              job.status === 'open' ? COLORS.purple :
              COLORS.muted;

            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/(employer)/jobs/${job.id}`)}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                {/* Job Title & Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', flex: 1 }}>
                    {job.title}
                  </Text>
                  <View style={{ backgroundColor: statusColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: COLORS.bg, fontSize: 12, fontWeight: '600' }}>
                      {job.status === 'matched' ? 'Vergeben' : 
                       job.status === 'open' ? 'Offen' : 
                       job.status}
                    </Text>
                  </View>
                </View>

                {/* Date & Time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.muted} />
                  <Text style={{ color: COLORS.muted, fontSize: 14, marginLeft: 6 }}>
                    {(() => {
                      // Neue Format: ISO-Timestamps
                      if (job.startAt && job.startAt.includes('T')) {
                        const startDate = new Date(job.startAt);
                        const endDate = job.endAt ? new Date(job.endAt) : null;
                        const dateStr = startDate.toLocaleDateString('de-DE');
                        const startTime = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                        const endTime = endDate ? endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
                        return `${dateStr} · ${startTime}${endTime ? ' - ' + endTime : ''}`;
                      }
                      // Altes Format: date + startAt/endAt als Uhrzeiten
                      if (job.date) {
                        return `${new Date(job.date).toLocaleDateString('de-DE')} · ${job.startAt} - ${job.endAt}`;
                      }
                      return 'Datum nicht verfügbar';
                    })()}
                  </Text>
                </View>

                {/* Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="location-outline" size={16} color={COLORS.muted} />
                  <Text style={{ color: COLORS.muted, fontSize: 14, marginLeft: 6 }}>
                    {formatAddress(job.address)}
                  </Text>
                </View>

                {/* Hourly Rate */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="cash-outline" size={16} color={COLORS.muted} />
                  <Text style={{ color: COLORS.muted, fontSize: 14, marginLeft: 6 }}>
                    {euro(job.hourlyRate)}/Std
                  </Text>
                </View>

                {/* Registration Warning */}
                {needsRegistration && (
                  <View style={{ backgroundColor: 'rgba(255,193,7,0.1)', padding: 8, borderRadius: 6, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="warning" size={16} color="#FFC107" />
                      <Text style={{ color: '#FFC107', fontSize: 12, marginLeft: 6 }}>
                        Sofortmeldung erforderlich
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
