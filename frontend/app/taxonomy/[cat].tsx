import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import Chip from '../../components/ui/Chip';
import { getCategory, groupTagsByType, CategoryKey } from '../../src/taxonomy';

export default function CategoryDetail() {
  const { cat } = useLocalSearchParams<{ cat: string }>();
  const { colors, spacing } = useTheme();

  const category = getCategory(cat as CategoryKey);
  const groups = groupTagsByType(category.key as CategoryKey);

  const [mode, setMode] = useState<'all' | 'any'>('all');
  const [allSet, setAllSet] = useState<Set<string>>(new Set());
  const [anySet, setAnySet] = useState<Set<string>>(new Set());

  const toggle = (tag: string) => {
    if (mode === 'all') {
      if (allSet.has(tag)) {
        allSet.delete(tag);
      } else {
        allSet.add(tag);
        anySet.delete(tag);
      }
    } else {
      if (anySet.has(tag)) {
        anySet.delete(tag);
      } else {
        anySet.add(tag);
        allSet.delete(tag);
      }
    }
    setAllSet(new Set(allSet));
    setAnySet(new Set(anySet));
  };

  const isSelected = (tag: string) => {
    if (mode === 'all') return allSet.has(tag);
    return anySet.has(tag);
  };

  const getTone = (tag: string): 'solid' | 'outline' => {
    if (mode === 'all') {
      return anySet.has(tag) ? 'outline' : 'solid';
    }
    return allSet.has(tag) ? 'outline' : 'solid';
  };

  const Section = ({ title, items }: { title: string; items: { key: string; label: string }[] }) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.black, fontWeight: '700', marginBottom: spacing.xs, fontSize: 14 }}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {items.map(t => (
            <Chip
              key={t.key}
              label={t.label}
              selected={isSelected(t.key)}
              tone={getTone(t.key)}
              onPress={() => toggle(t.key)}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
        <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
      >
        <Text style={{ color: colors.black, fontSize: 20, fontWeight: '800', marginBottom: spacing.md }}>
          {category.label}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => setMode('all')}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 12,
              backgroundColor: mode === 'all' ? colors.black : colors.beige100,
              borderWidth: 1,
              borderColor: mode === 'all' ? colors.black : colors.gray200,
            }}
          >
            <Text
              style={{
                color: mode === 'all' ? colors.white : colors.black,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Pflicht
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('any')}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 12,
              backgroundColor: mode === 'any' ? colors.black : colors.beige100,
              borderWidth: 1,
              borderColor: mode === 'any' ? colors.black : colors.gray200,
            }}
          >
            <Text
              style={{
                color: mode === 'any' ? colors.white : colors.black,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Optional
            </Text>
          </Pressable>
        </View>

        <Section title="Rollen" items={groups.role} />
        <Section title="Qualifikationen" items={groups.qual} />
        <Section title="Lizenzen" items={groups.license} />
        <Section title="Dokumente" items={groups.doc} />
        <Section title="Skills" items={groups.skill} />
        <Section title="Werkzeuge" items={groups.tool} />
        <Section title="Fahrzeuge" items={groups.vehicle} />

        <View
          style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}
        >
          <Text style={{ color: colors.black, fontWeight: '700', marginBottom: spacing.sm }}>
            Zusammenfassung
          </Text>
          <Text style={{ color: colors.gray700, fontSize: 12, marginBottom: spacing.xs }}>
            required_all_tags: [{Array.from(allSet).join(', ')}]
          </Text>
          <Text style={{ color: colors.gray700, fontSize: 12 }}>
            required_any_tags: [{Array.from(anySet).join(', ')}]
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}