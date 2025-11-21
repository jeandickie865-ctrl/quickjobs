// utils/nearbyJobs.ts - MATCHING 2.0 FINAL
import { Job } from '../types/job';
import { WorkerProfile } from '../types/profile';
import { calculateDistance } from './distance';
import { normalizeAddress } from './normalizeAddress';
import { formatAddress } from '../types/address';
import { LOW_SKILL } from './matching';

const SPECIAL_SECURITY = "Sachkunde nach § 34a GewO";

export type NearbyJob = Job & {
  distance: number;
  normalizedAddress: string;
  disabled: boolean;
  disabledReason?: string;
};

/**
 * Get jobs near the worker with distance info and disabled state
 * MATCHING 2.0 - Simple nearby jobs view
 */
export function nearbyJobs(
  jobs: Job[],
  worker: WorkerProfile
): NearbyJob[] {
  const workerSkills = worker.selectedTags || [];

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
      const disabled = distance > worker.radiusKm || requires34a;

      let disabledReason: string | undefined;
      if (distance > worker.radiusKm) {
        disabledReason = "Außerhalb deines Radius";
      } else if (requires34a) {
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
