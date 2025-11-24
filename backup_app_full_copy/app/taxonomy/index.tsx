import React from 'react';
import { FlatList } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import CategoryCard from '../../components/CategoryCard';
import { listCategories, getCategory } from '../../src/taxonomy';

export default function TaxonomyList() {
  const { colors } = useTheme();
  const cats = listCategories();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.beige50 }}>
      <FlatList
        data={cats}
        keyExtractor={(i) => i.key}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          const tagCount = getCategory(item.key).tags.length;
          return (
            <Link href={`/taxonomy/${item.key}`} asChild>
              <CategoryCard title={item.label} count={tagCount} onPress={() => {}} />
            </Link>
          );
        }}
      />
    </SafeAreaView>
  );
}