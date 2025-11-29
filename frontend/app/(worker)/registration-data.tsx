import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '@/constants/colors';

export default function WorkerRegistrationDataScreen() {
  const router = useRouter();

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
        style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Steuer-ID</Text>
      <TextInput
        value={steuerId}
        onChangeText={setSteuerId}
        placeholder="Steuer-ID"
        style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Sozialversicherungsnummer</Text>
      <TextInput
        value={sozialversicherungsnummer}
        onChangeText={setSozialversicherungsnummer}
        placeholder="SV-Nummer"
        style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
      />

      <Text style={{ marginTop: 8 }}>Krankenkasse</Text>
      <TextInput
        value={krankenkasse}
        onChangeText={setKrankenkasse}
        placeholder="Name der Krankenkasse"
        style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
      />

      <Pressable
        onPress={async () => {
          try {
            // NUR Token aus AsyncStorage holen
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
              console.error('No auth token found');
              return;
            }

            // Backend extrahiert userId aus Token
            const response = await fetch('/api/profiles/worker/me/registration-data', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                steuerId,
                geburtsdatum,
                sozialversicherungsnummer,
                krankenkasse
              })
            });

            const data = await response.json();
            console.log('Registration data saved:', data);

            // Nach dem Speichern zurück zur vorherigen Seite
            router.back();

          } catch (error) {
            console.error('Error saving registration data:', error);
          }
        }}
        style={{
          marginTop: 16,
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
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>Daten speichern und weiter</Text>
      </Pressable>
    </View>
  );
}
