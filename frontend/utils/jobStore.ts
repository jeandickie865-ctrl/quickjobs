import { getItem, setItem } from './storage';
import { Job } from '../types/job';

const JOBS_KEY = 'shiftmatch_jobs';

export async function getAllJobs(): Promise<Job[]> {
  try {
    const jobs = await getItem<Job[]>(JOBS_KEY);
    return jobs || [];
  } catch {
    return [];
  }
}

export async function saveJob(job: Job): Promise<void> {
  const all = await getAllJobs();
  const existing = all.findIndex(j => j.id === job.id);
  if (existing >= 0) {
    all[existing] = job;
  } else {
    all.push(job);
  }
  await setItem(JOBS_KEY, all);
}

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  const all = await getAllJobs();
  return all.filter(j => j.employerId === employerId);
}

export async function getOpenJobs(): Promise<Job[]> {
  const all = await getAllJobs();
  return all.filter(j => j.status === 'open');
}

export async function getJobById(id: string): Promise<Job | null> {
  const all = await getAllJobs();
  return all.find(j => j.id === id) || null;
}
