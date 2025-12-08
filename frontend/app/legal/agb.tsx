import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  purple: '#EFABFF',
  neon: '#EFABFF',
  white: '#1A1A1A',
  cardText: "#1A1A1A",
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#F5F5F5',
};

export default function AGBScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.purple }}>
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader />
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
            AGB
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
                Allgemeine Geschäftsbedingungen (AGB)
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray, fontStyle: 'italic' }}>
                Testbetrieb – Beta-Version – nicht kommerziell
              </Text>
            </View>

            {/* Hinweis */}
            <View style={{
              backgroundColor: '#FFF9E6',
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.neon,
            }}>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Diese App befindet sich in einem privaten Testmodus. Die Nutzung dient ausschließlich dem Testen der Funktionen und nicht der tatsächlichen Vermittlung von Dienstleistungen.
              </Text>
            </View>

            {/* 1. Geltungsbereich */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                1. Geltungsbereich
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Diese AGB gelten für alle Nutzer der Testversion dieser App.
              </Text>
            </View>

            {/* 2. Testzweck */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                2. Testzweck
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Die Nutzung der App dient nur zu Testzwecken:{"\n"}
                • Erstellung von Profilen{"\n"}
                • Job-Erstellung{"\n"}
                • Bewerbungen{"\n"}
                • Matching{"\n"}
                • Chat{"\n"}
                • Bewertungen{"\n\n"}
                Es entstehen keine rechtlich bindenden Verträge zwischen Nutzern.
              </Text>
            </View>

            {/* 3. Haftungsausschluss */}
            <View style={{
              backgroundColor: '#FFEBEE',
              padding: 16,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#E53935',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                3. Haftungsausschluss
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Da es sich um einen Beta-Test handelt, übernimmt die Anbieterin keine Haftung für:{"\n"}
                • technische Probleme{"\n"}
                • Datenverlust{"\n"}
                • falsche Matching-Ergebnisse{"\n"}
                • Verhalten anderer Tester
              </Text>
            </View>

            {/* 4. Pflichten der Tester */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                4. Pflichten der Tester
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Tester verpflichten sich:{"\n"}
                • keine beleidigenden oder illegalen Inhalte zu senden{"\n"}
                • keine realen personenbezogenen Daten Dritter zu nutzen{"\n"}
                • erkannte Fehler zu melden
              </Text>
            </View>

            {/* 5. Beendigung */}
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                5. Beendigung des Testbetriebs
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Der Testbetrieb kann jederzeit beendet werden.
              </Text>
            </View>

            {/* 6. Löschung */}
            <View style={{
              backgroundColor: '#E8F5E9',
              padding: 16,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 8 }}>
                6. Löschung von Daten
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Tester können jederzeit die Löschung ihrer Daten verlangen.{"\n\n"}
                Kontakt: jeandickie865@gmail.com
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
