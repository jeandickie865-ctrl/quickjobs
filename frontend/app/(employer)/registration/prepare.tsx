import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

export default function RegistrationPrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const applicationId = params.applicationId;
  const registrationType = params.type;

  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [worker, setWorker] = useState(null);

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
      .then(data => setWorker(data))
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

      <Pressable
        onPress={() =>
          router.push(
            `/(employer)/registration/confirm?applicationId=${applicationId}&type=${registrationType}`
          )
        }
        style={{
          backgroundColor: '#FFD700',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center'
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Weiter zur Anmeldung
        </Text>
      </Pressable>
    </View>
  );
}
