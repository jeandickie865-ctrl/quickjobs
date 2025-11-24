import { getItem, setItem, removeItem } from './storage';
import { Job } from '../types/job';

const JOBS_KEY = '@shiftmatch:jobs';

// Internal helper: Load all jobs from storage
async function loadJobs(): Promise<Job[]> {
  const stored = await getItem<Job[]>(JOBS_KEY);
  return stored ?? [];
}

// Internal helper: Save all jobs to storage
async function saveJobsInternal(jobs: Job[]): Promise<void> {
  await setItem<Job[]>(JOBS_KEY, jobs);
}

export async function addJob(job: Job): Promise<void> {
  const jobs = await loadJobs();
  await saveJobsInternal([...jobs, job]);
}

export async function getJobs(): Promise<Job[]> {
  return await loadJobs();
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<void> {
  const jobs = await loadJobs();
  const next = jobs.map(j => (j.id === id ? { ...j, ...patch } : j));
  await saveJobsInternal(next);
}

export async function clearJobs(): Promise<void> {
  await removeItem(JOBS_KEY);
}

// Legacy/convenience functions
export async function getAllJobs(): Promise<Job[]> {
  return await getJobs();
}

export async function saveJob(job: Job): Promise<void> {
  const all = await loadJobs();
  const existing = all.findIndex(j => j.id === job.id);
  if (existing >= 0) {
    await updateJob(job.id, job);
  } else {
    await addJob(job);
  }
}

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const all = await loadJobs();
  let needsSave = false;

  // Migration: Fix jobs without employerId
  const fixed = all.map(job => {
    // Check if job has no employerId or employerId is undefined
    if (!job.employerId || job.employerId === 'undefined') {
      // Check if there's an old ownerId field
      const legacyOwnerId = (job as any).ownerId;
      
      if (legacyOwnerId) {
        console.log(`🔧 Migrating job ${job.id}: ownerId → employerId`);
        job.employerId = legacyOwnerId;
        needsSave = true;
      } else if (job.status === 'open' || job.status === 'draft') {
        // For open/draft jobs without any owner info, assign to current employer
        console.log(`🔧 Assigning job ${job.id} to employer ${employerId}`);
        job.employerId = employerId;
        needsSave = true;
      }
    }
    return job;
  });

  // Save back if we made changes
  if (needsSave) {
    console.log('💾 Saving migrated jobs to storage');
    await saveJobsInternal(fixed);
  }

  // Filter jobs for this employer
  const mine = fixed.filter(j => j.employerId === employerId);
  console.log(`📋 getEmployerJobs: Found ${mine.length} jobs for employer ${employerId}`);
  
  return mine;
}

export async function getOpenJobs(): Promise<Job[]> {
  const all = await loadJobs();
  return all.filter(j => j.status === 'open');
}

export async function getJobById(id: string): Promise<Job | null> {
  const all = await loadJobs();
  return all.find(j => j.id === id) || null;
}

export async function deleteJob(id: string): Promise<void> {
  const jobs = await loadJobs();
  const next = jobs.filter(j => j.id !== id);
  await saveJobsInternal(next);
}

// COMPATIBILITY ALIASES - For backwards compatibility
// (in case old code or sed replacements created these function calls)
export async function getEmployerAufträge(employerId: string): Promise<Job[]> {
  console.warn('⚠️ Deprecated: getEmployerAufträge() is deprecated. Use getEmployerJobs() instead.');
  return await getEmployerJobs(employerId);
}

export async function getEmployerAuftraege(employerId: string): Promise<Job[]> {
  console.warn('⚠️ Deprecated: getEmployerAuftraege() is deprecated. Use getEmployerJobs() instead.');
  return await getEmployerJobs(employerId);
}

