// utils/matching.ts - MATCHING 2.2 (Extended Branchen-Support)
import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';
import { calculateDistance } from './distance';

// Low-Skill-Kategorien (keine Pflicht-Qualifikationen erforderlich)
export const LOW_SKILL = [
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

// ===== MATCHING 2.2: Branchen-spezifische Tags =====

// Security Tags (Hard-Checks)
const SECURITY_SACHKUNDE = "Sachkunde nach § 34a GewO";
const SECURITY_UNTERRICHTUNG = "Unterrichtung nach § 34a GewO";
const SECURITY_BEWACHER_ID = "Bewacher-ID";
const SECURITY_FUEHRUNGSZEUGNIS = "Polizeiliches Führungszeugnis";

// Delivery Vehicle Tags
const VEHICLE_PKW = "Führerschein Klasse B";
const VEHICLE_ROLLER = "Führerschein AM";
const VEHICLE_125CCM = "Führerschein A1";
const VEHICLE_OWN_PKW = "eigener Pkw";
const VEHICLE_OWN_ROLLER = "eigener Roller / Moped";
const VEHICLE_OWN_FAHRRAD = "eigenes Fahrrad";
const VEHICLE_OWN_EBIKE = "eigenes E-Bike";
const VEHICLE_OWN_125CCM = "eigener 125ccm";

// Inventur Tags
const INVENTUR_SCANNER = "Scanner-Erfahrung";

// Nachhilfe Tags (Mindestens einer erforderlich)
const NACHHILFE_REQUIRED_SKILLS = [
  "Nachhilfe-Erfahrung",
  "Pädagogische Erfahrung",
  "Fach Mathe",
  "Fach Englisch",
  "Fach Deutsch",
  "Fach Physik",
  "Fach Chemie",
  "Fach Biologie"
];

// Nachhilfe Optional Skills (blockieren nicht)
const NACHHILFE_OPTIONAL_SKILLS = [
  "Geduldig",
  "Kommunikativ",
  "Strukturiert"
];

/**
 * Check if worker has ALL required tags
 */
function workerHasAll(skills: string[], required: string[]): boolean {
  if (!required || required.length === 0) return true;
  return required.every(tag => skills.includes(tag));
}

/**
 * Check if worker has at least ONE of the alternative tags
 */
function workerHasOne(skills: string[], alternatives: string[]): boolean {
  if (!alternatives || alternatives.length === 0) return true;
  return alternatives.some(tag => skills.includes(tag));
}

/**
 * Main matching function - Matching 2.0
 */
export function matchJobToWorker(job: Job, worker: WorkerProfile): boolean {
  if (!job || !worker) return false;

  const workerSkills = worker.selectedTags || [];
  const workerCategories = worker.categories || [];

  // 1. Category match
  if (!workerCategories.includes(job.category)) {
    return false;
  }

  // 2. Sicherheitsbereich (34a must have)
  const requiredAllTags = job.required_all_tags || [];
  if (requiredAllTags.includes(SPECIAL_SECURITY)) {
    if (!workerSkills.includes(SPECIAL_SECURITY)) {
      return false;
    }
  }

  // 3. Low-skill Jobs: keine Pflicht-Qualifikationen (außer 34a)
  const isLow = LOW_SKILL.includes(job.category);
  if (!isLow) {
    if (!workerHasAll(workerSkills, requiredAllTags)) {
      return false;
    }
  }

  // 4. Alternative Qualifikationen (required_any_tags)
  const requiredAnyTags = job.required_any_tags || [];
  if (!workerHasOne(workerSkills, requiredAnyTags)) {
    return false;
  }

  // 5. Radius check
  if (worker.homeLat && worker.homeLon && job.lat && job.lon) {
    const distance = calculateDistance(
      { lat: job.lat, lon: job.lon },
      { lat: worker.homeLat, lon: worker.homeLon }
    );
    if (distance > worker.radiusKm) {
      return false;
    }
  }

  // 6. Status check
  if (!['open', 'pending'].includes(job.status)) {
    return false;
  }

  // 7. Kein Doppelmatch
  if (job.matchedWorkerId) {
    return false;
  }

  return true;
}

/**
 * Legacy function - redirects to new implementation
 * @deprecated Use matchJobToWorker instead
 */
export function isMatch(job: Job, profile: WorkerProfile): boolean {
  return matchJobToWorker(job, profile);
}

/**
 * Alias for consistency with existing code
 */
export function jobMatchesWorker(job: Job, profile: WorkerProfile): boolean {
  return matchJobToWorker(job, profile);
}

/**
 * Filter jobs that match the worker profile
 */
export function filterMatchingJobs(jobs: Job[], profile: WorkerProfile): Job[] {
  return jobs.filter(job => matchJobToWorker(job, profile));
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
 * Uses the new Matching 2.0 logic
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

  // Use the main matching function for final result
  const ok = matchJobToWorker(job, profile);

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
