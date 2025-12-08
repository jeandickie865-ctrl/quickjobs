// app/(employer)/index.tsx – BACKUP DARK DESIGN
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Job } from '../../types/job';
import { getEmployerJobs } from '../../utils/jobStore';
import { euro } from '../../utils/pricing';
import { formatAddress } from '../../types/address';
import { getEmployerProfile } from '../../utils/employerProfileStore';

const COLORS = {
  bg: '#F7F7F9',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  white: '#FFFFFF',
  muted: 'rgba(0,0,0,0.6)',
  purple: '#6A3FFF',
  neon: '#6A3FFF',
};

// 🚨 Sofortmeldepflichtige Kategorien
const SOFORTMELDEPFLICHTIG = new Set([
  'cleaning',
  'gastronomy',
  'logistics',
  'transport',
  'moving'
]);

export default function EmployerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function check() {
        if (!user) return;

        try {
          const p = await getEmployerProfile(user.id);
          if (!mounted) return;

          const isValidProfile =
            p &&
            p.firstName && 
            p.lastName &&
            p.email &&
            p.phone &&
            p.street &&
            p.city &&
            p.postalCode;

          setHasProfile(!!isValidProfile);
        } catch {
          if (mounted) setHasProfile(false);
        } finally {
          if (mounted) setProfileLoading(false);
        }
      }

      check();
      return () => (mounted = false);
    }, [user])
  );

  const isUpcomingJob = job => {
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
    if (jobDate < today) return false;

    if (jobDate.getTime() === today.getTime()) {
      const [endH, endM] = job.endAt.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);
      if (endTime < now) return false;
    }

    return true;
  };

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const j = await getEmployerJobs(user.id);
      setJobs(j.filter(isUpcomingJob));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => load(), [load]));

  if (!user) return null;

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 12 }}>Lade Profil</Text>
      </View>
    );
  }

  if (!hasProfile) return <Redirect href="/(employer)/edit-profile" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 200 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '900' }}>Meine Aufträge</Text>

        <Pressable
          onPress={() => router.push('/(employer)/jobs/create')}
          style={{
            backgroundColor: COLORS.purple,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            alignItems: 'center',
            width: '100%',
            maxWidth: 360,
          }}
        >
          <Text style={{ fontSize: 16, color: COLORS.white, fontWeight: '700' }}>+ Neuen Auftrag erstellen</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator color={COLORS.neon} />
        ) : jobs.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 24,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
              Noch keine Aufträge
            </Text>
            <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
              Erstelle deinen ersten Auftrag
            </Text>
          </View>
        ) : (
          jobs.map(job => {
            const adr = job?.address ? formatAddress(job.address) : 'Keine Adresse';
            
            return (
              <Pressable
                key={job.id}
                onPress={() => router.push({ pathname: '/(employer)/jobs/[id]', params: { id: job.id } })}
                style={{ paddingVertical: 4 }}
              >
                <View
                  style={{
                    backgroundColor: COLORS.card,
                    padding: 20,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                    <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', flex: 1 }}>
                      {job.title}
                    </Text>
                    {/* 🚨 Badge für sofortmeldepflichtige Jobs */}
                    {job.category && SOFORTMELDEPFLICHTIG.has(job.category.toLowerCase()) && (
                      <View style={{ backgroundColor: '#FF8C00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                          ⚠️ Sofortmeldung
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ color: COLORS.muted, fontSize: 14 }}>{job.category}</Text>

                  <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6 }}>
                    Adresse: {adr}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                      {job.timeMode === 'fixed_time'
                        ? 'Zeit: Zeitgenau'
                        : job.timeMode === 'hour_package'
                        ? `Zeit: ${job.hours}h`
                        : 'Zeit: Projekt'}
                    </Text>

                    <Text style={{ color: COLORS.neon, fontSize: 18, fontWeight: '900' }}>
                      {euro(job.workerAmountCents)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
