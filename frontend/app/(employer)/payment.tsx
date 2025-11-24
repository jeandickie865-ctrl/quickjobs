// app/(employer)/payment.tsx - FINAL NEON-TECH DESIGN
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getJobById } from '../../utils/jobStore';
import { Job } from '../../types/job';
import { euro } from '../../utils/pricing';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#E8E8E8',
  neonShadow: 'rgba(200,255,22,0.2)',
  dimmed: 'rgba(0,0,0,0.7)',
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

  // Animations
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
        if (foundJob) {
          setJob(foundJob);
        }
        setLoading(false);
      })();
    }
  }, [authLoading, user, jobId]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setShowSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.replace(`/(employer)/jobs/${jobId}`);
      }, 3000);
    }, 2000);
  };

  if (authLoading) return null;
  if (!user || user.role !== 'employer') return <Redirect href="/start" />;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.neon} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.white, fontSize: 18 }}>Job nicht gefunden</Text>
        </SafeAreaView>
      </View>
    );
  }

  const provisionAmount = (job.workerAmountCents / 100) * 0.2; // 20% Provision

  // Success Screen
  if (showSuccess) {
    const rotation = checkmarkRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View style={{
            transform: [{ scale: successScale }, { rotate: rotation }],
            marginBottom: 32,
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: COLORS.neon,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="checkmark" size={70} color={COLORS.black} />
            </View>
          </Animated.View>

          <Text style={{
            fontSize: 28,
            fontWeight: '900',
            color: COLORS.white,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            Zahlung erfolgreich
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            lineHeight: 24,
          }}>
            Dein Match ist jetzt freigeschaltet.{'\n'}
            Du kannst nun mit dem Worker chatten!
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // Payment Screen
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      {/* Glow Effect */}
      <View style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        marginLeft: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: COLORS.neon,
        opacity: 0.12,
        blur: 60,
      }} />

      {/* Top Bar */}
      <SafeAreaView edges={['top']}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
            Provision zahlen
          </Text>
          <View style={{ width: 26 }} />
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 20 }}
      >
        {/* Job Info Card */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 20,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 6,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 12, letterSpacing: 0.5 }}>
            JOB-DETAILS
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.purple, marginBottom: 8 }}>
            {job.title}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
            Job-Lohn: {euro(job.workerAmountCents)}
          </Text>
        </View>

        {/* Provision Card - NEON PAYMENT CARD */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 18,
          padding: 24,
          shadowColor: COLORS.neon,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 8,
          borderWidth: 2,
          borderColor: COLORS.neon,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, marginBottom: 16, letterSpacing: 0.5 }}>
            BACKUP PROVISION (20%)
          </Text>

          {/* Breakdown */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: COLORS.darkGray }}>Job-Lohn</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.black }}>
                {euro(job.wages)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: COLORS.darkGray }}>Provision (20%)</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.black }}>
                {euro(provisionAmount)}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.lightGray, marginVertical: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                Zu zahlen
              </Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.purple }}>
                {euro(provisionAmount)}
              </Text>
            </View>
          </View>

          {/* Important Note */}
          <View style={{
            padding: 12,
            backgroundColor: '#FFF3CD',
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.neon,
          }}>
            <Text style={{ fontSize: 13, color: COLORS.darkGray, fontWeight: '600', lineHeight: 18 }}>
              💡 Du zahlst NUR die 20% Provision an BACKUP.{'\n'}
              Der Job-Lohn wird direkt an den Worker gezahlt.
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.neon, letterSpacing: 0.5 }}>
            ZAHLUNGSMETHODE
          </Text>

          {/* Kreditkarte */}
          <Pressable
            onPress={() => setSelectedMethod('card')}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: selectedMethod === 'card' ? COLORS.neon : 'transparent',
            }}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: selectedMethod === 'card' ? COLORS.neon : COLORS.lightGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}>
              <Ionicons name="card-outline" size={24} color={selectedMethod === 'card' ? COLORS.black : COLORS.darkGray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                Kreditkarte
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                Visa, Mastercard, Amex
              </Text>
            </View>
            {selectedMethod === 'card' && (
              <Ionicons name="checkmark-circle" size={28} color={COLORS.neon} />
            )}
          </Pressable>

          {/* PayPal */}
          <Pressable
            onPress={() => setSelectedMethod('paypal')}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: selectedMethod === 'paypal' ? COLORS.neon : 'transparent',
            }}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: selectedMethod === 'paypal' ? COLORS.neon : COLORS.lightGray,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}>
              <Ionicons name="logo-paypal" size={24} color={selectedMethod === 'paypal' ? COLORS.black : COLORS.darkGray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                PayPal
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                Schnell & sicher
              </Text>
            </View>
            {selectedMethod === 'paypal' && (
              <Ionicons name="checkmark-circle" size={28} color={COLORS.neon} />
            )}
          </Pressable>

          {/* SEPA (Disabled) */}
          <View style={{
            backgroundColor: COLORS.lightGray,
            borderRadius: 16,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: 0.6,
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#D0D0D0',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}>
              <Ionicons name="business-outline" size={24} color={COLORS.darkGray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.darkGray }}>
                SEPA Lastschrift
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.darkGray }}>
                Bald verfügbar
              </Text>
            </View>
          </View>
        </View>

        {/* Pay Button */}
        <Pressable
          onPress={handlePayment}
          disabled={!selectedMethod || processing}
          style={({ pressed }) => ({
            backgroundColor: !selectedMethod || processing ? COLORS.lightGray : COLORS.neon,
            paddingVertical: 18,
            borderRadius: 18,
            alignItems: 'center',
            marginTop: 20,
            opacity: pressed ? 0.9 : 1,
            shadowColor: selectedMethod && !processing ? COLORS.neon : 'transparent',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          })}
        >
          <Text style={{ 
            fontSize: 17, 
            fontWeight: '700', 
            color: !selectedMethod || processing ? COLORS.darkGray : COLORS.black,
          }}>
            {processing ? 'Zahlung wird verarbeitet...' : `20% Provision zahlen (${euro(provisionAmount)})`}
          </Text>
        </Pressable>

        {/* Security Note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.neon} />
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
            SSL-verschlüsselt & sicher
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
