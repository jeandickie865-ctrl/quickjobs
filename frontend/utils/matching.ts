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
 * Check if a job matches a worker's profile
 * 
 * Matching criteria:
 * 1. Job category must be in worker's selected categories
 * 2. Job location must be within worker's search radius
 * 3. Worker must have ALL tags from required_all_tags
 * 4. Worker must have AT LEAST ONE tag from required_any_tags (if any are specified)
 */
export function isMatch(job: Job, profile: WorkerProfile): boolean {
  // Check category
  if (!profile.categories.includes(job.category)) return false;

  // Check required_all_tags
  const have = new Set(profile.tags);
  if (!job.required_all_tags.every(t => have.has(t))) return false;

  // Check required_any_tags
  if (job.required_any_tags.length > 0 && !job.required_any_tags.some(t => have.has(t))) return false;

  // Check distance
  const dist = haversineKm(profile.homeLat, profile.homeLon, job.lat, job.lon);
  if (dist > profile.radiusKm) return false;

  return true;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2);
}

/**
 * Filter jobs that match the worker profile
 */
export function filterMatchingJobs(jobs: Job[], profile: WorkerProfile): Job[] {
  return jobs.filter(job => isMatch(job, profile));
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