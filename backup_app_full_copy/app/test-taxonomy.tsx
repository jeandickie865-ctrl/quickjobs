import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { listCategories, getCategory, groupTagsByType } from '../src/taxonomy';
import { RADIUS_OPTIONS_KM, DEFAULT_RADIUS_KM } from '../constants/radius';

export default function TestTaxonomy() {
  const { colors, spacing } = useTheme();

  useEffect(() => {
    console.log('=== TAXONOMY TEST ===');
    
    // Test 1: List all categories
    const categories = listCategories();
    console.log('Total categories:', categories.length);
    console.log('First category:', categories[0]);
    
    // Test 2: Get specific category
    const sicherheit = getCategory('sicherheit');
    console.log('Sicherheit tags:', sicherheit.tags.length);
    
    // Test 3: Group tags by type
    const grouped = groupTagsByType('sicherheit');
    console.log('Sicherheit grouped:', {
      qual: grouped.qual.length,
      doc: grouped.doc.length,
    });
    
    // Test 4: Check radius options
    console.log('Radius options:', RADIUS_OPTIONS_KM);
    console.log('Default radius:', DEFAULT_RADIUS_KM);
    
    // Test 5: Check for duplicate tag keys
    const allTags = categories.flatMap(c => getCategory(c.key).tags);
    const tagKeys = allTags.map(t => t.key);
    const uniqueKeys = new Set(tagKeys);
    console.log('Total tags:', tagKeys.length);
    console.log('Unique tags:', uniqueKeys.size);
    console.log('Has duplicates:', tagKeys.length !== uniqueKeys.size);
    
    if (tagKeys.length !== uniqueKeys.size) {
      const duplicates = tagKeys.filter((key, index) => tagKeys.indexOf(key) !== index);
      console.log('Duplicate keys:', [...new Set(duplicates)]);
    }
  }, []);

  const categories = listCategories();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={[styles.title, { color: colors.black, marginBottom: spacing.lg }]}>
          Taxonomie Test
        </Text>

        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900, marginBottom: spacing.md }]}>
            Kategorien ({categories.length})
          </Text>
          {categories.map((cat) => {
            const category = getCategory(cat.key);
            return (
              <View
                key={cat.key}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.beige50,
                    borderColor: colors.beige300,
                    marginBottom: spacing.sm,
                    padding: spacing.md,
                    borderRadius: 12,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.black }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.gray700 }]}>
                  {category.tags.length} Tags
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray900, marginBottom: spacing.md }]}>
            Radius Optionen
          </Text>
          {RADIUS_OPTIONS_KM.map((radius) => (
            <View
              key={radius}
              style={[
                styles.radiusItem,
                {
                  backgroundColor: radius === DEFAULT_RADIUS_KM ? colors.black : colors.gray100,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  borderRadius: 8,
                },
              ]}
            >
              <Text
                style={{
                  color: radius === DEFAULT_RADIUS_KM ? colors.white : colors.gray900,
                  fontWeight: radius === DEFAULT_RADIUS_KM ? '600' : '400',
                }}
              >
                {radius} km {radius === DEFAULT_RADIUS_KM ? '(Standard)' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.gray900, marginBottom: spacing.md }]}>
            Beispiel: Sicherheit Tags
          </Text>
          {(() => {
            const grouped = groupTagsByType('sicherheit');
            return (
              <View>
                <Text style={[styles.groupTitle, { color: colors.gray700, marginBottom: spacing.sm }]}>
                  Qualifikationen ({grouped.qual.length}):
                </Text>
                {grouped.qual.map((tag) => (
                  <Text key={tag.key} style={[styles.tagText, { color: colors.black, marginBottom: spacing.xs }]}>
                    • {tag.label}
                  </Text>
                ))}
                <Text style={[styles.groupTitle, { color: colors.gray700, marginTop: spacing.md, marginBottom: spacing.sm }]}>
                  Dokumente ({grouped.doc.length}):
                </Text>
                {grouped.doc.map((tag) => (
                  <Text key={tag.key} style={[styles.tagText, { color: colors.black, marginBottom: spacing.xs }]}>
                    • {tag.label}
                  </Text>
                ))}
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {},
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  radiusItem: {},
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagText: {
    fontSize: 14,
  },
});
