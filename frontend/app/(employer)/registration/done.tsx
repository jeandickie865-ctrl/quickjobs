import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../config';
import { getAuthHeaders } from '../../../utils/api';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  white: '#1A1A1A',
  cardText: "#00A07C",
  text: '#1A1A1A',
  muted: 'rgba(0,0,0,0.6)',
  neon: '#EFABFF',
  black: '#000000',
};

export default function RegistrationDoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.applicationId;

  const [loadingContract, setLoadingContract] = useState(false);
  const [loadingSofortmeldung, setLoadingSofortmeldung] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const handleDownload = async (endpoint: string, setLoading: (val: boolean) => void, urlKey: string) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/registrations/${endpoint}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();
      console.log(`${endpoint} generated:`, data);

      if (data[urlKey]) {
        const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${data[urlKey]}`;
        await Linking.openURL(fullUrl);
      }
    } catch (err) {
      console.error(`Error generating ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoadingComplete(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/registrations/complete`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId })
      });

      const data = await response.json();
      console.log('Registration completed:', data);

      router.push('/(employer)/matches');
    } catch (err) {
      console.error('Error completing registration:', err);
    } finally {
      setLoadingComplete(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
            Anmeldung erstellt
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* Success Icon */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.card,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: COLORS.neon,
              }}
            >
              <Ionicons name="checkmark-circle" size={60} color={COLORS.neon} />
            </View>
          </View>

          {/* Success Message Card */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Erfolgreich erstellt!
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
              Die Anmeldung für diese Bewerbung wurde erfolgreich angelegt. Lade jetzt die Dokumente herunter.
            </Text>
          </View>

          {/* Documents Section */}
          <View style={{ gap: 12 }}>
            <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>
              DOKUMENTE HERUNTERLADEN
            </Text>

            {/* Arbeitsvertrag Button */}
            <Pressable
              onPress={() => handleDownload('generate-contract', setLoadingContract, 'contractUrl')}
              disabled={loadingContract}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                width: '60%',
                maxWidth: 300,
                minWidth: 220,
                alignSelf: 'center',
              }}
            >
              {loadingContract ? (
                <ActivityIndicator color={COLORS.neon} />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white }}>
                    Arbeitsvertrag
                  </Text>
                </>
              )}
            </Pressable>

            {/* Meldecheck Button */}
            <Pressable
              onPress={() => handleDownload('generate-meldecheck', setLoadingSofortmeldung, 'meldecheckUrl')}
              disabled={loadingSofortmeldung}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                width: '60%',
                maxWidth: 300,
                minWidth: 220,
                alignSelf: 'center',
              }}
            >
              {loadingSofortmeldung ? (
                <ActivityIndicator color={COLORS.neon} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white }}>
                    Meldecheck
                  </Text>
                </>
              )}
            </Pressable>

            {/* Lohnabrechnung Button */}
            <Pressable
              onPress={() => handleDownload('generate-payroll', setLoadingPayroll, 'payrollUrl')}
              disabled={loadingPayroll}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                width: '60%',
                maxWidth: 300,
                minWidth: 220,
                alignSelf: 'center',
              }}
            >
              {loadingPayroll ? (
                <ActivityIndicator color={COLORS.neon} />
              ) : (
                <>
                  <Ionicons name="wallet" size={20} color={COLORS.neon} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white }}>
                    Lohnabrechnung
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginTop: 20 }}>
            {/* Complete Button */}
            <Pressable
              onPress={handleComplete}
              disabled={loadingComplete}
              style={{
                backgroundColor: loadingComplete ? COLORS.muted : COLORS.neon,
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 16,
                alignItems: 'center',
                width: '60%',
                maxWidth: 300,
                minWidth: 220,
                alignSelf: 'center',
              }}
            >
              {loadingComplete ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                  Anmeldung abschließen
                </Text>
              )}
            </Pressable>

            {/* Back Button */}
            <Pressable
              onPress={() => router.push('/(employer)/matches')}
              style={{
                backgroundColor: 'transparent',
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: COLORS.border,
                width: '60%',
                maxWidth: 300,
                minWidth: 220,
                alignSelf: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.white }}>
                Zurück zu Matches
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
