// utils/matching.ts - MATCHING 2.2 (Extended Branchen-Support) + BUG 2 FIX
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

// ===== MATCHING 2.2: Branchen-Check-Funktionen =====

/**
 * Security Hard-Checks
 */
function checkSecurityRequirements(jobTags: string[], workerSkills: string[]): boolean {
  // Sachkunde §34a - MUSS haben
  if (jobTags.includes(SECURITY_SACHKUNDE)) {
    if (!workerSkills.includes(SECURITY_SACHKUNDE)) {
      return false;
    }
  }

  // Unterrichtung §34a - MUSS haben (oder Sachkunde)
  if (jobTags.includes(SECURITY_UNTERRICHTUNG)) {
    const hasUnterrichtung = workerSkills.includes(SECURITY_UNTERRICHTUNG);
    const hasSachkunde = workerSkills.includes(SECURITY_SACHKUNDE);
    if (!hasUnterrichtung && !hasSachkunde) {
      return false;
    }
  }

  // Bewacher-ID - MUSS haben
  if (jobTags.includes(SECURITY_BEWACHER_ID)) {
    if (!workerSkills.includes(SECURITY_BEWACHER_ID)) {
      return false;
    }
  }

  // Polizeiliches Führungszeugnis - MUSS haben
  if (jobTags.includes(SECURITY_FUEHRUNGSZEUGNIS)) {
    if (!workerSkills.includes(SECURITY_FUEHRUNGSZEUGNIS)) {
      return false;
    }
  }

  return true;
}

/**
 * Delivery Vehicle Checks
 * Prüft ob Worker Fahrzeug-Anforderungen erfüllt
 */
function checkDeliveryVehicleRequirements(jobTags: string[], workerSkills: string[]): boolean {
  // Fahrzeug gestellt → keine Checks nötig
  const vehicleProvided = jobTags.some(tag => 
    tag.toLowerCase().includes('fahrzeug gestellt') || 
    tag.toLowerCase().includes('vehicle provided')
  );
  if (vehicleProvided) return true;

  // PKW erforderlich
  const needsPkw = jobTags.some(tag => 
    tag.toLowerCase().includes('pkw') || 
    tag.toLowerCase().includes('auto')
  );
  if (needsPkw) {
    const hasPkwLicense = workerSkills.includes(VEHICLE_PKW);
    const hasOwnPkw = workerSkills.includes(VEHICLE_OWN_PKW);
    if (!hasPkwLicense && !hasOwnPkw) {
      return false;
    }
  }

  // Roller/Moped erforderlich
  const needsRoller = jobTags.some(tag => 
    tag.toLowerCase().includes('roller') || 
    tag.toLowerCase().includes('moped')
  );
  if (needsRoller) {
    const hasRollerLicense = workerSkills.includes(VEHICLE_ROLLER);
    const hasOwnRoller = workerSkills.includes(VEHICLE_OWN_ROLLER);
    if (!hasRollerLicense && !hasOwnRoller) {
      return false;
    }
  }

  // 125ccm erforderlich
  const needs125 = jobTags.some(tag => tag.toLowerCase().includes('125ccm'));
  if (needs125) {
    const has125License = workerSkills.includes(VEHICLE_125CCM);
    const hasOwn125 = workerSkills.includes(VEHICLE_OWN_125CCM);
    if (!has125License && !hasOwn125) {
      return false;
    }
  }

  // Fahrrad erforderlich
  const needsBike = jobTags.some(tag => tag.toLowerCase().includes('fahrrad'));
  if (needsBike) {
    if (!workerSkills.includes(VEHICLE_OWN_FAHRRAD)) {
      return false;
    }
  }

  // E-Bike erforderlich
  const needsEbike = jobTags.some(tag => 
    tag.toLowerCase().includes('e-bike') || 
    tag.toLowerCase().includes('ebike')
  );
  if (needsEbike) {
    if (!workerSkills.includes(VEHICLE_OWN_EBIKE)) {
      return false;
    }
  }

  return true;
}

/**
 * Inventur Checks
 */
function checkInventurRequirements(jobCategory: string, jobTags: string[], workerSkills: string[]): boolean {
  if (jobCategory.toLowerCase().includes('inventur')) {
    // Scanner-Erfahrung ist Pflicht wenn gefordert
    if (jobTags.includes(INVENTUR_SCANNER)) {
      if (!workerSkills.includes(INVENTUR_SCANNER)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Nachhilfe Checks
 * Mindestens EINE der erforderlichen Qualifikationen muss vorhanden sein
 */
function checkNachhilfeRequirements(jobCategory: string, jobTags: string[], workerSkills: string[]): boolean {
  if (jobCategory.toLowerCase().includes('nachhilfe')) {
    // Prüfe ob mindestens ein Required Skill vorhanden ist
    const hasRequiredSkill = NACHHILFE_REQUIRED_SKILLS.some(skill => 
      workerSkills.includes(skill)
    );
    
    if (!hasRequiredSkill) {
      return false;
    }

    // Wenn Job ein spezifisches Fach verlangt, MUSS Worker dieses haben
    const requiredFaecher = jobTags.filter(tag => tag.startsWith('Fach '));
    for (const fach of requiredFaecher) {
      if (!workerSkills.includes(fach)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Main matching function - MATCHING 2.2 (Extended Branchen-Support)
 * BUG 2 FIX: Radius-Check nur wenn BEIDE Koordinaten vorhanden
 * 
 * Reihenfolge:
 * 1. Category-Pass
 * 2. Security Hard-Checks (alle Branchen)
 * 3. Delivery Fahrzeug/Führerschein Checks
 * 4. Inventur Pflicht-Checks
 * 5. Nachhilfe Pflicht-Checks
 * 6. Low-Skill Bypass für einfache Tätigkeiten
 * 7. Required-All (nur High-Skill)
 * 8. Required-Any (nur High-Skill)
 * 9. Radius (NUR wenn BEIDE Koordinaten vorhanden)
 * 10. Status
 * 11. Kein Doppelmatch
 */
export function matchJobToWorker(job: Job, worker: WorkerProfile): boolean {
  if (!job || !worker) {
    console.log('❌ matching: null job or worker');
    return false;
  }

  const workerSkills = worker.selectedTags || [];
  const workerCategories = worker.categories || [];
  const requiredAllTags = job.required_all_tags || [];
  const requiredAnyTags = job.required_any_tags || [];

  console.log(`🔎 Checking job "${job.title}" (ID: ${job.id})`);
  console.log('   Job category:', job.category);
  console.log('   Worker categories:', workerCategories);
  console.log('   Worker tags:', workerSkills);
  console.log('   Required ALL tags:', requiredAllTags);
  console.log('   Required ANY tags:', requiredAnyTags);

  // 1. Category match
  if (!workerCategories.includes(job.category)) {
    console.log('❌ matching: category mismatch', { jobCategory: job.category, workerCategories });
    return false;
  }
  console.log('✅ Category match OK');

  // 2. Security Hard-Checks (IMMER, alle Branchen)
  if (!checkSecurityRequirements(requiredAllTags, workerSkills)) {
    console.log('❌ matching: security requirements not met', { jobId: job.id });
    return false;
  }

  // 3. Delivery Fahrzeug/Führerschein Checks
  if (!checkDeliveryVehicleRequirements(requiredAllTags, workerSkills)) {
    console.log('❌ matching: delivery vehicle requirements not met', { jobId: job.id });
    return false;
  }

  // 4. Inventur Pflicht-Checks
  if (!checkInventurRequirements(job.category, requiredAllTags, workerSkills)) {
    console.log('❌ matching: inventur requirements not met', { jobId: job.id });
    return false;
  }

  // 5. Nachhilfe Pflicht-Checks
  if (!checkNachhilfeRequirements(job.category, requiredAllTags, workerSkills)) {
    console.log('❌ matching: nachhilfe requirements not met', { jobId: job.id });
    return false;
  }

  // 6. Low-skill Bypass
  const isLow = LOW_SKILL.includes(job.category);
  
  if (!isLow) {
    // 7. High-Skill: Required-All
    if (!workerHasAll(workerSkills, requiredAllTags)) {
      console.log('❌ matching: required all tags not met', { jobId: job.id });
      return false;
    }
    
    // 8. High-Skill: Required-Any
    if (!workerHasOne(workerSkills, requiredAnyTags)) {
      console.log('❌ matching: required any tags not met', { jobId: job.id });
      return false;
    }
  }

  // ===== BUG 2 FIX: Radius-Check nur wenn BEIDE Koordinaten vorhanden =====
  // Wenn Job ODER Worker keine Koordinaten hat → KEIN Distanz-Filter
  if (!job.lat || !job.lon || !worker.homeLat || !worker.homeLon) {
    console.log('✅ matching: no coords – job kept', { 
      workerId: worker.userId, 
      jobId: job.id,
      jobHasCoords: !!(job.lat && job.lon),
      workerHasCoords: !!(worker.homeLat && worker.homeLon)
    });
    // Job bleibt im Ergebnis, Radius wird NICHT geprüft
  } else {
    // Beide haben Koordinaten → Distanz berechnen und filtern
    const distance = calculateDistance(
      { lat: job.lat, lon: job.lon },
      { lat: worker.homeLat, lon: worker.homeLon }
    );
    
    if (distance > worker.radiusKm) {
      console.log('❌ matching: filtered by radius', { 
        jobId: job.id, 
        distanceKm: distance.toFixed(1), 
        workerRadiusKm: worker.radiusKm 
      });
      return false;
    }
    
    console.log('✅ matching: radius check OK', { 
      jobId: job.id,
      distanceKm: distance.toFixed(1), 
      workerRadiusKm: worker.radiusKm 
    });
  }

  // 10. Status check
  if (!['open', 'pending'].includes(job.status)) {
    console.log('❌ matching: job status not open/pending', { jobId: job.id, status: job.status });
    return false;
  }

  // 11. Kein Doppelmatch
  if (job.matchedWorkerId) {
    console.log('❌ matching: job already matched', { jobId: job.id });
    return false;
  }

  console.log('✅ matching: JOB MATCHED', { jobId: job.id, workerId: worker.userId });
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
