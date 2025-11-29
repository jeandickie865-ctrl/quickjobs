import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';

export default function RegistrationDoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.applicationId;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>
        Anmeldung erstellt
      </Text>

      <Text style={{ fontSize: 16 }}>
        Die Anmeldung für diese Bewerbung wurde erfolgreich angelegt.
      </Text>

      <Pressable
        onPress={async () => {
          try {
            const response = await fetch('/api/registrations/generate-contract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId })
            });

            const data = await response.json();
            console.log('Contract generated:', data);

            if (data.contractUrl) {
              const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${data.contractUrl}`;
              Linking.openURL(fullUrl);
            }

          } catch (err) {
            console.error('Error generating contract:', err);
          }
        }}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 10
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Arbeitsvertrag herunterladen
        </Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          try {
            const response = await fetch('/api/registrations/generate-sofortmeldung', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId })
            });

            const data = await response.json();
            console.log('Sofortmeldung generated:', data);

            if (data.sofortmeldungUrl) {
              const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${data.sofortmeldungUrl}`;
              Linking.openURL(fullUrl);
            }

          } catch (err) {
            console.error('Error generating sofortmeldung:', err);
          }
        }}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 10
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Sofortmeldung herunterladen
        </Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          try {
            const response = await fetch('/api/registrations/generate-payroll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId })
            });

            const data = await response.json();
            console.log('Payroll generated:', data);

            if (data.payrollUrl) {
              const fullUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL}${data.payrollUrl}`;
              Linking.openURL(fullUrl);
            }

          } catch (err) {
            console.error('Error generating payroll:', err);
          }
        }}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 10
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Lohnabrechnung herunterladen
        </Text>
      </Pressable>

      <Pressable
        onPress={async () => {
          try {
            const response = await fetch('/api/registrations/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicationId
              })
            });

            const data = await response.json();
            console.log('Registration completed:', data);

            router.push('/(employer)/matches');
          } catch (err) {
            console.error('Error completing registration:', err);
          }
        }}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Anmeldung abschließen
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(employer)/matches')}
        style={{
          backgroundColor: '#E0E0E0',
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#ccc',
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Zurück zu meinen Matches
        </Text>
      </Pressable>
    </View>
  );
}
