import { isTagAllowedForCategory as taxonomyCheck, CategoryKey, TagKey } from '../src/taxonomy';

export function isTagAllowedForCategory(category: string, tag: string): boolean {
  try {
    return taxonomyCheck(category as CategoryKey, tag as TagKey);
  } catch {
    return false;
  }
}

export function validateJob(data: {
  category: string;
  required_all_tags: string[];
  required_any_tags: string[];
  startAt: string;
  endAt: string;
  compensation: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check timestamps
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  if (start >= end) {
    errors.push('Startzeit muss vor Endzeit liegen');
  }

  // Check compensation
  if (data.compensation <= 0) {
    errors.push('Vergütung muss größer als 0 sein');
  }

  // Check tags belong to category
  const allTags = [...data.required_all_tags, ...data.required_any_tags];
  for (const tag of allTags) {
    if (!isTagAllowedForCategory(data.category, tag)) {
      errors.push(`Tag ${tag} gehört nicht zur Kategorie ${data.category}`);
    }
  }

  return { valid: errors.length === 0, errors };
}