// app/payment/[id].tsx - Payment Screen für Employer
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config";
import { getAuthHeaders } from "../../utils/api";
import { AppHeader } from "../../components/AppHeader";

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#9333EA',      // Lila
  primaryLight: '#C084FC', // Helles Lila
  secondary: '#FF773D',    // Orange
  accent: '#EFABFF',       // Rosa
  accentLight: '#FCE7FF',  // Sehr helles Rosa
  border: '#E9D5FF',       // Lila Border
  inputBg: '#FAF5FF',      // Sehr helles Lila für Inputs
  inputBorder: '#DDD6FE',  // Lila Border für Inputs
  text: '#1A1A1A',         // Dunkelgrau für Text
  textMuted: '#6B7280',    // Grau für sekundären Text
  error: '#EF4444',        // Rot für Fehler
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.id as string;

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPrivateEmployerModal, setShowPrivateEmployerModal] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  async function loadApplication() {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const res = await fetch(`${API_URL}/applications/${applicationId}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Application nicht gefunden");
      }

      const data = await res.json();
      setApplication(data);

      // Job-Daten laden
      const jobRes = await fetch(`${API_URL}/jobs/${data.jobId}`, { headers });
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
      }

      // Worker-Profil laden
      const workerRes = await fetch(`${API_URL}/profiles/worker/${data.workerId}`, { headers });
      let workerData = null;
      if (workerRes.ok) {
        workerData = await workerRes.json();
        setWorkerProfile(workerData);
      } else {
      }

      // Auto-Redirect deaktiviert, Modal-Logik übernimmt nach Zahlung
      
      // Return the worker profile data for immediate use
      return workerData;
    } catch (err) {
      console.error("Load application error:", err);
      Alert.alert("Fehler", "Application konnte nicht geladen werden");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function requestOfficialRegistration(appId: string) {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/applications/${appId}/request-registration`, {
        method: "POST",
        headers,
      });
      router.replace(`/(employer)/registration/confirm?applicationId=${appId}&type=kurzfristig`);
    } catch (err) {
      console.error("Request registration error:", err);
      Alert.alert("Fehler", "Anfrage fehlgeschlagen");
    }
  }

  async function setInformalRegistration(appId: string) {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/applications/${appId}/set-informal`, {
        method: "POST",
        headers,
      });
      router.replace(`/(employer)/matches`);
    } catch (err) {
      console.error("Set informal error:", err);
      Alert.alert("Fehler", "Fehler beim Setzen");
    }
  }

  const handleRegistrationCheck = async (profileData?: any) => {
    
    // Verwende entweder das übergebene Profil oder das State-Profil
    const currentProfile = profileData || workerProfile;

    if (!currentProfile) {
      Alert.alert("Fehler", "Worker-Daten fehlen.");
      return;
    }

    const isSelf = currentProfile.isSelfEmployed === true;

    // Wenn selbstständig → KEIN Modal
    if (isSelf) {
      // Payment ist bereits abgeschlossen, keine weitere Aktion nötig
      router.replace("/(employer)/matches");
      return;
    }

    // PRIVATE + NICHT selbstständig → Private Modal
    if (user?.accountType === "private" && !isSelf) {
      setShowPrivateEmployerModal(true);
      return;
    }

    // BUSINESS + NICHT selbstständig → Business Modal
    setShowRegistrationModal(true);
  };

  async function handlePayment() {
    
    // Double-Clicks verhindern
    if (processing) {
      return;
    }

    try {
      setProcessing(true);
      
      const headers = await getAuthHeaders();

      const res = await fetch(`${API_URL}/applications/${applicationId}/confirm-payment`, {
        method: "POST",
        headers,
      });


      if (!res.ok) {
        throw new Error("Zahlung fehlgeschlagen");
      }

      setProcessing(false);


      const freshWorkerProfile = await loadApplication(); // Daten refreshen
      
      
      await handleRegistrationCheck(freshWorkerProfile);
      
    } catch (err) {
      console.error("❌ Payment error:", err);
      Alert.alert("Fehler", "Zahlung konnte nicht durchgeführt werden");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Lädt...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color={COLORS.accent} />
        <Text style={{ color: COLORS.text, fontSize: 18, marginTop: 12, textAlign: "center" }}>
          Application nicht gefunden
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24 }}
        >
          <Text style={{ fontWeight: "700", color: COLORS.bg }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView edges={["top","bottom"]}>
        <AppHeader />
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.accent} />
          </Pressable>
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: "700", marginLeft: 12 }}>
            Zahlung
          </Text>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Ionicons name="card" size={64} color={COLORS.accent} />
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "900", marginTop: 16 }}>
            20% Provision
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 16, marginTop: 8, textAlign: "center" }}>
            Zahle die Provision, um den Chat mit dem Worker freizuschalten
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 16, alignSelf: "flex-start" }}>
            Zahlungsart wählen
          </Text>

          {/* Kreditkarte */}
          <Pressable
            onPress={() => setPaymentMethod("card")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderRadius: 12,
              backgroundColor: paymentMethod === "card" ? COLORS.accent : COLORS.card,
              borderWidth: 1,
              borderColor: paymentMethod === "card" ? COLORS.accent : COLORS.border,
              marginBottom: 12,
              width: "60%",
              maxWidth: 300,
              minWidth: 220,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: paymentMethod === "card" ? COLORS.bg : COLORS.accent,
              backgroundColor: paymentMethod === "card" ? COLORS.bg : "transparent",
              marginRight: 12,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {paymentMethod === "card" && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent }} />
              )}
            </View>
            <Ionicons name="card-outline" size={24} color={paymentMethod === "card" ? COLORS.bg : COLORS.textMuted} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: paymentMethod === "card" ? "700" : "600", color: paymentMethod === "card" ? COLORS.bg : COLORS.textMuted }}>
              Kreditkarte
            </Text>
          </Pressable>

          {/* PayPal */}
          <Pressable
            onPress={() => setPaymentMethod("paypal")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderRadius: 12,
              backgroundColor: paymentMethod === "paypal" ? COLORS.accent : COLORS.card,
              borderWidth: 1,
              borderColor: paymentMethod === "paypal" ? COLORS.accent : COLORS.border,
              width: "60%",
              maxWidth: 300,
              minWidth: 220,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: paymentMethod === "paypal" ? COLORS.bg : COLORS.accent,
              backgroundColor: paymentMethod === "paypal" ? COLORS.bg : "transparent",
              marginRight: 12,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {paymentMethod === "paypal" && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent }} />
              )}
            </View>
            <Ionicons name="logo-paypal" size={24} color={paymentMethod === "paypal" ? COLORS.bg : COLORS.textMuted} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: paymentMethod === "paypal" ? "700" : "600", color: paymentMethod === "paypal" ? COLORS.bg : COLORS.textMuted }}>
              PayPal
            </Text>
          </Pressable>
        </View>

        {/* Pay Button */}
        <Pressable
          onPress={() => {
            handlePayment();
          }}
          disabled={processing}
          style={{
            backgroundColor: processing ? COLORS.textMuted : COLORS.accent,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            shadowColor: COLORS.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
            width: "60%",
            maxWidth: 300,
            minWidth: 220,
            alignSelf: "center",
          }}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.bg }}>
              Jetzt bezahlen
            </Text>
          )}
        </Pressable>

        {/* Info */}
        <View style={{ marginTop: 32, padding: 16, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 20 }}>
            ℹ️ Nach der Zahlung wird der Chat automatisch freigeschaltet und du kannst mit dem Worker kommunizieren.
          </Text>
        </View>
      </View>

      {/* Registration Modal (Business Arbeitgeber) */}
      <Modal
        visible={showRegistrationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(14, 11, 31, 0.95)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 16, textAlign: "center" }}>
              Anmeldung des Workers
            </Text>
            
            <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24, textAlign: "center" }}>
              Der Worker ist nicht selbstständig. Möchten Sie Hilfe bei der offiziellen Anmeldung?
            </Text>

            <Pressable
              onPress={() => {
                setShowRegistrationModal(false);
                requestOfficialRegistration(applicationId);
              }}
              style={({ pressed }) => ({
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: "center",
                marginBottom: 12,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.bg }}>
                📋 Ja, Hilfe bei der Anmeldung
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowRegistrationModal(false);
                setInformalRegistration(applicationId);
              }}
              style={({ pressed }) => ({
                borderWidth: 2,
                borderColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.accent }}>
                Ich kümmere mich selbst um die Anmeldung
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal für private Arbeitgeber (Jobs >= 300€) */}
      <Modal
        visible={showPrivateEmployerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivateEmployerModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(14, 11, 31, 0.95)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 16, textAlign: "center" }}>
              Hinweis für private Auftraggeber
            </Text>
            
            <Text style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24, textAlign: "center", lineHeight: 20 }}>
              Wenn du jemanden gegen Bezahlung beschäftigst, kann eine Anmeldung bei der Minijob-Zentrale erforderlich sein.{'\n\n'}
              Die App erzeugt alle notwendigen Unterlagen. Du reichst sie bei Bedarf selbst ein.{'\n\n'}
              Wir haben alle Unterlagen unter 'Meine Matches' für dich hinterlegt. Du kannst sie einfach an die Minijob-Zentrale weiterleiten.
            </Text>

            <Pressable
              onPress={() => {
                setShowPrivateEmployerModal(false);
                router.replace(`/(employer)/matches`);
              }}
              style={({ pressed }) => ({
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.bg }}>
                ✓ Verstanden
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
