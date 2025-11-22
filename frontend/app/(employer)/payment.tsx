// app/(employer)/payment.tsx - NEON-TECH PAYMENTS
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Payment, 
  getPaymentsByEmployer, 
  updatePaymentStatus 
} from '../../utils/paymentsStore';
import { getEmployerProfile } from '../../utils/employerProfileStore';
import { Ionicons } from '@expo/vector-icons';

// BACKUP NEON-TECH COLORS
const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  lightGray: '#F5F5F5',
  offBlack: '#0B0B0E',
  neonTransparent: 'rgba(200,255,22,0.08)',
  neonBorder: 'rgba(200,255,22,0.3)',
  neonShadow: 'rgba(200,255,22,0.2)',
};

export default function PaymentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Pulse animation for pending payments
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load payments
      const userPayments = await getPaymentsByEmployer(user.id);
      setPayments(userPayments);
      
      // Load payment method from profile
      const profile = await getEmployerProfile(user.id);
      if (profile?.paymentMethod) {
        setPaymentMethod(profile.paymentMethod);
      }
      
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePayNow(paymentId: string) {
    setProcessing(paymentId);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update payment status
      await updatePaymentStatus(paymentId, 'paid');
      
      Alert.alert('Erfolg', 'Zahlung erfolgreich abgeschlossen!');
      
      // Reload data
      await loadData();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Fehler', 'Zahlung konnte nicht abgeschlossen werden.');
    } finally {
      setProcessing(null);
    }
  }

  function formatAmount(cents: number): string {
    const euros = cents / 100;
    return `${euros.toFixed(2)} €`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

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
            Zahlungen
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.white, opacity: 0.7, textAlign: 'center', marginTop: 4 }}>
            20% BACKUP Provision
          </Text>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 20 }}
      >
        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={COLORS.neon} size="large" />
            <Text style={{ color: COLORS.white, marginTop: 16 }}>Lädt Zahlungen...</Text>
          </View>
        ) : (
          <>
            {/* Zahlungsmethode Card */}
            <View style={{
              backgroundColor: COLORS.neonTransparent,
              borderWidth: 1,
              borderColor: COLORS.neonBorder,
              borderRadius: 16,
              padding: 20,
            }}>
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '700', 
                color: COLORS.neon, 
                marginBottom: 12,
                letterSpacing: 0.5 
              }}>
                ZAHLUNGSMETHODE
              </Text>

              {paymentMethod ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    backgroundColor: COLORS.neon,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons
                      name={paymentMethod === 'card' ? 'card-outline' : 'logo-paypal'}
                      size={24}
                      color={COLORS.black}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                      {paymentMethod === 'card' ? 'Kreditkarte' : 'PayPal'}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.white, opacity: 0.6, marginTop: 2 }}>
                      {paymentMethod === 'card' ? 'Visa/Mastercard' : 'PayPal Account'}
                    </Text>
                  </View>
                  <Pressable onPress={() => router.push('/(employer)/profile')}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.neon }}>
                      Ändern
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push('/(employer)/profile')}
                  style={{
                    borderWidth: 2,
                    borderColor: COLORS.neon,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.neon }}>
                    Zahlungsmethode hinzufügen
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Offene Zahlungen */}
            {pendingPayments.length > 0 && (
              <View>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: COLORS.white, 
                  marginBottom: 12 
                }}>
                  Offene Zahlungen
                </Text>

                {pendingPayments.map(payment => (
                  <Animated.View
                    key={payment.id}
                    style={{
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: COLORS.neonTransparent,
                      borderWidth: 1,
                      borderColor: COLORS.neon,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 }}>
                          {payment.jobTitle || 'Auftrag'}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.white, opacity: 0.6 }}>
                          {formatDate(payment.createdAt)}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: COLORS.neon,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.black }}>
                          OFFEN
                        </Text>
                      </View>
                    </View>

                    <View style={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)', 
                      borderRadius: 12, 
                      padding: 12,
                      marginBottom: 16
                    }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.neon, textAlign: 'center' }}>
                        {formatAmount(payment.amount)}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.white, opacity: 0.6, textAlign: 'center', marginTop: 4 }}>
                        20% Provision
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => handlePayNow(payment.id)}
                      disabled={processing === payment.id}
                      style={({ pressed }) => ({
                        backgroundColor: COLORS.neon,
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        opacity: pressed || processing === payment.id ? 0.8 : 1,
                      })}
                    >
                      {processing === payment.id ? (
                        <ActivityIndicator color={COLORS.black} />
                      ) : (
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.black }}>
                          Jetzt bezahlen
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Bezahlte Zahlungen */}
            {paidPayments.length > 0 && (
              <View>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: COLORS.white, 
                  marginBottom: 12 
                }}>
                  Letzte Zahlungen
                </Text>

                {paidPayments.map(payment => (
                  <View
                    key={payment.id}
                    style={{
                      backgroundColor: COLORS.neonTransparent,
                      borderWidth: 1,
                      borderColor: COLORS.neonBorder,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 }}>
                          {payment.jobTitle || 'Auftrag'}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.white, opacity: 0.6 }}>
                          Bezahlt am {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.neon} />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.neon }}>
                        {formatAmount(payment.amount)}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.white, opacity: 0.6 }}>
                        {payment.method === 'card' ? 'Kreditkarte' : 'PayPal'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Leerer Zustand */}
            {payments.length === 0 && (
              <View style={{
                backgroundColor: COLORS.neonTransparent,
                borderWidth: 1,
                borderColor: COLORS.neonBorder,
                borderRadius: 16,
                padding: 40,
                alignItems: 'center',
              }}>
                <Ionicons name="card-outline" size={64} color={COLORS.neon} />
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '700', 
                  color: COLORS.white, 
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  Noch keine Zahlungen
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: COLORS.white, 
                  opacity: 0.6,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  Sobald ein Match zustande kommt, erscheint hier die 20% Provision.
                </Text>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}
