export type TagType = 'qual'|'role'|'vehicle'|'license'|'doc'|'skill'|'tool';

export type Tag = { key: string; label: string; type: TagType };
export type Category = { key: string; label: string; tags: Tag[] };
export type Taxonomy = { version: number; radiusStepsKm: number[]; categories: Category[] };

import taxonomyJson from '../../shared/taxonomy.json';

export const TAXONOMY = taxonomyJson as Taxonomy;

export type CategoryKey = typeof TAXONOMY.categories[number]['key'];
export type TagKey = typeof TAXONOMY.categories[number]['tags'][number]['key'];

export function listCategories(): { key: CategoryKey; label: string }[] {
  return TAXONOMY.categories.map(c => ({ key: c.key as CategoryKey, label: c.label }));
}

export function getCategory(key: CategoryKey): Category {
  const cat = TAXONOMY.categories.find(c => c.key === key);
  if (!cat) throw new Error('Kategorie nicht gefunden: ' + key);
  return cat as Category;
}

export function listTagsByCategory(key: CategoryKey): Tag[] {
  return getCategory(key).tags;
}

export function groupTagsByType(key: CategoryKey): Record<TagType, Tag[]> {
  const res: Record<TagType, Tag[]> = { qual: [], role: [], vehicle: [], license: [], doc: [], skill: [], tool: [] };
  for (const t of listTagsByCategory(key)) res[t.type].push(t);
  return res;
}

export function isTagAllowedForCategory(key: CategoryKey, tagKey: TagKey): boolean {
  return getCategory(key).tags.some(t => t.key === tagKey);
}