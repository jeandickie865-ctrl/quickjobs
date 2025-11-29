import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function WorkerRegistrationDataScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [steuerId, setSteuerId] = useState('');
  const [sozialversicherungsnummer, setSozialversicherungsnummer] = useState('');
  const [krankenkasse, setKrankenkasse] = useState('');

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'flex-start', gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>
        Deine Daten für offizielle Einsätze
      </Text>

      <Text style={{ fontSize: 15 }}>
        Für offizielle Einsätze braucht dein Arbeitgeber ein paar Angaben von dir.
        Du gibst diese Daten nur ein einziges Mal ein. Danach sind sie für dich gespeichert.
      </Text>

      <Text>Geburtsdatum</Text>
      <TextInput
        value={geburtsdatum}
        onChangeText={setGeburtsdatum}
        placeholder="TT.MM.JJJJ"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Steuer-ID</Text>
      <TextInput
        value={steuerId}
        onChangeText={setSteuerId}
        placeholder="Steuer-ID"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Sozialversicherungsnummer</Text>
      <TextInput
        value={sozialversicherungsnummer}
        onChangeText={setSozialversicherungsnummer}
        placeholder="SV-Nummer"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Krankenkasse</Text>
      <TextInput
        value={krankenkasse}
        onChangeText={setKrankenkasse}
        placeholder="Name der Krankenkasse"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />

      <Pressable
        onPress={() => {}}
        style={{
          marginTop: 16,
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>Daten speichern und weiter</Text>
      </Pressable>
    </View>
  );
}
