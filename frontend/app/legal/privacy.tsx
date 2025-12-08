import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#F5F5F5',
};

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.25)',
        }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.neon} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
            Datenschutz
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            padding: 20,
            gap: 20,
          }}>
            {/* Titel */}
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.black, marginBottom: 8 }}>
                Datenschutzerklärung
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.gray, lineHeight: 20 }}>
                Diese App befindet sich in einem privaten Testbetrieb und wird ausschließlich zu Testzwecken genutzt. Die folgenden Hinweise erklären, welche Daten im Rahmen dieser Tests erhoben und verarbeitet werden.
              </Text>
            </View>

            {/* 1. Verantwortliche Stelle */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                1. Verantwortliche Stelle
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Jean-Christine Dickie{"\n"}
                Am Stadtpark 10{"\n"}
                40699 Erkrath{"\n"}
                E-Mail: jeandickie865@gmail.com
              </Text>
            </View>

            {/* 2. Welche Daten */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                2. Welche Daten verarbeitet werden
              </Text>
              
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginTop: 8, marginBottom: 4 }}>
                2.1. Nutzerangaben
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                • Name{"\n"}
                • E-Mail-Adresse (für Login){"\n"}
                • Profilinformationen{"\n"}
                • Adresse (optional){"\n"}
                • Kategorien und Tags{"\n"}
                • Radius für das Matching
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginTop: 12, marginBottom: 4 }}>
                2.2. Funktionsbezogene Daten
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                • Jobs, die Sie erstellen{"\n"}
                • Bewerbungen, die Sie senden{"\n"}
                • Bewertungen{"\n"}
                • Chat-Nachrichten (nur im Testbetrieb)
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.darkGray, marginTop: 12, marginBottom: 4 }}>
                2.3. Technische Daten
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                • Geräteinformationen{"\n"}
                • App-Nutzungsdaten
              </Text>
            </View>

            {/* 3. Zweck */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                3. Zweck der Verarbeitung
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Die Datenverarbeitung dient ausschließlich folgenden Zwecken:{"\n"}
                • Bereitstellung der App-Funktionen{"\n"}
                • Testen der Matching-Mechanik{"\n"}
                • Kommunikation (Chat){"\n"}
                • Debugging und Verbesserung der App{"\n\n"}
                Keine Daten werden verkauft oder an Dritte weitergegeben.
              </Text>
            </View>

            {/* 4. Rechtsgrundlage */}
            <View style={{
              backgroundColor: COLORS.lightGray,
              padding: 12,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                4. Rechtsgrundlage
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Art. 6 Abs. 1 lit. a DSGVO – Einwilligung{"\n"}
                Die App wird freiwillig genutzt.
              </Text>
            </View>

            {/* 5. Speicherdauer */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                5. Speicherdauer
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Die Daten werden nur für den Zeitraum des Testbetriebs gespeichert und bei Bedarf gelöscht.
              </Text>
            </View>

            {/* 6. Ihre Rechte */}
            <View style={{
              backgroundColor: '#E8F5E9',
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.neon,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                6. Ihre Rechte
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Sie haben folgende Rechte:{"\n"}
                • Auskunft über gespeicherte Daten{"\n"}
                • Berichtigung{"\n"}
                • Löschung{"\n"}
                • Einschränkung{"\n"}
                • Widerruf{"\n\n"}
                Kontakt: jeandickie865@gmail.com
              </Text>
            </View>

            {/* 7. Datensicherheit */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                7. Datensicherheit
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                • Daten werden in einer gesicherten MongoDB gespeichert.{"\n"}
                • Es werden keine externen Tracking- oder Werbesysteme eingesetzt.
              </Text>
            </View>

            {/* 8. Kontakt */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                8. Kontakt zur Datenschutzverantwortlichen
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Jean-Christine Dickie{"\n"}
                E-Mail: jeandickie865@gmail.com
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
