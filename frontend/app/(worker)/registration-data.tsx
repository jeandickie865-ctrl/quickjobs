import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [showSaved, setShowSaved] = useState(false);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 200
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 20, fontWeight: '600' }}>
            Deine Daten für offizielle Einsätze
          </Text>

          <Text style={{ fontSize: 15, marginBottom: 16 }}>
            Für offizielle Einsätze braucht dein Arbeitgeber ein paar Angaben von dir.
            Du gibst diese Daten nur ein einziges Mal ein. Danach sind sie gespeichert.
          </Text>

          <Text>Geburtsdatum</Text>
          <TextInput
            value={geburtsdatum}
            onChangeText={setGeburtsdatum}
            placeholder="TT.MM.JJJJ"
            style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
          />

          <Text style={{ marginTop: 12 }}>Steuer-ID</Text>
          <TextInput
            value={steuerId}
            onChangeText={setSteuerId}
            placeholder="Steuer-ID"
            style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
          />

          <Text style={{ marginTop: 12 }}>Sozialversicherungsnummer</Text>
          <TextInput
            value={sozialversicherungsnummer}
            onChangeText={setSozialversicherungsnummer}
            placeholder="SV-Nummer"
            style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
          />

          <Text style={{ marginTop: 12 }}>Krankenkasse</Text>
          <TextInput
            value={krankenkasse}
            onChangeText={setKrankenkasse}
            placeholder="Name der Krankenkasse"
            style={{ borderWidth: 1, borderColor: COLORS.gray, borderRadius: 8, padding: 10 }}
          />
        </ScrollView>

        <Pressable
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              // Original-API-Call unverändert lassen
              const response = await fetch("/api/profiles/worker/me/registration-data", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  steuerId,
                  geburtsdatum,
                  sozialversicherungsnummer,
                  krankenkasse
                })
              });

              // Nur UI: Toast
              setShowSaved(true);

              // Nach kurzer Zeit zurück auf /worker/profile
              setTimeout(() => {
                setShowSaved(false);
                router.replace("/(worker)/profile");
              }, 1200);

            } catch (error) {
              console.error("Error saving registration data:", error);
            }
          }}
          style={{
            backgroundColor: COLORS.neon,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            width: "100%",
            maxWidth: 360,
            alignSelf: "center",
            marginBottom: 40
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
            Daten speichern und weiter
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
