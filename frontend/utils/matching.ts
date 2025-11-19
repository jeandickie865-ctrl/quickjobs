import { WorkerProfile } from '../types/profile';
import { Job } from '../types/profile';

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

export function isMatch(
  worker: { categories: string[]; tags: string[]; homeLat: number; homeLon: number; radiusKm: number },
  job: { category: string; required_all_tags: string[]; required_any_tags: string[]; locationLat: number; locationLon: number; startAt: string; endAt: string }
): boolean {
  // Check category
  if (!worker.categories.includes(job.category)) return false;

  // Check required_all_tags
  const have = new Set(worker.tags);
  if (!job.required_all_tags.every(t => have.has(t))) return false;

  // Check required_any_tags
  if (job.required_any_tags.length > 0 && !job.required_any_tags.some(t => have.has(t))) return false;

  // Check distance
  const dist = haversineKm(worker.homeLat, worker.homeLon, job.locationLat, job.locationLon);
  if (dist > worker.radiusKm) return false;

  // Check time
  const now = new Date();
  if (new Date(job.endAt) <= now) return false;

  return true;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return haversineKm(lat1, lon1, lat2, lon2);
}

export function sortJobsByDistanceAndTime(
  jobs: Job[],
  workerLat: number,
  workerLon: number
): Job[] {
  return jobs.sort((a, b) => {
    const distA = calculateDistance(workerLat, workerLon, a.locationLat, a.locationLon);
    const distB = calculateDistance(workerLat, workerLon, b.locationLat, b.locationLon);
    
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB;
    }
    
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });
}