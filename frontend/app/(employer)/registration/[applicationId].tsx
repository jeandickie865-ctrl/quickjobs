import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import COLORS from '@/constants/colors';

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
          Ich möchte Unterstützung
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(employer)/matches')}
        style={{
          backgroundColor: COLORS.lightGray,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: COLORS.gray
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.darkGray }}>
          Ich mache es selbst
        </Text>
      </Pressable>
    </View>
  );
}
