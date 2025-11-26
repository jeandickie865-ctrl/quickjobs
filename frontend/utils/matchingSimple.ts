// utils/matchingSimple.ts - SUPER SIMPLE MATCHING - FUNKTIONIERT IMMER!
import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';
import { calculateDistance } from './distance';

/**
 * EINFACHSTES MATCHING - NUR DAS NÖTIGSTE
 * 
 * REGEL 1: Job ist offen
 * REGEL 2: Kategorie passt
 * FERTIG!
 */
export function simpleMatch(job: Job, worker: WorkerProfile): boolean {
  // Sicherheitscheck: Daten existieren
  if (!job || !worker) {
    console.log('❌ Job oder Worker fehlt');
    return false;
  }

  // REGEL 1: Job muss offen sein
  if (job.status !== 'open' && job.status !== 'pending') {
    console.log(`❌ Job "${job.title}" ist nicht offen (Status: ${job.status})`);
    return false;
  }

  // REGEL 2: Job darf noch nicht matched sein
  if (job.matchedWorkerId) {
    console.log(`❌ Job "${job.title}" hat bereits einen Worker`);
    return false;
  }

  // REGEL 3: Distanz-Check (WICHTIG!)
  if (worker.homeLat && worker.homeLon && job.lat && job.lon) {
    const distance = calculateDistance(
      { lat: job.lat, lon: job.lon },
      { lat: worker.homeLat, lon: worker.homeLon }
    );
    
    if (distance > worker.radiusKm) {
      console.log(`❌ Job "${job.title}" ist ${distance.toFixed(1)} km entfernt (Radius: ${worker.radiusKm} km)`);
      return false;
    }
  }

  // REGEL 4: Kategorie-Match
  const jobCategory = job.category || '';
  const workerCategories = worker.categories || [];

  if (workerCategories.length === 0) {
    console.log(`⚠️ Worker hat keine Kategorien - KEIN MATCH für "${job.title}"`);
    return false;
  }

  const categoryMatches = workerCategories.includes(jobCategory);
  
  if (!categoryMatches) {
    console.log(`❌ Kategorie "${jobCategory}" nicht in Worker-Kategorien [${workerCategories.join(', ')}]`);
    return false;
  }

  // MATCH! 🎉
  console.log(`✅ JOB MATCHED! "${job.title}" (${jobCategory}) passt zu Worker mit [${workerCategories.join(', ')}]`);
  return true;
}

/**
 * Filtert Jobs für einen Worker - SUPER EINFACH
 */
export function getMatchingJobs(allJobs: Job[], worker: WorkerProfile): Job[] {
  console.log('\n🔍 === SIMPLE MATCHING START ===');
  console.log(`📊 Prüfe ${allJobs.length} Jobs`);
  console.log(`👤 Worker-Kategorien: [${worker.categories?.join(', ') || 'KEINE'}]`);
  
  const matches: Job[] = [];
  
  for (const job of allJobs) {
    const matched = simpleMatch(job, worker);
    if (matched) {
      matches.push(job);
    }
  }
  
  console.log(`\n✅ ERGEBNIS: ${matches.length} von ${allJobs.length} Jobs matchen`);
  console.log('🔍 === SIMPLE MATCHING END ===\n');
  
  return matches;
}

/**
 * Noch einfachere Version - NUR für Debugging
 * Zeigt JEDEN Schritt
 */
export function debugMatch(job: Job, worker: WorkerProfile): {
  matches: boolean;
  reason: string;
  details: any;
} {
  const result: any = {
    matches: false,
    reason: '',
    details: {}
  };

  // Check 1: Daten vorhanden?
  if (!job || !worker) {
    result.reason = 'Job oder Worker fehlt';
    result.details.jobExists = !!job;
    result.details.workerExists = !!worker;
    return result;
  }

  result.details.jobTitle = job.title;
  result.details.jobStatus = job.status;
  result.details.jobCategory = job.category;
  result.details.workerCategories = worker.categories || [];

  // Check 2: Job offen?
  if (job.status !== 'open' && job.status !== 'pending') {
    result.reason = `Job-Status ist "${job.status}" (nicht open/pending)`;
    return result;
  }

  // Check 3: Bereits matched?
  if (job.matchedWorkerId) {
    result.reason = 'Job hat bereits einen Worker';
    result.details.matchedWorkerId = job.matchedWorkerId;
    return result;
  }

  // Check 4: Kategorie-Match
  const workerCategories = worker.categories || [];
  const categoryMatches = workerCategories.includes(job.category || '');
  
  result.details.categoryCheck = {
    jobCategory: job.category,
    workerCategories: workerCategories,
    matches: categoryMatches
  };

  if (!categoryMatches) {
    result.reason = `Kategorie "${job.category}" nicht in [${workerCategories.join(', ')}]`;
    return result;
  }

  // MATCH!
  result.matches = true;
  result.reason = 'Alle Checks bestanden - MATCH!';
  return result;
}
