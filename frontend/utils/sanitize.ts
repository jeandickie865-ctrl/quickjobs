// utils/sanitize.ts - Defensive Programmierung für undefined/null Werte

/**
 * Stellt sicher, dass ein Wert ein String ist
 */
export function sanitizeString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * Stellt sicher, dass ein Wert ein Array ist
 */
export function sanitizeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Stellt sicher, dass ein Wert eine Zahl ist
 */
export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Stellt sicher, dass ein Wert ein Boolean ist
 */
export function sanitizeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (typeof value === "boolean") return value;
  return defaultValue;
}

/**
 * Sanitisiert ein Worker Profile komplett
 */
export function sanitizeWorkerProfile(profile: any): any {
  if (!profile) return {};
  
  return {
    ...profile,
    userId: sanitizeString(profile.userId),
    firstName: sanitizeString(profile.firstName),
    lastName: sanitizeString(profile.lastName),
    email: sanitizeString(profile.email),
    phone: sanitizeString(profile.phone),
    shortBio: sanitizeString(profile.shortBio),
    photoUrl: sanitizeString(profile.photoUrl),
    profilePhotoUri: sanitizeString(profile.profilePhotoUri),
    categories: sanitizeArray(profile.categories),
    selectedTags: sanitizeArray(profile.selectedTags),
    activities: sanitizeArray(profile.activities),
    qualifications: sanitizeArray(profile.qualifications),
    radiusKm: sanitizeNumber(profile.radiusKm, 25),
    isSelfEmployed: sanitizeBoolean(profile.isSelfEmployed, false),
    homeAddress: profile.homeAddress ? {
      street: sanitizeString(profile.homeAddress.street),
      houseNumber: sanitizeString(profile.homeAddress.houseNumber),
      postalCode: sanitizeString(profile.homeAddress.postalCode),
      city: sanitizeString(profile.homeAddress.city),
      country: sanitizeString(profile.homeAddress.country),
    } : {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
    },
  };
}

/**
 * Sanitisiert ein Employer Profile komplett
 */
export function sanitizeEmployerProfile(profile: any): any {
  if (!profile) return {};
  
  return {
    ...profile,
    userId: sanitizeString(profile.userId),
    companyName: sanitizeString(profile.companyName),
    contactPerson: sanitizeString(profile.contactPerson),
    email: sanitizeString(profile.email),
    phone: sanitizeString(profile.phone),
    description: sanitizeString(profile.description),
    address: profile.address ? {
      street: sanitizeString(profile.address.street),
      houseNumber: sanitizeString(profile.address.houseNumber),
      postalCode: sanitizeString(profile.address.postalCode),
      city: sanitizeString(profile.address.city),
      country: sanitizeString(profile.address.country),
    } : {
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      country: "Deutschland",
    },
  };
}

/**
 * Sanitisiert einen Job komplett
 */
export function sanitizeJob(job: any): any {
  if (!job) return {};
  
  return {
    ...job,
    id: sanitizeString(job.id),
    title: sanitizeString(job.title),
    description: sanitizeString(job.description),
    category: sanitizeString(job.category),
    required_all_tags: sanitizeArray(job.required_all_tags || job.tags),
    required_any_tags: sanitizeArray(job.required_any_tags),
  };
}
