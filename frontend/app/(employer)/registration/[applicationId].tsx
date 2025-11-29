import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegistrationIntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20 }}>
        Der Einsatz ist bestätigt. Jetzt geht es um die Anmeldung deiner Arbeitskraft.
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Du entscheidest selbst, wie du weitermachst. Du kannst die Anmeldung direkt hier vorbereiten oder später erledigen.
      </Text>

      <Pressable
        onPress={() => router.push(`/(employer)/registration/start?applicationId=${params.applicationId}`)}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Ich möchte Unterstützung
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(employer)/matches')}
        style={{
          backgroundColor: '#E0E0E0',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Ich mache es selbst
        </Text>
      </Pressable>
    </View>
  );
}
