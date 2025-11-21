import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';
import { calculateDistance } from './distance';

// Low-Skill-Kategorien (keine Pflicht-Qualifikationen erforderlich)
const LOW_SKILL_CATEGORIES = [
  "Gastronomie & Service - Küchenhilfe",
  "Gastronomie & Service - Spülkraft",
  "Lager & Logistik",
  "Reinigung",
  "Haus & Garten"
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
 * Check if job matches worker profile
 * Uses the debug function internally to ensure consistency
 */
export function jobMatchesWorker(job: Job, profile: WorkerProfile): boolean {
  return jobMatchesWorkerWithDebug(job, profile).ok;
}