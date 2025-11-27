// Taxonomy Utility
// Loads and provides access to category/tag structure

import taxonomyData from '../shared/taxonomy.json';

export type TagOption = {
  value: string;
  label: string;
};

export type CategoryData = {
  label: string;
  required: TagOption[];
  optional: TagOption[];
};

export type TaxonomyData = Record<string, CategoryData>;

// Type-safe taxonomy
export const TAXONOMY: TaxonomyData = taxonomyData as TaxonomyData;

/**
 * Get all tag options (required + optional) for a category
 */
export function getAllTagsForCategory(categoryKey: string): TagOption[] {
  const category = TAXONOMY[categoryKey];
  if (!category) return [];
  
  return [...category.required, ...category.optional];
}

/**
 * Get all tag VALUES (required + optional) for a category
 */
export function getAllTagValuesForCategory(categoryKey: string): string[] {
  const tags = getAllTagsForCategory(categoryKey);
  return tags.map((tag) => tag.value);
}

/**
 * Get only required tag options for a category
 */
export function getRequiredTagsForCategory(categoryKey: string): TagOption[] {
  const category = TAXONOMY[categoryKey];
  if (!category) return [];
  
  return category.required;
}

/**
 * Get only required tag VALUES for a category
 */
export function getRequiredTagValuesForCategory(categoryKey: string): string[] {
  const tags = getRequiredTagsForCategory(categoryKey);
  return tags.map((tag) => tag.value);
}

/**
 * Get only optional tag options for a category
 */
export function getOptionalTagsForCategory(categoryKey: string): TagOption[] {
  const category = TAXONOMY[categoryKey];
  if (!category) return [];
  
  return category.optional;
}

/**
 * Get only optional tag VALUES for a category
 */
export function getOptionalTagValuesForCategory(categoryKey: string): string[] {
  const tags = getOptionalTagsForCategory(categoryKey);
  return tags.map((tag) => tag.value);
}

/**
 * Get all tag options for multiple categories (union)
 */
export function getAllTagsForCategories(categoryKeys: string[]): TagOption[] {
  const allTagsMap = new Map<string, TagOption>();
  
  categoryKeys.forEach((categoryKey) => {
    const tags = getAllTagsForCategory(categoryKey);
    tags.forEach((tag) => allTagsMap.set(tag.value, tag));
  });
  
  return Array.from(allTagsMap.values());
}

/**
 * Get all suggested required tags for a category (as suggestion for employer)
 */
export function getSuggestedRequiredTags(categoryKey: string): TagOption[] {
  return getRequiredTagsForCategory(categoryKey);
}

/**
 * Check if a tag is required for a category
 */
export function isTagRequired(categoryKey: string, tagValue: string): boolean {
  const requiredTagValues = getRequiredTagValuesForCategory(categoryKey);
  return requiredTagValues.includes(tagValue);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return Object.keys(TAXONOMY);
}

/**
 * Get category label
 */
export function getCategoryLabel(categoryKey: string): string {
  const category = TAXONOMY[categoryKey];
  return category?.label || categoryKey;
}

/**
 * Get tag label by value
 */
export function getTagLabel(categoryKey: string, tagValue: string): string {
  const allTags = getAllTagsForCategory(categoryKey);
  const tag = allTags.find((t) => t.value === tagValue);
  return tag?.label || tagValue;
}
