import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

export default function PrivacyScreen() {
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
            Datenschutzerklärung von ShiftMatch
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
            Hier steht die Datenschutzerklärung von ShiftMatch.
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
            Der vollständige rechtliche Text wird später von der Rechtsabteilung ergänzt.
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
            Wir nehmen den Schutz deiner persönlichen Daten sehr ernst. Alle Informationen werden
            vertraulich behandelt und gemäß der geltenden Datenschutzbestimmungen gespeichert.
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
            Diese Plattform speichert nur die Daten, die für die Vermittlung zwischen Auftraggebern
            und Aufträgetartern notwendig sind.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
