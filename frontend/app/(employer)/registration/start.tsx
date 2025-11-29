import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import COLORS from '@/constants/colors';

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
          backgroundColor: COLORS.neon,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: 'center',
          shadowColor: COLORS.neonShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 6
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
          Kurzfristige Beschäftigung vorbereiten
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push(`/(employer)/registration/prepare?applicationId=${applicationId}&type=minijob`)}
        style={{
          backgroundColor: COLORS.neon,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: 'center',
          shadowColor: COLORS.neonShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 6
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
          Minijob vorbereiten
        </Text>
      </Pressable>
    </View>
  );
}
