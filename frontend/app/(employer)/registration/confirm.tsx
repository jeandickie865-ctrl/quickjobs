import { View, Text, Pressable, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../config';
import { getAuthHeaders } from '../../../utils/api';

const COLORS = {
  bg: '#141126',
  card: '#1C1838',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  neon: '#C8FF16',
  black: '#000000',
};

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
  const [loading, setLoading] = useState(false);

  // Ein einziger useEffect der auf application reagiert
  useEffect(() => {
    if (!application) return;
    
    const workerId = application.workerId;
    if (!workerId) return;

    async function checkWorkerData() {
      try {
        const headers = await getAuthHeaders();
        
        // Worker-Profil laden
        const workerRes = await fetch(`${API_URL}/profiles/worker/${workerId}`, { headers });
        const workerData = await workerRes.json();
        setWorker(workerData);

        // Worker-Status prüfen
        const statusRes = await fetch(`${API_URL}/profiles/worker/${workerId}/registration-status`, { headers });
        const status = await statusRes.json();

        // Wenn selbstständig oder vollständig, dann OK
        if (status.isSelfEmployed || status.complete) {
          setWorkerDataComplete(true);
        } else {
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
    
    async function loadApplication() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/applications/${applicationId}`, { headers });
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        console.error('Error loading application:', err);
      }
    }
    
    loadApplication();
  }, [applicationId]);

  const handleCreateRegistration = async () => {
    // Prüfe zuerst ob Worker-Daten vollständig sind
    if (!workerDataComplete) {
      setShowModal(true);
      return;
    }

    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/registrations/create`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={['top','bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: 12 }}>
            Anmeldung vorbereiten
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* Info Icon */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.card,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: COLORS.neon,
              }}
            >
              <Ionicons name="document-text" size={40} color={COLORS.neon} />
            </View>
          </View>

          {/* Worker Info Card */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
              MITARBEITER
            </Text>
            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
              {worker ? `${worker.firstName} ${worker.lastName}` : 'Wird geladen...'}
            </Text>
          </View>

          {/* Registration Type Card */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.neon, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
              ART DER ANMELDUNG
            </Text>
            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', textTransform: 'capitalize' }}>
              {registrationType || 'Nicht angegeben'}
            </Text>
          </View>

          {/* Info Box */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: COLORS.border,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <Ionicons name="information-circle" size={24} color={COLORS.neon} style={{ marginTop: 2 }} />
            <Text style={{ color: COLORS.muted, fontSize: 14, flex: 1, lineHeight: 20 }}>
              Du erstellst jetzt die Anmeldung für diesen Mitarbeiter. Alle notwendigen Dokumente werden automatisch generiert.
            </Text>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleCreateRegistration}
            disabled={loading}
            style={{
              backgroundColor: loading ? COLORS.muted : COLORS.neon,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 16,
              alignItems: 'center',
              marginTop: 20,
              width: '60%',
              maxWidth: 300,
              minWidth: 220,
              alignSelf: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black }}>
                Anmeldung jetzt erstellen
              </Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal für fehlende Worker-Daten */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(14, 11, 31, 0.95)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.card,
                padding: 24,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                width: '100%',
                maxWidth: 400,
              }}
            >
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: COLORS.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="alert-circle" size={32} color={COLORS.neon} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white, textAlign: 'center' }}>
                  Angaben fehlen
                </Text>
              </View>

              <Text style={{ fontSize: 15, color: COLORS.muted, marginBottom: 24, textAlign: 'center', lineHeight: 22 }}>
                Die Angaben des Arbeitnehmers fehlen noch. Der Arbeitnehmer wird beim nächsten Öffnen der App automatisch aufgefordert, seine Daten einzugeben. Sobald die Angaben vollständig sind, können Sie die Anmeldung erneut durchführen.
              </Text>

              <Pressable
                onPress={() => {
                  setShowModal(false);
                  router.push('/(employer)/matches');
                }}
                style={{
                  backgroundColor: COLORS.neon,
                  padding: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '700' }}>Verstanden</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

export default function RegistrationConfirmScreen() {
  const params = useLocalSearchParams();
  const applicationId = params.applicationId as string;
  
  // Komponente neu mounten wenn applicationId sich ändert
  return <ConfirmContent key={applicationId} />;
}
