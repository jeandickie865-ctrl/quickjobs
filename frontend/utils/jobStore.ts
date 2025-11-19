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
  return all.filter(j => j.employerId === employerId);
}

export async function getOpenJobs(): Promise<Job[]> {
  const all = await loadJobs();
  return all.filter(j => j.status === 'open');
}

export async function getJobById(id: string): Promise<Job | null> {
  const all = await loadJobs();
  return all.find(j => j.id === id) || null;
}
