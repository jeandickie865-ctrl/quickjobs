// app/payment/[applicationId].tsx - 20% Plattformgebühr Screen
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getApplicationById } from '../../utils/applicationStore';
import { getJobById } from '../../utils/jobStore';
import { euro } from '../../utils/pricing';
import { Job } from '../../types/job';
import { JobApplication } from '../../types/application';

type PaymentMethod = 'card' | 'paypal' | 'sepa';

export default function PaymentScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!applicationId) return;
    try {
      const app = await getApplicationById(applicationId);
      if (app) {
        setApplication(app);
        const j = await getJobById(app.jobId);
        setJob(j);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!selectedMethod || !job || !application) return;

    setPaying(true);
    
    // TODO: Echte Payment-Integration (Stripe, PayPal, etc.)
    setTimeout(() => {
      setPaying(false);
      Alert.alert(
        'Zahlung erfolgreich! \ud83c\udf89',
        'Deine Plattformgeb\u00fchr wurde bezahlt. Der Match ist jetzt aktiv. Du kannst direkt mit der Arbeitskraft schreiben und telefonieren.',
        [
          {
            text: 'Zum Chat',
            onPress: () => router.replace({
              pathname: '/chat/[applicationId]',
              params: { applicationId: application.id }
            })
          }
        ]
      );
    }, 2000);
  }

  if (loading || !job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.gray600 }}>L\u00e4dt...</Text>
      </SafeAreaView>
    );
  }

  const platformFee = Math.round(job.workerAmountCents * 0.20);

  const PaymentMethodCard = ({ method, title, subtitle, icon }: { 
    method: PaymentMethod; 
    title: string; 
    subtitle: string;
    icon: string;
  }) => {
    const isSelected = selectedMethod === method;

    return (
      <Pressable onPress={() => setSelectedMethod(method)}>
        <Card style={{
          borderWidth: isSelected ? 3 : 2,
          borderColor: isSelected ? colors.primary : colors.gray300,
          marginBottom: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 32 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
                {title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray600, marginTop: 2 }}>
                {subtitle}
              </Text>
            </View>
            {isSelected && (
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>\u2713</Text>
              </View>
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryUltraLight }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: spacing.sm }}>
          Plattformgeb\u00fchr bezahlen
        </Text>
        <Text style={{ fontSize: 15, color: colors.gray600, marginBottom: spacing.xl, lineHeight: 22 }}>
          Du zahlst hier nur die 20% Vermittlungsgeb\u00fchr.{' '}
          Die Verg\u00fctung an die Arbeitskraft erfolgt direkt zwischen euch.
        </Text>

        {/* Kostenübersicht */}
        <Card style={{ marginBottom: spacing.xl }}>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: colors.gray600 }}>Auftrag:</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.black }}>{job.title}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.gray300 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: colors.gray600 }}>Verg\u00fctung des Auftrags:</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.black }}>
                {euro(job.workerAmountCents)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: colors.gray600 }}>Plattformgeb\u00fchr (20%):</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                {euro(platformFee)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Zahlungsmethoden */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.black, marginBottom: spacing.md }}>
          Zahlungsmethode w\u00e4hlen
        </Text>

        <PaymentMethodCard
          method="card"
          title="Kreditkarte"
          subtitle="Visa, Mastercard, American Express"
          icon="\ud83d\udcb3"
        />

        <PaymentMethodCard
          method="paypal"
          title="PayPal"
          subtitle="Schnell und sicher bezahlen"
          icon="\ud83d\udd35"
        />

        <PaymentMethodCard
          method="sepa"
          title="SEPA Lastschrift"
          subtitle="Direkt vom Bankkonto"
          icon="\ud83c\udfe6"
        />

        {/* Info Box */}
        <View style={{
          backgroundColor: colors.primaryLight,
          padding: spacing.md,
          borderRadius: 12,
          marginTop: spacing.md,
          marginBottom: spacing.xl,
        }}>
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', lineHeight: 20 }}>
            \u2139\ufe0f Die Plattformgeb\u00fchr wird sofort f\u00e4llig. Die Verg\u00fctung der Arbeitskraft zahlst du direkt nach Auftragsabschluss.
          </Text>
        </View>

        {/* Button */}
        <Button
          title={paying ? 'Zahlung wird verarbeitet...' : `${euro(platformFee)} Plattformgeb\u00fchr bezahlen`}
          onPress={handlePayment}
          disabled={!selectedMethod || paying}
          loading={paying}
        />

        <Button
          title="Abbrechen"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
