// utils/nearbyJobs.ts - MATCHING 2.2 (Extended Security Checks)
import { Job } from '../types/job';
import { WorkerProfile } from '../types/profile';
import { calculateDistance } from './distance';
import { normalizeAddress } from './normalizeAddress';
import { formatAddress } from '../types/address';
import { LOW_SKILL } from './matching';

// Security Tags (alle werden geprüft)
const SECURITY_SACHKUNDE = "Sachkunde nach § 34a GewO";
const SECURITY_UNTERRICHTUNG = "Unterrichtung nach § 34a GewO";
const SECURITY_BEWACHER_ID = "Bewacher-ID";
const SECURITY_FUEHRUNGSZEUGNIS = "Polizeiliches Führungszeugnis";

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

      // Check all security requirements (MATCHING 2.2)
      const jobTags = job.required_all_tags || [];
      
      let missingSecuritySkill: string | undefined;
      
      // Sachkunde §34a
      if (jobTags.includes(SECURITY_SACHKUNDE) && !workerSkills.includes(SECURITY_SACHKUNDE)) {
        missingSecuritySkill = "Sachkunde § 34a";
      }
      
      // Unterrichtung §34a (oder Sachkunde)
      if (jobTags.includes(SECURITY_UNTERRICHTUNG)) {
        const hasUnterrichtung = workerSkills.includes(SECURITY_UNTERRICHTUNG);
        const hasSachkunde = workerSkills.includes(SECURITY_SACHKUNDE);
        if (!hasUnterrichtung && !hasSachkunde) {
          missingSecuritySkill = "Unterrichtung § 34a";
        }
      }
      
      // Bewacher-ID
      if (jobTags.includes(SECURITY_BEWACHER_ID) && !workerSkills.includes(SECURITY_BEWACHER_ID)) {
        missingSecuritySkill = "Bewacher-ID";
      }
      
      // Polizeiliches Führungszeugnis
      if (jobTags.includes(SECURITY_FUEHRUNGSZEUGNIS) && !workerSkills.includes(SECURITY_FUEHRUNGSZEUGNIS)) {
        missingSecuritySkill = "Polizeiliches Führungszeugnis";
      }

      // Determine disabled state and reason
      const disabled = distance > worker.radiusKm || !!missingSecuritySkill;

      let disabledReason: string | undefined;
      if (distance > worker.radiusKm) {
        disabledReason = "Außerhalb deines Radius";
      } else if (missingSecuritySkill) {
        disabledReason = `Erfordert ${missingSecuritySkill}`;
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
