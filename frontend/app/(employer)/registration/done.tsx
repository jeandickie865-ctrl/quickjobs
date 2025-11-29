import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
        onPress={() => {}}
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
