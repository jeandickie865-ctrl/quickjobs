import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

export default function ImpressumScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.gray600,
              textDecorationLine: 'underline',
              marginBottom: spacing.md,
            }}
            onPress={() => router.back()}
          >
            ← Zurück
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: spacing.sm }}>
            Impressum
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray600 }}>
            Hier findest du die Angaben zum Betreiber der App.
          </Text>
        </View>

        {/* Content */}
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Text style={{ fontSize: 16, color: colors.black, lineHeight: 24 }}>
            Name der Firma, Rechtsform, Anschrift, Kontakt und Handelsregister-Angaben werden hier noch ergänzt.
          </Text>
          
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.black }}>
              Angaben gemäß § 5 TMG:
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              [Firmenname]{'\n'}
              [Rechtsform]{'\n'}
              [Straße und Hausnummer]{'\n'}
              [PLZ Ort]{'\n'}
              [Land]
            </Text>
          </View>

          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.black }}>
              Kontakt:
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              Telefon: [Telefonnummer]{'\n'}
              E-Mail: [E-Mail-Adresse]
            </Text>
          </View>

          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.black }}>
              Handelsregister:
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              Eintragung im Handelsregister{'\n'}
              Registergericht: [Gericht]{'\n'}
              Registernummer: [Nummer]
            </Text>
          </View>

          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.black }}>
              Umsatzsteuer-ID:
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{'\n'}
              [USt-IdNr.]
            </Text>
          </View>

          <View style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray200 }}>
            <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 18, fontStyle: 'italic' }}>
              Die vollständigen Angaben werden von der Rechtsabteilung ergänzt.
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
