// app/payment/[id].tsx - Payment Screen für Employer
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config";
import { getAuthHeaders } from "../../utils/api";

const COLORS = {
  background: "#0E0B1F",
  card: "#141126",
  neon: "#C8FF16",
  white: "#FFFFFF",
  lightText: "#E8E8E8",
  dimText: "#A0A0A0",
  border: "#2A2738",
  gray: "#DDDDDD",
  black: "#000000",
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
      console.log("🔍 [LOAD] Fetching worker profile for:", data.workerId);
      const workerRes = await fetch(`${API_URL}/profiles/worker/${data.workerId}`, { headers });
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        console.log("🔍 [LOAD] Worker profile received:", workerData);
        console.log("🔍 [LOAD] isSelfEmployed VALUE:", workerData.isSelfEmployed);
        console.log("🔍 [LOAD] isSelfEmployed TYPE:", typeof workerData.isSelfEmployed);
        setWorkerProfile(workerData);
      } else {
        console.log("❌ [LOAD] Worker profile fetch FAILED:", workerRes.status);
      }

      // Auto-Redirect deaktiviert, Modal-Logik übernimmt nach Zahlung
      console.log("🔍 [LOAD] paymentStatus:", data.paymentStatus);
    } catch (err) {
      console.error("Load application error:", err);
      Alert.alert("Fehler", "Application konnte nicht geladen werden");
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

  const handleRegistrationCheck = async () => {
    console.log("🔍 [MODAL CHECK] START");
    console.log("🔍 [MODAL CHECK] user.accountType:", user?.accountType);
    console.log("🔍 [MODAL CHECK] workerProfile:", workerProfile);
    console.log("🔍 [MODAL CHECK] workerProfile.isSelfEmployed:", workerProfile?.isSelfEmployed);
    console.log("🔍 [MODAL CHECK] workerProfile.isSelfEmployed TYPE:", typeof workerProfile?.isSelfEmployed);

    if (!workerProfile) {
      console.log("❌ [MODAL CHECK] NO workerProfile - showing error");
      Alert.alert("Fehler", "Worker-Daten fehlen.");
      return;
    }

    const isSelf = workerProfile.isSelfEmployed === true;
    console.log("🔍 [MODAL CHECK] isSelf (=== true):", isSelf);

    // PRIVATE + NICHT selbstständig → Private Modal
    if (user?.accountType === "private" && !isSelf) {
      console.log("✅ [MODAL CHECK] Showing PRIVATE EMPLOYER MODAL");
      setShowPrivateEmployerModal(true);
      return;
    }

    // BUSINESS oder selbstständig → Business Modal
    console.log("✅ [MODAL CHECK] Showing BUSINESS REGISTRATION MODAL");
    setShowRegistrationModal(true);
  };

  async function handlePayment() {
    console.log("💳 handlePayment called - paymentMethod:", paymentMethod);
    console.log("💳 processing:", processing);
    
    // Double-Clicks verhindern
    if (processing) {
      console.log("⚠️ Already processing payment, ignoring click");
      return;
    }

    try {
      setProcessing(true);
      console.log("🔄 Starting payment process...");
      
      const headers = await getAuthHeaders();

      const res = await fetch(`${API_URL}/applications/${applicationId}/confirm-payment`, {
        method: "POST",
        headers,
      });

      console.log("📡 Payment response status:", res.status);

      if (!res.ok) {
        throw new Error("Zahlung fehlgeschlagen");
      }

      console.log("✅ Payment successful!");
      setProcessing(false);

      console.log("🔍 [PAYMENT] BEFORE RELOAD:");
      console.log("🔍 [PAYMENT] USER accountType:", user?.accountType);
      console.log("🔍 [PAYMENT] WORKER isSelfEmployed:", workerProfile?.isSelfEmployed);
      console.log("🔍 [PAYMENT] JOB:", job);

      console.log("🔍 [PAYMENT] Re-loading application after payment…");
      await loadApplication(); // Daten refreshen
      
      console.log("🔍 [PAYMENT] AFTER RELOAD:");
      console.log("🔍 [PAYMENT] WORKER isSelfEmployed:", workerProfile?.isSelfEmployed);
      console.log("🔍 [PAYMENT] Calling handleRegistrationCheck now...");
      
      await handleRegistrationCheck();
      
    } catch (err) {
      console.error("❌ Payment error:", err);
      Alert.alert("Fehler", "Zahlung konnte nicht durchgeführt werden");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ color: COLORS.lightText, marginTop: 10 }}>Lädt...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color={COLORS.neon} />
        <Text style={{ color: COLORS.white, fontSize: 18, marginTop: 12, textAlign: "center" }}>
          Application nicht gefunden
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{ backgroundColor: COLORS.neon, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24 }}
        >
          <Text style={{ fontWeight: "700", color: COLORS.background }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView edges={["top"]}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "700", marginLeft: 12 }}>
            Zahlung
          </Text>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Ionicons name="card" size={64} color={COLORS.neon} />
          <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: "900", marginTop: 16 }}>
            20% Provision
          </Text>
          <Text style={{ color: COLORS.white, fontSize: 16, marginTop: 8, textAlign: "center" }}>
            Zahle die Provision, um den Chat mit dem Worker freizuschalten
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
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
              backgroundColor: paymentMethod === "card" ? COLORS.neon : COLORS.white,
              marginBottom: 12,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: paymentMethod === "card" ? COLORS.black : COLORS.darkGray,
              backgroundColor: paymentMethod === "card" ? COLORS.black : "transparent",
              marginRight: 12,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {paymentMethod === "card" && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.neon }} />
              )}
            </View>
            <Ionicons name="card-outline" size={24} color={paymentMethod === "card" ? COLORS.black : COLORS.darkGray} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: paymentMethod === "card" ? "700" : "600", color: paymentMethod === "card" ? COLORS.black : COLORS.darkGray }}>
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
              backgroundColor: paymentMethod === "paypal" ? COLORS.neon : COLORS.white,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: paymentMethod === "paypal" ? COLORS.black : COLORS.darkGray,
              backgroundColor: paymentMethod === "paypal" ? COLORS.black : "transparent",
              marginRight: 12,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {paymentMethod === "paypal" && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.neon }} />
              )}
            </View>
            <Ionicons name="logo-paypal" size={24} color={paymentMethod === "paypal" ? COLORS.black : COLORS.darkGray} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: paymentMethod === "paypal" ? "700" : "600", color: paymentMethod === "paypal" ? COLORS.black : COLORS.darkGray }}>
              PayPal
            </Text>
          </Pressable>
        </View>

        {/* Pay Button */}
        <Pressable
          onPress={() => {
            console.log("🔔 Pay button clicked! Payment method:", paymentMethod);
            console.log("🔔 Processing:", processing);
            handlePayment();
          }}
          disabled={processing}
          style={{
            backgroundColor: processing ? COLORS.gray : COLORS.neon,
            paddingVertical: 18,
            borderRadius: 16,
            alignItems: "center",
            shadowColor: COLORS.neon,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.black }}>
              Jetzt bezahlen
            </Text>
          )}
        </Pressable>

        {/* Info */}
        <View style={{ marginTop: 32, padding: 16, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12 }}>
          <Text style={{ color: COLORS.white, fontSize: 14, lineHeight: 20 }}>
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
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.black, marginBottom: 16, textAlign: "center" }}>
              Anmeldung des Workers
            </Text>
            
            <Text style={{ fontSize: 14, color: COLORS.darkGray, marginBottom: 24, textAlign: "center" }}>
              Der Worker ist nicht selbstständig. Möchten Sie Hilfe bei der offiziellen Anmeldung?
            </Text>

            <Pressable
              onPress={() => {
                setShowRegistrationModal(false);
                requestOfficialRegistration(applicationId);
              }}
              style={({ pressed }) => ({
                backgroundColor: COLORS.neon,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: "center",
                marginBottom: 12,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.black }}>
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
                borderColor: COLORS.neon,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.purple }}>
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
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.black, marginBottom: 16, textAlign: "center" }}>
              Hinweis für private Auftraggeber
            </Text>
            
            <Text style={{ fontSize: 14, color: COLORS.darkGray, marginBottom: 24, textAlign: "center", lineHeight: 20 }}>
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
                backgroundColor: COLORS.neon,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.black }}>
                ✓ Verstanden
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
