import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RegistrationStartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20 }}>
        Welche Art der Anmeldung möchtest du vorbereiten?
      </Text>

      <Pressable
        onPress={() => router.push(`/(employer)/registration/prepare?applicationId=${applicationId}&type=kurzfristig`)}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Kurzfristige Beschäftigung vorbereiten
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push(`/(employer)/registration/prepare?applicationId=${applicationId}&type=minijob`)}
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Minijob vorbereiten
        </Text>
      </Pressable>
    </View>
  );
}
