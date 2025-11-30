import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import COLORS from '@/constants/colors';

function ConfirmContent() {
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

  // Ein einziger useEffect der auf application reagiert
  useEffect(() => {
    if (!application) return;
    
    const workerId = application.workerId;
    if (!workerId) return;

    async function checkWorkerData() {
      try {
        // Worker-Profil laden
        const workerRes = await fetch(`/api/profiles/worker/${workerId}`);
        const workerData = await workerRes.json();
        setWorker(workerData);

        // Worker-Status prüfen
        const statusRes = await fetch(`/api/profiles/worker/${workerId}/registration-status`);
        const status = await statusRes.json();

        if (!status.complete) {
          setWorkerDataComplete(false);
          setShowModal(true);
        }
      } catch (err) {
        console.error('Worker check failed:', err);
      }
    }

    checkWorkerData();
  }, [application]);

  // Application laden
  useEffect(() => {
    if (!applicationId) return;
    
    fetch(`/api/applications/${applicationId}`)
      .then(res => res.json())
      .then(data => setApplication(data))
      .catch(err => console.error('Error loading application:', err));
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
        transparent={true}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
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

export default function RegistrationConfirmScreen() {
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string;
  
  // Komponente neu mounten wenn applicationId sich ändert
  return <ConfirmContent key={applicationId} />;
}
