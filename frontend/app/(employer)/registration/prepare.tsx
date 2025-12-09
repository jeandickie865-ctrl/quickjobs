import { View, Text, Pressable, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppHeader } from '../../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import COLORS from '@/constants/colors';

export default function RegistrationPrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;
  const registrationType = params.type;

  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [worker, setWorker] = useState(null);
  
  const [steuerId, setSteuerId] = useState('');
  const [krankenkasse, setKrankenkasse] = useState('');
  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [sozialversicherungsnummer, setSozialversicherungsnummer] = useState('');
  
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);

  useEffect(() => {
    if (!applicationId) return;
    fetch(`/api/applications/${applicationId}`)
      .then(res => res.json())
      .then(data => setApplication(data))
      .catch(err => console.error('Error loading application:', err));
  }, [applicationId]);

  useEffect(() => {
    if (!application || !application.jobId) return;
    fetch(`/api/jobs/${application.jobId}`)
      .then(res => res.json())
      .then(data => setJob(data))
      .catch(err => console.error('Error loading job:', err));
  }, [application]);

  useEffect(() => {
    if (!application || !application.workerId) return;
    fetch(`/api/profiles/worker/${application.workerId}`)
      .then(res => res.json())
      .then(data => {
        setWorker(data);
        // Felder automatisch mit Worker-Daten vorausfüllen
        if (data.steuerId) setSteuerId(data.steuerId);
        if (data.geburtsdatum) setGeburtsdatum(data.geburtsdatum);
        if (data.sozialversicherungsnummer) setSozialversicherungsnummer(data.sozialversicherungsnummer);
        if (data.krankenkasse) setKrankenkasse(data.krankenkasse);
      })
      .catch(err => console.error('Error loading worker:', err));
  }, [application]);

  // Prüfe, ob alle Pflichtdaten vorhanden sind
  useEffect(() => {
    // Warte bis Worker-Daten geladen sind
    if (!worker || dataChecked) return;
    
    // Prüfe ob ALLE 4 Felder ausgefüllt sind (entweder vom Worker oder bereits gesetzt)
    const hasAllData = 
      steuerId && steuerId.trim() !== '' &&
      krankenkasse && krankenkasse.trim() !== '' &&
      geburtsdatum && geburtsdatum.trim() !== '' &&
      sozialversicherungsnummer && sozialversicherungsnummer.trim() !== '';
    
    setDataChecked(true);
    
    if (hasAllData) {
      // Fall A: Alle Daten vorhanden → Automatisch zu confirm weiterleiten
      router.push(
        `/(employer)/registration/confirm?applicationId=${applicationId}` +
        `&type=${registrationType}` +
        `&steuerId=${encodeURIComponent(steuerId)}` +
        `&krankenkasse=${encodeURIComponent(krankenkasse)}` +
        `&geburtsdatum=${encodeURIComponent(geburtsdatum)}` +
        `&sozialversicherungsnummer=${encodeURIComponent(sozialversicherungsnummer)}`
      );
    } else {
      // Fall B: Daten fehlen → Modal anzeigen
      setShowMissingDataModal(true);
    }
  }, [worker, steuerId, krankenkasse, geburtsdatum, sozialversicherungsnummer, dataChecked]);

  return (
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1 }}>
        <AppHeader />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* Modal für fehlende Daten */}
      <Modal
        visible={showMissingDataModal}
        transparent={true}
        animationType="fade"
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{ 
            backgroundColor: COLORS.white, 
            borderRadius: 16, 
            padding: 24,
            width: '100%',
            maxWidth: 400
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: COLORS.black,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Wichtige Daten fehlen
            </Text>
            
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.darkGray,
              lineHeight: 24,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              Vom Arbeitnehmer fehlen noch wichtige Daten zum Erstellen Ihrer Unterlagen. 
              Bitte sprechen Sie mit Ihrem Arbeitnehmer.
            </Text>
            
            <Pressable
              onPress={() => router.back()}
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
                Zurück zu meinen Matches
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 10 }}>
        Vorbereitung der Anmeldung
      </Text>

      <Text style={{ fontSize: 16 }}>
        Art der Anmeldung: {registrationType}
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Vorgang für Bewerbung {applicationId}. Die eigentliche Anmeldung wird im nächsten Schritt erstellt.
      </Text>

      {job && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 20 }}>
            Einsatzdetails
          </Text>
          <Text>Titel: {job.title}</Text>
          <Text>Datum & Uhrzeit: {job.description}</Text>
          <Text>Lohn: {job.workerAmountCents / 100} €</Text>
          <Text>Adresse: {job.address.street} {job.address.postalCode} {job.address.city}</Text>
        </View>
      )}

      {worker && (
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 20 }}>
            Arbeitnehmer
          </Text>
          <Text>Name: {worker.firstName} {worker.lastName}</Text>
          <Text>Telefon: {worker.phone}</Text>
          <Text>Adresse: {worker.homeAddress.street} {worker.homeAddress.postalCode} {worker.homeAddress.city}</Text>
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Zusätzliche Daten für die Anmeldung
        </Text>

        <Text style={{ marginTop: 8 }}>Steuer-ID</Text>
        <TextInput
          value={steuerId}
          onChangeText={setSteuerId}
          placeholder="Steuer-ID des Mitarbeiters"
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 10,
            marginTop: 4
          }}
        />

        <Text style={{ marginTop: 12 }}>Krankenkasse</Text>
        <TextInput
          value={krankenkasse}
          onChangeText={setKrankenkasse}
          placeholder="Name der Krankenkasse"
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 10,
            marginTop: 4
          }}
        />

        <Text style={{ marginTop: 12 }}>Geburtsdatum</Text>
        <TextInput
          value={geburtsdatum}
          onChangeText={setGeburtsdatum}
          placeholder="TT.MM.JJJJ"
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 10,
            marginTop: 4
          }}
        />

        <Text style={{ marginTop: 12 }}>Sozialversicherungsnummer</Text>
        <TextInput
          value={sozialversicherungsnummer}
          onChangeText={setSozialversicherungsnummer}
          placeholder="Sozialversicherungsnummer"
          style={{
            borderWidth: 1,
            borderColor: COLORS.gray,
            borderRadius: 8,
            padding: 10,
            marginTop: 4
          }}
        />
      </View>

      <Pressable
        onPress={() =>
          router.push(
            `/(employer)/registration/confirm?applicationId=${applicationId}` +
            `&type=${registrationType}` +
            `&steuerId=${encodeURIComponent(steuerId || '')}` +
            `&krankenkasse=${encodeURIComponent(krankenkasse || '')}` +
            `&geburtsdatum=${encodeURIComponent(geburtsdatum || '')}` +
            `&sozialversicherungsnummer=${encodeURIComponent(sozialversicherungsnummer || '')}`
          )
        }
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
          Weiter zur Anmeldung
        </Text>
      </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
