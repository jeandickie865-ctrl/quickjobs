// utils/taxonomy.ts - Taxonomy Helper Functions
import taxonomyData from "@/shared/taxonomy.json";

/**
 * Gibt alle Kategorien zurück
 */
export function getAllCategories() {
  return Object.keys(taxonomyData);
}

/**
 * Gibt das Label einer Kategorie zurück
 */
export function getCategoryLabel(key: string): string {
  return taxonomyData[key]?.label ?? key;
}

/**
 * Gibt alle Tags (required + optional) für eine Kategorie zurück
 */
export function getTagsForCategory(key: string) {
  const category = taxonomyData[key];
  if (!category) return [];
  
  const required = category.required || [];
  const optional = category.optional || [];
  
  return [...required, ...optional];
}

/**
 * Gibt das Label eines spezifischen Tags zurück
 */
export function getTagLabel(categoryKey: string, tagValue: string): string {
  const tags = getTagsForCategory(categoryKey);
  const tag = tags.find(t => t.value === tagValue);
  return tag?.label ?? tagValue;
}

/**
 * Alias für getAllCategories - gibt detaillierte Kategorie-Objekte zurück
 */
export function getCategories() {
  return Object.keys(taxonomyData).map(key => ({
    key,
    label: taxonomyData[key].label,
    required: taxonomyData[key].required || [],
    optional: taxonomyData[key].optional || [],
  }));
}

/**
 * Alias für getTagsForCategory - für Kompatibilität
 */
export function getAllTagsForCategory(categoryKey: string) {
  return getTagsForCategory(categoryKey);
}

// Default export für backward compatibility
export default taxonomyData;
