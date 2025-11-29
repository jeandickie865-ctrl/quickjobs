import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegistrationConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;
  const registrationType = params.type;
  const steuerId = params.steuerId || '';
  const krankenkasse = params.krankenkasse || '';
  const geburtsdatum = params.geburtsdatum || '';
  const sozialversicherungsnummer = params.sozialversicherungsnummer || '';

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>
        Anmeldung vorbereiten
      </Text>

      <Text style={{ fontSize: 16 }}>
        Du erstellst jetzt die Anmeldung für die Bewerbung {applicationId}.
      </Text>

      <Text style={{ fontSize: 16 }}>
        Art der Anmeldung: {registrationType}
      </Text>

      <Pressable
        onPress={async () => {
          try {
            const response = await fetch('/api/registrations/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                applicationId,
                registrationType,
                steuerId,
                krankenkasse,
                geburtsdatum,
                sozialversicherungsnummer
              })
            });

            const data = await response.json();
            console.log('Registration created:', data);

            router.push(
              `/(employer)/registration/done?applicationId=${applicationId}`
            );
          } catch (err) {
            console.error('Error creating registration:', err);
          }
        }}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 20
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Anmeldung jetzt erstellen
        </Text>
      </Pressable>
    </View>
  );
}
