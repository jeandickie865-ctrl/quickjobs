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

export default function ImpressumScreen() {
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
            Impressum
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
            {/* Hauptüberschrift */}
            <View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.black, marginBottom: 8 }}>
                Impressum / Anbieterkennzeichnung
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.gray, fontStyle: 'italic' }}>
                (§ 5 TMG & § 18 Abs. 2 MStV)
              </Text>
            </View>

            {/* Name */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 }}>
                Name:
              </Text>
              <Text style={{ fontSize: 15, color: COLORS.black }}>
                Jean-Christine Dickie
              </Text>
            </View>

            {/* Adresse */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 }}>
                Adresse:
              </Text>
              <Text style={{ fontSize: 15, color: COLORS.black }}>
                Am Stadtpark 10{"\n"}
                40699 Erkrath{"\n"}
                Deutschland
              </Text>
            </View>

            {/* E-Mail */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 }}>
                E-Mail:
              </Text>
              <Text style={{ fontSize: 15, color: COLORS.purple }}>
                jeandickie865@gmail.com
              </Text>
            </View>

            {/* Telefon */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 4 }}>
                Telefon:
              </Text>
              <Text style={{ fontSize: 15, color: COLORS.gray, fontStyle: 'italic' }}>
                (nicht erforderlich, optional)
              </Text>
            </View>

            {/* Umsatzsteuer */}
            <View style={{
              backgroundColor: COLORS.lightGray,
              padding: 12,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 14, color: COLORS.darkGray }}>
                Keine Umsatzsteuer-ID vorhanden.
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 8 }}>
                Hinweis:
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 20 }}>
                Diese App befindet sich in einem privaten Testbetrieb (Beta).{"\n"}
                Es erfolgt keine kommerzielle Nutzung und kein Verkauf von Dienstleistungen oder Produkten.
              </Text>
            </View>

            {/* Verantwortlich */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.darkGray, marginBottom: 8 }}>
                Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
              </Text>
              <Text style={{ fontSize: 15, color: COLORS.black, lineHeight: 22 }}>
                Jean-Christine Dickie{"\n"}
                Am Stadtpark 10{"\n"}
                40699 Erkrath
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
