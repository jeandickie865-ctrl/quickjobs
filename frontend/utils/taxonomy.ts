import taxonomy from "@/shared/taxonomy.json";

export function getCategories() {
  return Object.keys(taxonomy);
}

export function getAllCategories() {
  return Object.keys(taxonomy).map(key => ({
    key,
    label: taxonomy[key].label,
    required: taxonomy[key].required,
    optional: taxonomy[key].optional,
  }));
}

export function getTagsForCategory(cat: string) {
  if (!taxonomy[cat]) return [];
  return [...taxonomy[cat].required, ...taxonomy[cat].optional];
}

export function getAllTagsForCategory(categoryKey: string) {
  return taxonomy[categoryKey]?.required || taxonomy[categoryKey]?.optional 
    ? [...(taxonomy[categoryKey].required || []), ...(taxonomy[categoryKey].optional || [])]
    : [];
}

export function getTagLabel(cat: string, value: string) {
  const entry = getTagsForCategory(cat).find((t) => t.value === value);
  return entry ? entry.label : value;
}

export default taxonomy;
