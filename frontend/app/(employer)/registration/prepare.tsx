import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegistrationPrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;
  const registrationType = params.type;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 10 }}>
        Vorbereitung der Anmeldung
      </Text>

      <Text style={{ fontSize: 16 }}>
        Art der Anmeldung: {registrationType}
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Vorgang für Bewerbung {applicationId}. Die eigentliche Anmeldung wird im nächsten Schritt erstellt.
      </Text>

      <Pressable
        onPress={() =>
          router.push(
            `/(employer)/registration/confirm?applicationId=${applicationId}&type=${registrationType}`
          )
        }
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Weiter zur Anmeldung
        </Text>
      </Pressable>
    </View>
  );
}
