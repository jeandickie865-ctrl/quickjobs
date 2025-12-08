import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { AppHeader } from '../../../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

export default function GuidelinesScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <AppHeader />
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
            Grundsätze von ShiftMatch
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray600 }}>
            Was hier erlaubt ist – und was nicht.
          </Text>
        </View>

        {/* Content */}
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.black }}>
              So nutzen wir diese Plattform miteinander
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              ShiftMatch bringt Auftraggeber und Aufträgetarter für kurzfristige Aufträge zusammen.
              Damit das fair und transparent funktioniert, gelten diese Grundsätze:
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
              ✓ Das ist erlaubt
            </Text>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Aufträge für kurzfristige Einsätze anbieten und annehmen
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Faire Bezahlung direkt zwischen Auftraggeber und Aufträgetarter vereinbaren
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Ehrliche und vollständige Profile erstellen
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Respektvoll miteinander kommunizieren
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
              ✗ Das ist nicht erlaubt
            </Text>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Illegale Tätigkeiten anbieten oder ausführen
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Falsche Angaben in Profilen oder Jobangeboten machen
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Diskriminierung aufgrund von Geschlecht, Herkunft, Religion etc.
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Belästigung, Bedrohung oder unangemessenes Verhalten
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
                • Umgehung von gesetzlichen Anmeldepflichten oder Steuern
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.beige100,
              borderRadius: 12,
              padding: spacing.lg,
              gap: spacing.sm,
              borderLeftWidth: 3,
              borderLeftColor: colors.black,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black }}>
              Wichtig zu wissen
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              ShiftMatch ist eine Vermittlungsplattform. Wir sind nicht Auftraggeber und übernehmen keine
              rechtliche Verantwortung für die Verträge zwischen den Parteien.
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray700, lineHeight: 22 }}>
              Du bist selbst dafür verantwortlich, dass deine Tätigkeit ordnungsgemäß angemeldet ist
              und alle gesetzlichen Vorgaben eingehalten werden.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.gray600, lineHeight: 22, fontStyle: 'italic' }}>
              Der vollständige Text dieser Grundsätze wird später von der Rechtsabteilung ergänzt.
              Bei Verstößen gegen diese Grundsätze können Accounts gesperrt werden.
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
