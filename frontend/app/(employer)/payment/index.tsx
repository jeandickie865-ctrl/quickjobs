// app/(employer)/payment.tsx – BACKUP DARK DESIGN (Variante C)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getJobById } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { euro } from '../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#141126',
  card: '#1C1838',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  purpleLight: '#7C5CFF',
  neon: '#C8FF16',
  red: '#FF4D4D',
  gray: 'rgba(255,255,255,0.15)',
};

type PaymentMethod = 'card' | 'paypal' | 'sepa';

export default function PaymentScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuccess]);

  useEffect(() => {
    if (!authLoading && user && jobId) {
      (async () => {
        const foundJob = await getJobById(String(jobId));
        if (foundJob) setJob(foundJob);
        setLoading(false);
      })();
    }
  }, [authLoading, user, jobId]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setShowSuccess(true);

      setTimeout(() => {
        router.replace(`/(employer)/jobs/${jobId}`);
      }, 3000);
    }, 2000);
  };

  if (authLoading) return null;
  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.white }}>Job nicht gefunden</Text>
      </View>
    );
  }

  const provisionAmount = (job.workerAmountCents / 100) * 0.2;

  if (showSuccess) {
    const rotation = checkmarkRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View style={{ transform: [{ scale: successScale }, { rotate: rotation }], marginBottom: 32 }}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: COLORS.neon,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark" size={70} color={'#000'} />
            </View>
          </Animated.View>

          <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.white, marginBottom: 12 }}>
            Zahlung erfolgreich
          </Text>

          <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
            Dein Match ist jetzt freigeschaltet. Du kannst nun mit dem Worker chatten.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 20,
            paddingVertical: 16,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>

          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>Provision zahlen</Text>
          <View style={{ width: 26 }} />
        </View>
      </SafeAreaView>

      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Job Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>JOB</Text>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
            {job.title}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>Lohn: {euro(job.workerAmountCents)}</Text>
        </View>

        {/* Provision Card */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', marginBottom: 14 }}>
            BACKUP PROVISION (20%)
          </Text>

          <View style={{ gap: 10, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.white, fontSize: 15 }}>Job-Lohn</Text>
              <Text style={{ color: COLORS.white, fontSize: 15 }}>{euro(job.workerAmountCents)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.white, fontSize: 15 }}>Provision (20%)</Text>
              <Text style={{ color: COLORS.neon, fontSize: 15 }}>{euro(provisionAmount)}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.border, marginBottom: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Zu zahlen</Text>
            <Text style={{ color: COLORS.neon, fontSize: 28, fontWeight: '900' }}>
              {euro(provisionAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={{ gap: 10, alignItems: 'center' }}>
          <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', alignSelf: 'flex-start' }}>ZAHLUNGSMETHODE</Text>

          {/* CARD */}
          <Pressable
            onPress={() => setSelectedMethod('card')}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: selectedMethod === 'card' ? COLORS.neon : COLORS.border,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
            }}
          >
            <Ionicons
              name="card-outline"
              size={26}
              color={selectedMethod === 'card' ? COLORS.neon : COLORS.muted}
              style={{ marginRight: 14 }}
            />

            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700', flex: 1 }}>Kreditkarte</Text>

            {selectedMethod === 'card' && <Ionicons name="checkmark-circle" size={28} color={COLORS.neon} />}
          </Pressable>

          {/* PAYPAL */}
          <Pressable
            onPress={() => setSelectedMethod('paypal')}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: selectedMethod === 'paypal' ? COLORS.neon : COLORS.border,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
            }}
          >
            <Ionicons
              name="logo-paypal"
              size={26}
              color={selectedMethod === 'paypal' ? COLORS.neon : COLORS.muted}
              style={{ marginRight: 14 }}
            />

            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700', flex: 1 }}>PayPal</Text>

            {selectedMethod === 'paypal' && <Ionicons name="checkmark-circle" size={28} color={COLORS.neon} />}
          </Pressable>

          {/* SEPA (disabled) */}
          <View
            style={{
              backgroundColor: COLORS.gray,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              opacity: 0.5,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
            }}
          >
            <Ionicons name="business-outline" size={26} color={COLORS.muted} style={{ marginRight: 14 }} />
            <Text style={{ color: COLORS.muted, fontSize: 16, fontWeight: '700', flex: 1 }}>SEPA</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>Bald</Text>
          </View>
        </View>

        {/* PAY BUTTON */}
        <Pressable
          onPress={handlePayment}
          disabled={!selectedMethod || processing}
          style={{
            backgroundColor: !selectedMethod || processing ? COLORS.gray : COLORS.purple,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            width: '60%',
            maxWidth: 300,
            minWidth: 220,
            alignSelf: 'center',
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>
            {processing ? 'Zahlung läuft' : `20% Provision zahlen (${euro(provisionAmount)})`}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
