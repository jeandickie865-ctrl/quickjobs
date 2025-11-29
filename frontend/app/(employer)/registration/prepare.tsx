import { View, Text, Pressable, TextInput } from 'react-native';
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

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 24 }}>
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
    </View>
  );
}
