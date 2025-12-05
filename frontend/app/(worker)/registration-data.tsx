import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerProfile } from '../../utils/profileStore';

const COLORS = {
  bg: '#141126',
  card: '#1C1838',
  border: 'rgba(255,255,255,0.06)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.7)',
  purple: '#6B4BFF',
  neon: '#C8FF16',
  error: '#FF4D4D',
  black: '#000000'
};

const inputStyle = {
  backgroundColor: '#1C182B',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: COLORS.white,
  borderWidth: 1,
  borderColor: COLORS.border
};

export default function WorkerRegistrationDataScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [steuerId, setSteuerId] = useState('');
  const [sozialversicherungsnummer, setSozialversicherungsnummer] = useState('');
  const [krankenkasse, setKrankenkasse] = useState('');
  const [geburtsort, setGeburtsort] = useState('');
  const [staatsangehoerigkeit, setStaatsangehoerigkeit] = useState('');
  const [confirm70Days, setConfirm70Days] = useState(false);
  const [confirmNotProfessional, setConfirmNotProfessional] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const profile = await getWorkerProfile(user.id);
        if (profile) {
          setGeburtsdatum(profile.geburtsdatum || '');
          setSteuerId(profile.steuerId || '');
          setSozialversicherungsnummer(profile.sozialversicherungsnummer || '');
          setKrankenkasse(profile.krankenkasse || '');
          setGeburtsort(profile.geburtsort || '');
          setStaatsangehoerigkeit(profile.staatsangehoerigkeit || '');
          setConfirm70Days(profile.kurzfristigkeit_bestaetigt || false);
          setConfirmNotProfessional(profile.kurzfristigkeit_nicht_berufsmaeßig || false);
        }
      } catch (error) {
        console.error('Error loading registration data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginTop: 12 }}>Lädt Daten...</Text>
      </View>
    );
  }

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
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
              BACKUP
            </Text>
            <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
              Deine Daten für offizielle Einsätze
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
              Für offizielle Einsätze braucht dein Arbeitgeber ein paar Angaben von dir. 
              Du gibst diese Daten nur ein einziges Mal ein. Danach sind sie gespeichert.
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              gap: 16
            }}
          >
            {/* Geburtsdatum */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Geburtsdatum *
              </Text>
              <TextInput
                value={geburtsdatum}
                onChangeText={setGeburtsdatum}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={COLORS.muted}
                style={inputStyle}
              />
            </View>

            {/* Steuer-ID */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Steuer-ID *
              </Text>
              <TextInput
                value={steuerId}
                onChangeText={setSteuerId}
                placeholder="Steuer-ID"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>

            {/* Sozialversicherungsnummer */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Sozialversicherungsnummer *
              </Text>
              <TextInput
                value={sozialversicherungsnummer}
                onChangeText={setSozialversicherungsnummer}
                placeholder="SV-Nummer"
                placeholderTextColor={COLORS.muted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>

            {/* Krankenkasse */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Krankenkasse *
              </Text>
              <TextInput
                value={krankenkasse}
                onChangeText={setKrankenkasse}
                placeholder="Name der Krankenkasse"
                placeholderTextColor={COLORS.muted}
                style={inputStyle}
              />
            </View>

            {/* Geburtsort */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Geburtsort *
              </Text>
              <TextInput
                value={geburtsort}
                onChangeText={setGeburtsort}
                placeholder="Geburtsort"
                placeholderTextColor={COLORS.muted}
                style={inputStyle}
              />
            </View>

            {/* Staatsangehörigkeit */}
            <View>
              <Text style={{ color: COLORS.muted, marginBottom: 8, fontSize: 14, fontWeight: '600' }}>
                Staatsangehörigkeit *
              </Text>
              <TextInput
                value={staatsangehoerigkeit}
                onChangeText={setStaatsangehoerigkeit}
                placeholder="Staatsangehörigkeit"
                placeholderTextColor={COLORS.muted}
                style={inputStyle}
              />
            </View>

            {/* Checkbox: 70 Tage */}
            <Pressable
              onPress={() => setConfirm70Days(!confirm70Days)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 8
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: confirm70Days ? COLORS.neon : COLORS.border,
                  backgroundColor: confirm70Days ? COLORS.neon : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 2
                }}
              >
                {confirm70Days && (
                  <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '900' }}>✓</Text>
                )}
              </View>
              <Text style={{ color: COLORS.white, fontSize: 14, lineHeight: 20, flex: 1 }}>
                Ich bestätige, dass ich nicht mehr als 70 Arbeitstage pro Jahr arbeite *
              </Text>
            </Pressable>

            {/* Checkbox: Nicht Hauptbeschäftigung */}
            <Pressable
              onPress={() => setConfirmNotProfessional(!confirmNotProfessional)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                paddingVertical: 8
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: confirmNotProfessional ? COLORS.neon : COLORS.border,
                  backgroundColor: confirmNotProfessional ? COLORS.neon : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 2
                }}
              >
                {confirmNotProfessional && (
                  <Text style={{ color: COLORS.black, fontSize: 16, fontWeight: '900' }}>✓</Text>
                )}
              </View>
              <Text style={{ color: COLORS.white, fontSize: 14, lineHeight: 20, flex: 1 }}>
                Ich bestätige, dass diese Art von Arbeit nicht meine Hauptbeschäftigung ist *
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={{ padding: 20, paddingBottom: 40 }}>
          <Pressable
            onPress={async () => {
              try {
                setSaving(true);
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
                    krankenkasse,
                    geburtsort,
                    staatsangehoerigkeit,
                    kurzfristigkeit_bestaetigt: confirm70Days,
                    kurzfristigkeit_nicht_berufsmaeßig: confirmNotProfessional
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
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            style={{
              backgroundColor: saving ? COLORS.card : COLORS.purple,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              width: "60%",
              alignSelf: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>
                Daten speichern und weiter
              </Text>
            )}
          </Pressable>
        </View>

        {showSaved && (
          <View
            style={{
              position: "absolute",
              bottom: 120,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 9999
            }}
          >
            <View
              style={{
                backgroundColor: "#141126",
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#6B4BFF",
                shadowColor: "#6B4BFF",
                shadowOpacity: 0.3,
                shadowRadius: 6
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                Daten gespeichert
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
