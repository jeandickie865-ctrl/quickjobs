import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import COLORS from '@/constants/colors';

export default function RegistrationConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;
  const registrationType = params.type;
  const steuerId = params.steuerId || '';
  const krankenkasse = params.krankenkasse || '';
  const geburtsdatum = params.geburtsdatum || '';
  const sozialversicherungsnummer = params.sozialversicherungsnummer || '';

  const [worker, setWorker] = useState(null);

  useEffect(() => {
    if (!applicationId) return;
    
    // Application laden um workerId zu bekommen
    fetch(`/api/applications/${applicationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.workerId) {
          // Worker-Profil laden
          return fetch(`/api/profiles/worker/${data.workerId}`);
        }
      })
      .then(res => res ? res.json() : null)
      .then(workerData => {
        if (workerData) {
          setWorker(workerData);
        }
      })
      .catch(err => console.error('Error loading worker:', err));
  }, [applicationId]);

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>
        Anmeldung vorbereiten
      </Text>

      <Text style={{ fontSize: 16 }}>
        Du erstellst jetzt die Anmeldung für {worker ? `${worker.firstName} ${worker.lastName}` : 'den Mitarbeiter'}.
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
          backgroundColor: COLORS.neon,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: 'center',
          shadowColor: COLORS.neonShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          marginTop: 20
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
          Anmeldung jetzt erstellen
        </Text>
      </Pressable>
    </View>
  );
}
