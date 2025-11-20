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
  const cat = getCategory(key);
  if (!cat) return [];
  
  // Combine activities and qualifications into a single Tag array
  const tags: Tag[] = [
    ...(cat.activities || []).map(t => ({ key: t.key, label: t.label, type: 'activity' as TagType })),
    ...(cat.qualifications || []).map(t => ({ key: t.key, label: t.label, type: 'qualification' as TagType })),
  ];
  
  console.log(`📋 Tags for category ${key}:`, tags.length);
  return tags;
}

export function groupTagsByType(key: CategoryKey): { activities: Tag[]; qualifications: Tag[] } {
  const cat = getCategory(key);
  if (!cat) return { activities: [], qualifications: [] };
  
  return {
    activities: (cat.activities || []).map(t => ({ key: t.key, label: t.label, type: 'activity' as TagType })),
    qualifications: (cat.qualifications || []).map(t => ({ key: t.key, label: t.label, type: 'qualification' as TagType })),
  };
}

export function isTagAllowedForCategory(key: CategoryKey, tagKey: TagKey): boolean {
  const tags = listTagsByCategory(key);
  return tags.some(t => t.key === tagKey);
}