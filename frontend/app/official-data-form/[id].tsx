// app/official-data-form/[id].tsx - Official Worker Data Form
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../config";
import { getAuthHeaders } from "../../utils/api";

const COLORS = {
  purple: "#EFABFF",
  neon: "#EFABFF",
  white: '#1A1A1A',
  cardText: "#1A1A1A",
  black: "#000000",
  gray: "#DDDDDD",
  darkGray: "#333333",
  error: '#EFABFF',
};

export default function OfficialDataFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const applicationId = params.id as string;

  // Personal Data
  const [birthDate, setBirthDate] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  
  // Work & Tax Data
  const [taxId, setTaxId] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [iban, setIban] = useState("");
  const [nationality, setNationality] = useState("Deutsch");
  
  // Work Permit
  const [workPermitRequired, setWorkPermitRequired] = useState(false);
  const [workPermitFileUrl, setWorkPermitFileUrl] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Validation
    if (!birthDate || !street || !postalCode || !city || !taxId || !healthInsurance || !iban) {
      Alert.alert("Fehler", "Bitte fülle alle Pflichtfelder aus");
      return;
    }

    try {
      setSubmitting(true);
      const headers = await getAuthHeaders();

      const workerOfficialData = {
        birthDate,
        address: {
          street,
          houseNumber,
          postalCode,
          city,
          country,
        },
        taxId,
        healthInsurance,
        iban,
        nationality,
        workPermit: {
          required: workPermitRequired,
          fileUrl: workPermitFileUrl || null,
        },
      };

      const res = await fetch(`${API_URL}/applications/${applicationId}/respond-official-registration`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          decision: "accept",
          workerOfficialData,
        }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      Alert.alert(
        "Erfolg",
        "Deine Daten wurden erfolgreich übermittelt!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Fehler", "Daten konnten nicht übermittelt werden");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.purple }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <AppHeader />
        {/* Header */}
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.neon} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "700", marginLeft: 12 }}>
            Offizielle Anmeldung
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <Text style={{ color: COLORS.white, fontSize: 16, marginBottom: 20 }}>
            Bitte fülle alle Felder aus, um die offizielle Anmeldung abzuschließen.
          </Text>

          {/* Personal Data */}
          <Text style={{ color: COLORS.neon, fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
            📋 Persönliche Daten
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Geburtsdatum *
            </Text>
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="TT.MM.JJJJ"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Address */}
          <Text style={{ color: COLORS.neon, fontSize: 18, fontWeight: "700", marginBottom: 16, marginTop: 8 }}>
            🏠 Adresse
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Straße *
            </Text>
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="Musterstraße"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Hausnummer *
            </Text>
            <TextInput
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="123"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                PLZ *
              </Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="12345"
                placeholderTextColor={COLORS.gray}
                keyboardType="number-pad"
                style={{
                  backgroundColor: COLORS.white,
                  padding: 14,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              />
            </View>

            <View style={{ flex: 2 }}>
              <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Stadt *
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Berlin"
                placeholderTextColor={COLORS.gray}
                style={{
                  backgroundColor: COLORS.white,
                  padding: 14,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Land *
            </Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Deutschland"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Work & Tax Data */}
          <Text style={{ color: COLORS.neon, fontSize: 18, fontWeight: "700", marginBottom: 16, marginTop: 8 }}>
            💼 Steuer & Versicherung
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Steuer-ID *
            </Text>
            <TextInput
              value={taxId}
              onChangeText={setTaxId}
              placeholder="12 345 678 901"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Krankenversicherung *
            </Text>
            <TextInput
              value={healthInsurance}
              onChangeText={setHealthInsurance}
              placeholder="AOK, TK, Barmer, etc."
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              IBAN *
            </Text>
            <TextInput
              value={iban}
              onChangeText={setIban}
              placeholder="DE89 3704 0044 0532 0130 00"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
              Staatsangehörigkeit *
            </Text>
            <TextInput
              value={nationality}
              onChangeText={setNationality}
              placeholder="Deutsch"
              placeholderTextColor={COLORS.gray}
              style={{
                backgroundColor: COLORS.white,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
              }}
            />
          </View>

          {/* Work Permit */}
          <Text style={{ color: COLORS.neon, fontSize: 18, fontWeight: "700", marginBottom: 16, marginTop: 8 }}>
            📝 Arbeitserlaubnis
          </Text>

          <Pressable
            onPress={() => setWorkPermitRequired(!workPermitRequired)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
              padding: 14,
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: COLORS.white,
                backgroundColor: workPermitRequired ? COLORS.neon : "transparent",
                marginRight: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {workPermitRequired && <Ionicons name="checkmark" size={18} color={COLORS.black} />}
            </View>
            <Text style={{ color: COLORS.white, fontSize: 15, flex: 1 }}>
              Ich benötige eine Arbeitserlaubnis
            </Text>
          </Pressable>

          {workPermitRequired && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Upload-URL (optional)
              </Text>
              <TextInput
                value={workPermitFileUrl}
                onChangeText={setWorkPermitFileUrl}
                placeholder="https://..."
                placeholderTextColor={COLORS.gray}
                style={{
                  backgroundColor: COLORS.white,
                  padding: 14,
                  borderRadius: 12,
                  fontSize: 16,
                }}
              />
            </View>
          )}

          {/* Info Box */}
          <View
            style={{
              backgroundColor: "rgba(200, 255, 22, 0.1)",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.neon,
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: COLORS.neon, fontSize: 13, lineHeight: 20 }}>
              ℹ️ Deine Daten werden sicher übertragen und nur für die offizielle Anmeldung verwendet.
            </Text>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: submitting ? COLORS.gray : COLORS.neon,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.black }}>
              {submitting ? "Wird übermittelt..." : "Daten übermitteln"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
