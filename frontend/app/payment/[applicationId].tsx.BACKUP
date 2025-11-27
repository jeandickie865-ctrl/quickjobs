// app/payment/[applicationId].tsx - 20% Plattformgebühr Screen (NEON DESIGN + MOCK PAYMENT)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationById, acceptApplication } from '../../utils/applicationStore';
import { getJobById, updateJob } from '../../utils/jobStore';
import { getWorkerProfile } from '../../utils/profileStore';
import { euro } from '../../utils/pricing';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';
import { WorkerProfile } from '../../types/profile';

const COLORS = {
  purple: '#5941FF',
  purpleDark: '#3E2DD9',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
};

type PaymentMethod = 'card' | 'paypal';

export default function PaymentScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  async function loadData() {
    console.log('🔍 loadData called with applicationId:', applicationId);
    
    if (!applicationId) {
      console.error('❌ No applicationId provided!');
      return;
    }
    
    try {
      console.log('📝 Fetching application with ID:', applicationId);
      const app = await getApplicationById(applicationId);
      
      if (app) {
        console.log('✅ Application found:', app);
        setApplication(app);
        
        const j = await getJobById(app.jobId);
        console.log('✅ Job found:', j?.title);
        setJob(j);
        
        // Worker-Profil laden für Anzeige
        const profile = await getWorkerProfile(app.workerId);
        console.log('✅ Worker profile found:', profile?.firstName);
        setWorkerProfile(profile);
      } else {
        console.error('❌ Application not found in AsyncStorage');
      }
    } catch (e) {
      console.error('❌ Error loading payment data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMockPayment() {
    if (!selectedMethod || !job || !application || !user) {
      console.error('❌ Missing data:', { selectedMethod, hasJob: !!job, hasApp: !!application, hasUser: !!user });
      return;
    }

    console.log('💳 MOCK PAYMENT START');
    console.log('   - Method:', selectedMethod.toUpperCase());
    console.log('   - Job ID:', job.id);
    console.log('   - Application ID:', application.id);
    console.log('   - Worker ID:', application.workerId);
    
    setPaying(true);

    try {
      // Simuliere Zahlungsverarbeitung (2 Sekunden)
      console.log('⏳ Simulating payment (2 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Payment simulation complete');

      // JETZT Match erstellen
      console.log('📝 Step 1: Accepting application...');
      await acceptApplication(application.id);
      console.log('✅ Step 1 complete');
      
      console.log('📝 Step 2: Updating job status...');
      await updateJob(job.id, { 
        status: 'matched', 
        matchedWorkerId: application.workerId 
      });
      console.log('✅ Step 2 complete');
      
      console.log('🎉 MATCH CREATED SUCCESSFULLY!');
      
      // Success-Meldung anzeigen mit rechtlichem Haftungsausschluss
      alert(
        '✅ Zahlung erfolgreich!\n' +
        '🎉 Das Match wurde freigeschaltet.\n\n' +
        'Wichtiger Hinweis:\n' +
        'Die Plattform vermittelt nur den Kontakt zwischen Arbeitgeber und Arbeitnehmer.\n\n' +
        'Die Parteien sind selbst verantwortlich für:\n' +
        '• Anmeldung und Registrierung (falls erforderlich)\n' +
        '• Zahlung der Vergütung\n' +
        '• Einhaltung steuerlicher und rechtlicher Pflichten\n' +
        '• Abschluss eventueller Arbeits- oder Dienstleistungsverträge\n\n' +
        'Die Plattform übernimmt keine Haftung für Vereinbarungen, Zahlungen oder die Durchführung des Auftrags.'
      );
      
      // Weiterleitung nach erfolgreicher Zahlung
      console.log('🔄 Redirecting to employer matches...');
      console.log("NAVIGATION REALLY REACHED");
      router.replace('/(employer)/matches');
      
    } catch (e) {
      console.error('❌ ERROR in handleMockPayment:', e);
      if (e instanceof Error) {
        console.error('   - Message:', e.message);
        console.error('   - Stack:', e.stack);
      }
    } finally {
      console.log('🏁 Payment process finished (setting paying=false)');
      setPaying(false);
    }
  }

  if (isLoading) return null;

  if (!user || user.role !== 'employer') {
    return <Redirect href="/start" />;
  }

  if (loading || !job || !application) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
          <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Zahlung...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const platformFee = Math.round(job.workerAmountCents * 0.20);
  const workerName = workerProfile?.firstName 
    ? `${workerProfile.firstName}${workerProfile.lastName ? ' ' + workerProfile.lastName.charAt(0) + '.' : ''}`
    : 'Worker';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purpleDark }}>
      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ 
            flex: 1, 
            fontSize: 18, 
            fontWeight: '700', 
            color: COLORS.white,
            textAlign: 'center',
            marginRight: 26, // Ausgleich für Zurück-Button
          }}>
            Plattformgebühr bezahlen
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 20 }}
      >
        {/* Info Card */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 20,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        }}>
          <Text style={{ fontSize: 16, color: COLORS.darkGray, marginBottom: 12, lineHeight: 24 }}>
            Du zahlst hier nur die <Text style={{ fontWeight: '700', color: COLORS.purple }}>20% Vermittlungsgebühr</Text>.
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 22 }}>
            Die Vergütung an <Text style={{ fontWeight: '700' }}>{workerName}</Text> erfolgt direkt zwischen euch nach Auftragsabschluss.
          </Text>
        </View>

        {/* Kostenübersicht */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 20,
        }}>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '700', 
            color: COLORS.neon, 
            marginBottom: 16,
            letterSpacing: 0.5,
          }}>
            KOSTENÜBERSICHT
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: COLORS.darkGray }}>Auftrag:</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.black, flex: 1, textAlign: 'right' }}>{job.title}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#E0E0E0' }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: COLORS.darkGray }}>Vergütung Auftrag:</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.black }}>{euro(job.workerAmountCents)}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#E0E0E0' }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Plattformgebühr (20%):</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.purple }}>{euro(platformFee)}</Text>
            </View>
          </View>
        </View>

        {/* Zahlungsmethoden */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 20,
        }}>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '700', 
            color: COLORS.neon, 
            marginBottom: 16,
            letterSpacing: 0.5,
          }}>
            ZAHLUNGSMETHODE WÄHLEN
          </Text>

          {/* Kreditkarte */}
          <Pressable 
            onPress={() => setSelectedMethod('card')}
            style={{
              borderWidth: 3,
              borderColor: selectedMethod === 'card' ? COLORS.neon : '#E0E0E0',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              backgroundColor: selectedMethod === 'card' ? 'rgba(200, 255, 22, 0.05)' : COLORS.white,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>💳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  Kreditkarte
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.darkGray, marginTop: 2 }}>
                  Visa, Mastercard, American Express
                </Text>
              </View>
              {selectedMethod === 'card' && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: COLORS.neon,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* PayPal */}
          <Pressable 
            onPress={() => setSelectedMethod('paypal')}
            style={{
              borderWidth: 3,
              borderColor: selectedMethod === 'paypal' ? COLORS.neon : '#E0E0E0',
              borderRadius: 12,
              padding: 16,
              backgroundColor: selectedMethod === 'paypal' ? 'rgba(200, 255, 22, 0.05)' : COLORS.white,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>🔵</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  PayPal
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.darkGray, marginTop: 2 }}>
                  Schnell und sicher bezahlen
                </Text>
              </View>
              {selectedMethod === 'paypal' && (
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: COLORS.neon,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700' }}>✓</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Mock-Hinweis */}
          <View style={{
            backgroundColor: '#FFF3CD',
            padding: 12,
            borderRadius: 8,
            marginTop: 16,
          }}>
            <Text style={{ fontSize: 12, color: '#856404', fontWeight: '600', lineHeight: 18 }}>
              ⚠️ TEST-MODUS: Dies ist eine Demo-Zahlung. Es wird kein echtes Geld abgebucht.
            </Text>
          </View>
        </View>

        {/* Zahlung Button */}
        <Pressable
          onPress={handleMockPayment}
          disabled={!selectedMethod || paying}
          style={({ pressed }) => ({
            backgroundColor: !selectedMethod || paying ? '#CCCCCC' : COLORS.neon,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: 'center',
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
          })}
        >
          {paying ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={{ 
              fontSize: 17, 
              fontWeight: '700', 
              color: !selectedMethod ? '#666' : COLORS.black 
            }}>
              {euro(platformFee)} jetzt bezahlen (TEST)
            </Text>
          )}
        </Pressable>

        {/* Abbrechen Button */}
        <Pressable
          onPress={() => router.back()}
          disabled={paying}
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
            Abbrechen
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
