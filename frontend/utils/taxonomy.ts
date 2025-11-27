import taxonomy from "@/shared/taxonomy.json";

export function getCategories() {
  return Object.keys(taxonomy);
}

export function getTagsForCategory(cat: string) {
  if (!taxonomy[cat]) return [];
  return [...taxonomy[cat].required, ...taxonomy[cat].optional];
}

export function getTagLabel(cat: string, value: string) {
  const entry = getTagsForCategory(cat).find((t) => t.value === value);
  return entry ? entry.label : value;
}

export default taxonomy;
