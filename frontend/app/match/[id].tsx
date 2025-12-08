import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { AppHeader } from '../../../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { 
  getApplicationById, 
  setEmployerLegalConfirmation, 
  setWorkerLegalConfirmation 
} from '../../utils/applicationStore';
import { JobApplication } from '../../types/application';

export default function MatchLegalScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for checkboxes
  const [employerChecked, setEmployerChecked] = useState(false);
  const [workerChecked, setWorkerChecked] = useState(false);

  const isEmployer = user?.role === 'employer';
  const isWorker = user?.role === 'worker';

  const loadApplication = async () => {
    if (!applicationId) return;
    
    try {
      setIsLoading(true);
      const app = await getApplicationById(applicationId);
      
      if (!app) {
        console.error('Application not found:', applicationId);
        return;
      }

      setApplication(app);
      setEmployerChecked(app.employerConfirmedLegal || false);
      setWorkerChecked(app.workerConfirmedLegal || false);
    } catch (e) {
      console.error('Error loading application:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const handleEmployerCheck = async () => {
    if (!isEmployer || !application) return;
    
    try {
      setIsSaving(true);
      const newValue = !employerChecked;
      await setEmployerLegalConfirmation(application.id, newValue);
      setEmployerChecked(newValue);
      
      // Reload to get fresh data
      await loadApplication();
    } catch (e) {
      console.error('Error setting employer confirmation:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkerCheck = async () => {
    if (!isWorker || !application) return;
    
    try {
      setIsSaving(true);
      const newValue = !workerChecked;
      await setWorkerLegalConfirmation(application.id, newValue);
      setWorkerChecked(newValue);
      
      // Reload to get fresh data
      await loadApplication();
    } catch (e) {
      console.error('Error setting worker confirmation:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (!employerChecked || !workerChecked) return;
    
    // Navigate to chat
    router.push({
      pathname: '/chat/[applicationId]',
      params: { applicationId: application!.id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.black} />
        </View>
      </SafeAreaView>
    );
  }

  if (!application) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Text style={{ fontSize: 16, color: colors.gray700, textAlign: 'center' }}>
            Match nicht gefunden
          </Text>
          <Button 
            title="Zurück" 
            onPress={() => router.back()} 
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const bothConfirmed = employerChecked && workerChecked;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: spacing.sm }}>
            Bevor ihr startet
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
            ShiftMatch bringt euch nur zusammen. Anmeldung, Abrechnung und Versicherung klärt ihr direkt miteinander.
          </Text>
        </View>

        {/* Employer Block */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 2,
            borderColor: employerChecked ? colors.beige300 : colors.gray200,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
            Für Auftraggeber
          </Text>
          
          <Pressable
            onPress={handleEmployerCheck}
            disabled={!isEmployer || isSaving}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              opacity: (!isEmployer || isSaving) ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: employerChecked ? colors.black : colors.gray400,
                backgroundColor: employerChecked ? colors.black : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {employerChecked && (
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>✓</Text>
              )}
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: colors.gray700, lineHeight: 20 }}>
              Ich bin für Anmeldung, Abrechnung und Versicherung dieses Einsatzes selbst verantwortlich.
            </Text>
          </Pressable>

          {!isEmployer && (
            <Text style={{ fontSize: 12, color: colors.gray500, marginTop: spacing.xs, marginLeft: 32 }}>
              {employerChecked ? 'Auftraggeber hat bestätigt ✓' : 'Warte auf Bestätigung des Auftraggebers...'}
            </Text>
          )}
        </View>

        {/* Worker Block */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 2,
            borderColor: workerChecked ? colors.beige300 : colors.gray200,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
            Für Aufträgetarter
          </Text>
          
          <Pressable
            onPress={handleWorkerCheck}
            disabled={!isWorker || isSaving}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              opacity: (!isWorker || isSaving) ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: workerChecked ? colors.black : colors.gray400,
                backgroundColor: workerChecked ? colors.black : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {workerChecked && (
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>✓</Text>
              )}
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: colors.gray700, lineHeight: 20 }}>
              Ich bin für meine Anmeldung, Steuern und Versicherung selbst verantwortlich.
            </Text>
          </Pressable>

          {!isWorker && (
            <Text style={{ fontSize: 12, color: colors.gray500, marginTop: spacing.xs, marginLeft: 32 }}>
              {workerChecked ? 'Aufträgetarter hat bestätigt ✓' : 'Warte auf Bestätigung des Aufträgetarters...'}
            </Text>
          )}
        </View>

        {/* Info Box */}
        <View
          style={{
            backgroundColor: colors.beige100,
            borderRadius: 12,
            padding: spacing.md,
            marginBottom: spacing.lg,
            borderLeftWidth: 3,
            borderLeftColor: bothConfirmed ? '#4caf50' : colors.gray400,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.gray700, lineHeight: 20 }}>
            {bothConfirmed
              ? '✓ Beide haben bestätigt. Kontaktdaten und Chat sind jetzt verfügbar.'
              : 'Kontaktdaten werden sichtbar, wenn beide zugestimmt haben.'}
          </Text>
        </View>

        {/* Legal Links */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, justifyContent: 'center' }}>
          <Pressable onPress={() => router.push('/legal/agb')}>
            <Text style={{ fontSize: 12, color: colors.gray700, textDecorationLine: 'underline' }}>
              AGB lesen
            </Text>
          </Pressable>
          <Text style={{ fontSize: 12, color: colors.gray400 }}>•</Text>
          <Pressable onPress={() => router.push('/legal/privacy')}>
            <Text style={{ fontSize: 12, color: colors.gray700, textDecorationLine: 'underline' }}>
              Datenschutz lesen
            </Text>
          </Pressable>
        </View>

        {/* Continue Button */}
        <Button
          title={bothConfirmed ? 'Kontaktdaten anzeigen' : 'Warte auf Bestätigung...'}
          onPress={handleContinue}
          disabled={!bothConfirmed || isSaving}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
