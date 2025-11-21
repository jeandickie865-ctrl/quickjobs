import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';
import { calculateDistance } from './distance';

// Low-Skill-Kategorien (keine Pflicht-Qualifikationen erforderlich)
const LOW_SKILL_CATEGORIES = [
  "Gastronomie - Küchenhilfe",
  "Gastronomie - Spülkraft",
  "Gastronomie - Buffet",
  "Gastronomie - Runner",
  "Lager & Logistik - Helfer",
  "Lager & Logistik - Inventur",
  "Lager & Logistik - Warenverräumung",
  "Reinigung - Gebäudereinigung",
  "Reinigung - Haushaltshilfe",
  "Haus & Garten - Gartenpflege",
  "Haus & Garten - Umzugshilfe",
  "Event - Aufbau",
  "Event - Abbau",
  "Event - Helfer",
  "Event - Garderobe",
  "Event - Ticketkontrolle",
  "Produktion - einfache Tätigkeiten",
  "Montage - leichte Montage",
  "Sortierung - einfache Sortierung"
];

// Special Security Tag
const SPECIAL_SECURITY = "Sachkunde nach § 34a GewO";

/**
 * Check if worker has ALL required tags
 */
function workerHasAll(workerSkills: string[], requiredList: string[]): boolean {
  if (!requiredList || requiredList.length === 0) return true;
  return requiredList.every(tag => workerSkills.includes(tag));
}

/**
 * Check if worker has at least ONE of the alternative tags
 */
function workerHasOne(workerSkills: string[], alternatives: string[]): boolean {
  if (!alternatives || alternatives.length === 0) return true;
  return alternatives.some(tag => workerSkills.includes(tag));
}

/**
 * Legacy function - now redirects to new implementation
 * @deprecated Use jobMatchesWorker instead
 */
export function isMatch(job: Job, profile: WorkerProfile): boolean {
  return jobMatchesWorker(job, profile);
}

/**
 * Filter jobs that match the worker profile
 */
export function filterMatchingJobs(jobs: Job[], profile: WorkerProfile): Job[] {
  return jobs.filter(job => jobMatchesWorker(job, profile));
}

/**
 * Calculate match score (0-100) for sorting
 * Higher score = better match
 */
export function calculateMatchScore(job: Job, profile: WorkerProfile): number {
  let score = 0;

  // Distance score (closer = better): max 40 points
  const distance = calculateDistance(profile.homeLat, profile.homeLon, job.lat, job.lon);
  const distanceScore = Math.max(0, 40 * (1 - distance / profile.radiusKm));
  score += distanceScore;

  // Tag match score: max 40 points
  const workerTagSet = new Set(profile.tags);
  const allJobTags = [...job.required_all_tags, ...job.required_any_tags];
  const matchingTags = allJobTags.filter(tag => workerTagSet.has(tag));
  if (allJobTags.length > 0) {
    const tagMatchRatio = matchingTags.length / allJobTags.length;
    score += 40 * tagMatchRatio;
  } else {
    // No specific tags required = bonus
    score += 20;
  }

  // Pay score: max 20 points (higher pay = higher score)
  const payScore = Math.min(20, (job.workerAmountCents / 10000) * 20);
  score += payScore;

  return Math.round(score);
}

export function sortJobsByMatch(
  jobs: Job[],
  profile: WorkerProfile
): Job[] {
  return jobs.sort((a, b) => {
    const scoreA = calculateMatchScore(a, profile);
    const scoreB = calculateMatchScore(b, profile);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Check if job is within worker's radius
 * NOTE: Distance filtering temporarily disabled for MVP phase.
 * All jobs are considered within radius.
 */
export function jobWithinRadius(job: Job, profile: WorkerProfile): boolean {
  // Distance filtering vorübergehend deaktiviert.
  // Wenn aktiviert: prüfen, dass keine undefined/null Koordinaten als 0 behandelt werden
  
  // Für zukünftige Aktivierung vorbereitet:
  // const jobLat = typeof job.lat === 'number' ? job.lat : null;
  // const jobLon = typeof job.lon === 'number' ? job.lon : null;
  // const homeLat = typeof profile.homeLat === 'number' ? profile.homeLat : null;
  // const homeLon = typeof profile.homeLon === 'number' ? profile.homeLon : null;
  // if (jobLat == null || jobLon == null || homeLat == null || homeLon == null) {
  //   return true; // Fehlende Koordinaten = kein Filter
  // }
  // const distance = haversineKm(homeLat, homeLon, jobLat, jobLon);
  // return distance <= profile.radiusKm;
  
  return true; // Alle Jobs gelten als innerhalb des Radius
}

/**
 * Debug information for job matching
 */
export type MatchDebug = {
  ok: boolean;
  jobId: string;
  jobCategory: string;
  profileCategories: string[];
  requiredAllJob: string[];
  requiredAnyJob: string[];
  profileTags: string[];
  missingRequiredAll: string[];
  anyIntersection: string[];
  categoryOk: boolean;
  requiredAllOk: boolean;
  requiredAnyOk: boolean;
};

/**
 * Check if job matches worker with detailed debug information
 */
export function jobMatchesWorkerWithDebug(job: Job, profile: WorkerProfile): MatchDebug {
  const categories = profile.categories ?? [];
  const tagKeys = profile.selectedTags ?? [];

  const categoryOk = categories.includes(job.category);

  const workerTags = new Set(tagKeys);
  const requiredAllJob = job.required_all_tags ?? [];
  const requiredAnyJob = job.required_any_tags ?? [];

  const missingRequiredAll = requiredAllJob.filter(t => !workerTags.has(t));

  const requiredAllOk = missingRequiredAll.length === 0;

  let anyIntersection: string[] = [];
  let requiredAnyOk = true;
  if (requiredAnyJob.length > 0) {
    anyIntersection = requiredAnyJob.filter(t => workerTags.has(t));
    requiredAnyOk = anyIntersection.length > 0;
  }

  // Radius check removed - distance filtering disabled for MVP
  const ok = categoryOk && requiredAllOk && requiredAnyOk;

  return {
    ok,
    jobId: job.id,
    jobCategory: job.category,
    profileCategories: categories,
    requiredAllJob,
    requiredAnyJob,
    profileTags: tagKeys,
    missingRequiredAll,
    anyIntersection,
    categoryOk,
    requiredAllOk,
    requiredAnyOk,
  };
}

/**
 * Check if job matches worker profile (Matching 2.0)
 * Includes:
 * - Hard-Skill Security check (34a)
 * - Low-Skill categories bypass qualification requirements
 * - Required tasks check
 * - Alternative qualifications check  
 * - Radius check
 * - Job status check
 */
export function jobMatchesWorker(job: Job, profile: WorkerProfile): boolean {
  if (!job || !profile) return false;

  const workerSkills = profile.selectedTags ?? [];
  const workerCategories = profile.categories ?? [];

  // 1. Category match
  if (!workerCategories.includes(job.category)) {
    return false;
  }

  // 2. Hard-Skill Security check (34a must have)
  const requiredAllTags = job.required_all_tags ?? [];
  if (requiredAllTags.includes(SPECIAL_SECURITY)) {
    if (!workerSkills.includes(SPECIAL_SECURITY)) {
      return false;
    }
  }

  // 3. Low-Skill categories: skip qualification requirements
  const isLowSkill = LOW_SKILL_CATEGORIES.includes(job.category);
  
  if (!isLowSkill) {
    // Check all required qualifications/tasks
    if (!workerHasAll(workerSkills, requiredAllTags)) {
      return false;
    }
  } else {
    // For low-skill: only check non-34a tags
    const nonSecurityRequired = requiredAllTags.filter(t => t !== SPECIAL_SECURITY);
    if (!workerHasAll(workerSkills, nonSecurityRequired)) {
      return false;
    }
  }

  // 4. Alternative qualifications (required_any_tags)
  const requiredAnyTags = job.required_any_tags ?? [];
  if (!workerHasOne(workerSkills, requiredAnyTags)) {
    return false;
  }

  // 5. Radius check (if both have coordinates)
  if (profile.homeLat && profile.homeLon && job.lat && job.lon) {
    const distance = calculateDistance(
      { lat: job.lat, lon: job.lon },
      { lat: profile.homeLat, lon: profile.homeLon }
    );
    
    const workerRadius = profile.radiusKm ?? 30; // Default 30km
    if (distance > workerRadius) {
      return false;
    }
  }

  // 6. Job status check
  if (!['open', 'pending'].includes(job.status)) {
    return false;
  }

  // 7. No double match
  if (job.matchedWorkerId) {
    return false;
  }

  return true;
}

/**
 * Legacy compatibility function
 * Uses the debug function internally to ensure consistency
 */
export function jobMatchesWorkerLegacy(job: Job, profile: WorkerProfile): boolean {
  return jobMatchesWorkerWithDebug(job, profile).ok;
}