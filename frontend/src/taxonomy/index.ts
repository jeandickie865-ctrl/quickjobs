export type TagType = 'activity' | 'qualification';

export type Tag = { key: string; label: string; type: TagType };

export type TaxonomyCategory = { 
  key: string; 
  label: string; 
  activities: { key: string; label: string }[];
  qualifications: { key: string; label: string }[];
};

export type Taxonomy = { 
  version: number; 
  radiusStepsKm: number[]; 
  categories: TaxonomyCategory[] 
};

import taxonomyJson from '../../shared/taxonomy.json';

export const TAXONOMY = taxonomyJson as unknown as Taxonomy;

export type CategoryKey = string;
export type TagKey = string;

export function listCategories(): { key: CategoryKey; label: string }[] {
  return TAXONOMY.categories.map(c => ({ key: c.key, label: c.label }));
}

export function getCategory(key: CategoryKey): TaxonomyCategory | null {
  const cat = TAXONOMY.categories.find(c => c.key === key);
  if (!cat) {
    console.warn('⚠️ Category not found:', key);
    return null;
  }
  return cat;
}

export function listTagsByCategory(key: CategoryKey): Tag[] {
  try {
    const cat = getCategory(key);
    if (!cat) {
      console.warn(`⚠️ listTagsByCategory: Category not found for key "${key}"`);
      return [];
    }
    
    // Combine activities and qualifications into a single Tag array
    const tags: Tag[] = [
      ...(cat.activities || []).map(t => ({ key: t.key, label: t.label, type: 'activity' as TagType })),
      ...(cat.qualifications || []).map(t => ({ key: t.key, label: t.label, type: 'qualification' as TagType })),
    ];
    
    console.log(`📋 Tags for category ${key}:`, tags.length);
    return tags;
  } catch (error) {
    console.error(`❌ Error in listTagsByCategory for "${key}":`, error);
    return [];
  }
}

export function groupTagsByType(key: CategoryKey): { activities: Tag[]; qualifications: Tag[] } {
  try {
    const cat = getCategory(key);
    if (!cat) {
      console.warn(`⚠️ groupTagsByType: Category not found for key "${key}"`);
      return { activities: [], qualifications: [] };
    }
    
    const result = {
      activities: (cat.activities || []).map(t => ({ key: t.key, label: t.label, type: 'activity' as TagType })),
      qualifications: (cat.qualifications || []).map(t => ({ key: t.key, label: t.label, type: 'qualification' as TagType })),
    };
    
    console.log(`📋 groupTagsByType for "${key}": ${result.activities.length} activities, ${result.qualifications.length} qualifications`);
    return result;
  } catch (error) {
    console.error(`❌ Error in groupTagsByType for "${key}":`, error);
    return { activities: [], qualifications: [] };
  }
}

export function isTagAllowedForCategory(key: CategoryKey, tagKey: TagKey): boolean {
  const tags = listTagsByCategory(key);
  return tags.some(t => t.key === tagKey);
}