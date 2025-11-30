import { View, Text, Pressable, Modal } from 'react-native';
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
  const [application, setApplication] = useState(null);
  const [workerDataComplete, setWorkerDataComplete] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!applicationId) return;
    
    // Application laden um workerId zu bekommen
    fetch(`/api/applications/${applicationId}`)
      .then(res => res.json())
      .then(data => {
        setApplication(data);
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

  // Prüfe ob Worker-Daten vollständig sind
  useEffect(() => {
    if (!application) return; // Schutz: nur ausführen, wenn Application geladen

    const workerId = application.workerId;
    if (!workerId) return; // Schutz: workerId muss existieren

    async function check() {
      try {
        const res = await fetch(`/api/profiles/worker/${workerId}/registration-status`);
        const status = await res.json();

        if (!status.complete) {
          setWorkerDataComplete(false);
        }
      } catch (err) {
        console.error('Worker status check failed:', err);
      }
    }

    check();
  }, [application]);

  // Modal anzeigen, wenn Worker-Daten unvollständig sind
  useEffect(() => {
    if (!workerDataComplete) {
      setShowModal(true);
    }
  }, [workerDataComplete]);

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
          // Prüfe zuerst ob Worker-Daten vollständig sind
          if (!workerDataComplete) {
            setShowModal(true);
            return;
          }

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

      {/* Modal für fehlende Worker-Daten */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: COLORS.white, padding: 20, borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              Angaben fehlen
            </Text>

            <Text style={{ fontSize: 15, marginBottom: 20 }}>
              Die Angaben des Arbeitnehmers fehlen noch. Der Arbeitnehmer wird beim nächsten Öffnen der App automatisch aufgefordert, seine Daten einzugeben. Sobald die Angaben vollständig sind, können Sie die Anmeldung erneut durchführen.
            </Text>

            <Pressable
              onPress={() => { setShowModal(false); router.push('/(employer)/matches'); }}
              style={{ backgroundColor: COLORS.neon, padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '600' }}>Verstanden</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
