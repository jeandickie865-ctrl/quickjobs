import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui/Card';
import { getCategory, groupTagsByType, CategoryKey } from '../../src/taxonomy';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryDetail() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const { colors, spacing } = useTheme();

  const category = getCategory(cat as CategoryKey);
  const groups = groupTagsByType(category.key as CategoryKey);

  const Section = ({ title, items }: { title: string; items: { key: string; label: string }[] }) => {
    if (!items || items.length === 0) return null;
    return (
      <Card style={{ marginBottom: spacing.sm }}>
        <Text style={{ color: colors.black, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map(t => (
            <Pressable
              key={t.key}
              onPress={() => console.log('tag', t.key)}
              style={{
                borderWidth: 1,
                borderColor: colors.gray200,
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: colors.beige100,
              }}
            >
              <Text style={{ color: colors.black, fontSize: 12 }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <Stack.Screen options={{ title: category.label, headerShown: true }} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
      >
        <Text style={{ color: colors.black, fontSize: 20, fontWeight: '800', marginBottom: spacing.md }}>
          {category.label}
        </Text>

        <Section title="Rollen" items={groups.role} />
        <Section title="Qualifikationen" items={groups.qual} />
        <Section title="Lizenzen" items={groups.license} />
        <Section title="Dokumente" items={groups.doc} />
        <Section title="Skills" items={groups.skill} />
        <Section title="Werkzeuge" items={groups.tool} />
        <Section title="Fahrzeuge" items={groups.vehicle} />
      </ScrollView>
    </SafeAreaView>
  );
}