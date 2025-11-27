// Taxonomy Utility
// Loads and provides access to category/tag structure

import taxonomyData from '../shared/taxonomy.json';

export type TagStructure = {
  required: string[];
  optional: string[];
};

export type TaxonomyData = Record<string, TagStructure>;

// Type-safe taxonomy
export const TAXONOMY: TaxonomyData = taxonomyData as TaxonomyData;

/**
 * Get all tags (required + optional) for a category
 */
export function getAllTagsForCategory(categoryKey: string): string[] {
  const categoryTags = TAXONOMY[categoryKey];
  if (!categoryTags) return [];
  
  return [...categoryTags.required, ...categoryTags.optional];
}

/**
 * Get only required tags for a category
 */
export function getRequiredTagsForCategory(categoryKey: string): string[] {
  const categoryTags = TAXONOMY[categoryKey];
  if (!categoryTags) return [];
  
  return categoryTags.required;
}

/**
 * Get only optional tags for a category
 */
export function getOptionalTagsForCategory(categoryKey: string): string[] {
  const categoryTags = TAXONOMY[categoryKey];
  if (!categoryTags) return [];
  
  return categoryTags.optional;
}

/**
 * Get all tags for multiple categories (union)
 */
export function getAllTagsForCategories(categoryKeys: string[]): string[] {
  const allTags = new Set<string>();
  
  categoryKeys.forEach((categoryKey) => {
    const tags = getAllTagsForCategory(categoryKey);
    tags.forEach((tag) => allTags.add(tag));
  });
  
  return Array.from(allTags);
}

/**
 * Get all required tags for a category (as suggestion for employer)
 */
export function getSuggestedRequiredTags(categoryKey: string): string[] {
  return getRequiredTagsForCategory(categoryKey);
}

/**
 * Check if a tag is required for a category
 */
export function isTagRequired(categoryKey: string, tagKey: string): boolean {
  const requiredTags = getRequiredTagsForCategory(categoryKey);
  return requiredTags.includes(tagKey);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return Object.keys(TAXONOMY);
}
