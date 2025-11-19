import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui/Card';
import { listCategories, getCategory } from '../../src/taxonomy';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TaxonomyList() {
  const { colors, spacing } = useTheme();
  const cats = listCategories();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
      >
        <Text style={{ color: colors.black, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm }}>
          Taxonomie Test
        </Text>
        <Text style={{ color: colors.black, fontSize: 14, marginBottom: spacing.sm }}>
          Kategorien ({cats.length})
        </Text>

        {cats.map(c => {
          const tagCount = getCategory(c.key).tags.length;
          return (
            <Link key={c.key} href={`/taxonomy/${c.key}`} asChild>
              <Pressable
                role="button"
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.black, fontSize: 16, fontWeight: '600' }}>{c.label}</Text>
                    <Text style={{ color: colors.black, fontSize: 14 }}>{tagCount} Tags</Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}