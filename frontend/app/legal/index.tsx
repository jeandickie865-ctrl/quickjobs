import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';

type LegalItem = {
  title: string;
  subtitle: string;
  route: string;
};

export default function LegalOverviewScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const legalItems: LegalItem[] = [
    {
      title: 'AGB',
      subtitle: 'Regeln für die Nutzung der App.',
      route: '/legal/agb',
    },
    {
      title: 'Datenschutzerklärung',
      subtitle: 'Wie wir mit deinen Daten umgehen.',
      route: '/legal/privacy',
    },
    {
      title: 'Grundsätze',
      subtitle: 'Was hier erlaubt ist und was nicht.',
      route: '/legal/guidelines',
    },
    {
      title: 'Impressum',
      subtitle: 'Angaben zum Betreiber der App.',
      route: '/legal/impressum',
    },
  ];

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
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.black }}>
            Rechtliches
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray600, marginTop: spacing.xs }}>
            Alles zu AGB, Datenschutz und Betreiber.
          </Text>
        </View>

        {/* Legal Items List */}
        <View style={{ gap: spacing.sm }}>
          {legalItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.beige100 : colors.white,
                borderRadius: 12,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.gray200,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: 4 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.gray600, lineHeight: 18 }}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: colors.gray400, marginLeft: spacing.sm }}>
                  →
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
