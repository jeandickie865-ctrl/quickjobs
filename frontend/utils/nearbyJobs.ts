// utils/nearbyJobs.ts
import { Job } from '../types/job';
import { WorkerProfile } from '../types/profile';
import { calculateDistance } from './distance';
import { normalizeAddress } from './normalizeAddress';
import { formatAddress } from '../types/address';

const SPECIAL_SECURITY = "Sachkunde nach § 34a GewO";

export type NearbyJob = Job & {
  distance: number;
  normalizedAddress: string;
  disabled: boolean;
  disabledReason?: string;
};

/**
 * Get jobs near the worker with distance info and disabled state
 * @param jobs All jobs
 * @param worker Worker profile
 * @param maxDistanceKm Optional max distance (defaults to worker's radius or 30km)
 * @returns Sorted list of jobs with distance and disabled state
 */
export function nearbyJobs(
  jobs: Job[],
  worker: WorkerProfile,
  maxDistanceKm?: number
): NearbyJob[] {
  const workerRadius = worker.radiusKm ?? 30;
  const maxDistance = maxDistanceKm ?? workerRadius;
  
  const workerSkills = worker.selectedTags ?? [];

  return jobs
    .map(job => {
      // Calculate distance
      const distance = calculateDistance(
        { lat: job.lat, lon: job.lon },
        { lat: worker.homeLat, lon: worker.homeLon }
      );

      // Check if job requires 34a and worker doesn't have it
      const requires34a =
        job.required_all_tags?.includes(SPECIAL_SECURITY) &&
        !workerSkills.includes(SPECIAL_SECURITY);

      // Determine disabled state and reason
      let disabled = false;
      let disabledReason: string | undefined;

      if (distance > maxDistance) {
        disabled = true;
        disabledReason = "Außerhalb deines Radius";
      } else if (requires34a) {
        disabled = true;
        disabledReason = "Erfordert Sachkunde § 34a";
      }

      // Normalize address
      const normalizedAddress = formatAddress(job.address, true) || 
                                normalizeAddress(job.address?.city || "");

      return {
        ...job,
        distance,
        normalizedAddress,
        disabled,
        disabledReason,
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
}
