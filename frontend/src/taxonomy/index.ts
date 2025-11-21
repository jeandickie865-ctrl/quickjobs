import { TAXONOMY, CategoryKey, TaxonomyCategory, listCategories as listCategoriesFromData } from '../../constants/workerData';

export type { CategoryKey, TaxonomyCategory } from '../../constants/workerData';

// Re-export for convenience
export function listCategories(): { key: CategoryKey; title: string }[] {
  return listCategoriesFromData();
}

export function getCategoryByKey(key: CategoryKey | string): TaxonomyCategory | undefined {
  const category = TAXONOMY.find(c => c.key === key);
  if (!category) {
    console.warn("[taxonomy] Unknown category key:", key);
  }
  return category;
}

/**
 * Get all tags (activities + qualifications) for a category
 * Always returns an array, never undefined
 */
export function listTagsByCategory(key: CategoryKey | string): string[] {
  const category = getCategoryByKey(key);
  if (!category) {
    return [];
  }

  const tags: string[] = [
    ...(category.activities ?? []),
    ...(category.qualifications ?? []),
  ];

  return tags;
}

/**
 * Get activities and qualifications separately for a category
 * Always returns both arrays, never undefined
 */
export function groupTagsByType(key: CategoryKey | string): {
  activities: string[];
  qualifications: string[];
} {
  const category = getCategoryByKey(key);
  if (!category) {
    return {
      activities: [],
      qualifications: [],
    };
  }

  return {
    activities: category.activities ?? [],
    qualifications: category.qualifications ?? [],
  };
}

/**
 * Normalize category keys - filter out invalid ones
 * Useful for cleaning up old profile data
 */
export function normalizeCategories(keys: string[]): CategoryKey[] {
  return keys
    .map(k => k.trim())
    .filter(k => TAXONOMY.some(c => c.key === k)) as CategoryKey[];
}