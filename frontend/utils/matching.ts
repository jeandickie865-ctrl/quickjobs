import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Legacy function - now redirects to new implementation
 * @deprecated Use jobMatchesWorker instead
 */
export function isMatch(job: Job, profile: WorkerProfile): boolean {
  return jobMatchesWorker(job, profile);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2);
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
 */
export function jobWithinRadius(job: Job, profile: WorkerProfile): boolean {
  if (!profile.radiusKm || profile.radiusKm <= 0) return true;
  if (job.lat === undefined || job.lon === undefined) return true;
  if (profile.homeLat === undefined || profile.homeLon === undefined) return true;
  const distance = haversineKm(profile.homeLat, profile.homeLon, job.lat, job.lon);
  return distance <= profile.radiusKm;
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

  const radiusOk = jobWithinRadius(job, profile);

  const ok = categoryOk && requiredAllOk && requiredAnyOk && radiusOk;

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
 * Check if job matches worker profile (using new field names)
 */
export function jobMatchesWorker(job: Job, profile: WorkerProfile): boolean {
  return jobMatchesWorkerWithDebug(job, profile).ok;
}

// Legacy implementation (kept for reference, now uses debug function)
function jobMatchesWorkerLegacy(job: Job, profile: WorkerProfile): boolean {
  const categoryKeys = profile.categories ?? [];
  const tagKeys = profile.selectedTags ?? [];

  if (categoryKeys.length === 0 || tagKeys.length === 0) {
    return false;
  }

  // Kategorie-Match: Job-Category-Key muss in den Profil-Kategorien vorhanden sein
  if (!categoryKeys.includes(job.category)) {
    return false;
  }

  const workerTags = new Set(tagKeys);

  // Alle Pflicht-Tags müssen vorhanden sein
  for (const tag of job.required_all_tags || []) {
    if (!workerTags.has(tag)) return false;
  }

  // Mindestens einer der optionalen Tags (wenn definiert)
  const anyTags = job.required_any_tags || [];
  if (anyTags.length > 0) {
    const hasOverlap = anyTags.some(t => workerTags.has(t));
    if (!hasOverlap) return false;
  }

  // Radius check
  if (!jobWithinRadius(job, profile)) {
    return false;
  }

  return true;
}