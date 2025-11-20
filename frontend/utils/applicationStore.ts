import { getItem, setItem } from './storage';
import { JobApplication, ApplicationStatus } from '../types/application';

const APPLICATIONS_KEY = '@shiftmatch:applications';

async function loadApplications(): Promise<JobApplication[]> {
  const stored = await getItem<JobApplication[]>(APPLICATIONS_KEY);
  return stored ?? [];
}

async function saveApplications(apps: JobApplication[]): Promise<void> {
  await setItem<JobApplication[]>(APPLICATIONS_KEY, apps);
}

export async function addApplication(
  jobId: string, 
  workerId: string,
  employerId: string
): Promise<JobApplication> {
  const apps = await loadApplications();
  const existing = apps.find(a => a.jobId === jobId && a.workerId === workerId);
  if (existing) {
    console.log('📋 Application already exists', { jobId, workerId, appId: existing.id });
    return existing;
  }

  const app: JobApplication = {
    id: 'app-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2),
    jobId,
    workerId,
    employerId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  const next = [...apps, app];
  await saveApplications(next);
  console.log('✅ New application created', { appId: app.id, jobId, workerId, employerId });
  return app;
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  const apps = await loadApplications();
  return apps.filter(a => a.jobId === jobId);
}

export async function getApplicationsForWorker(workerId: string): Promise<JobApplication[]> {
  const apps = await loadApplications();
  return apps.filter(a => a.workerId === workerId);
}

export async function acceptApplication(jobId: string, applicationId: string): Promise<void> {
  const apps = await loadApplications();
  const next = apps.map(app => {
    if (app.jobId !== jobId) return app;
    if (app.id === applicationId) {
      return { ...app, status: 'accepted' as ApplicationStatus };
    }
    if (app.status === 'pending') {
      return { ...app, status: 'rejected' as ApplicationStatus };
    }
    return app;
  });
  await saveApplications(next);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  const apps = await loadApplications();
  const next = apps.map(app => (app.id === id ? { ...app, status } : app));
  await saveApplications(next);
}

// Alias für addApplication mit erweiterten Logs
export async function applyForJob(
  jobId: string,
  workerId: string,
  employerId: string,
): Promise<JobApplication> {
  try {
    console.log('🔍 applyForJob called', { jobId, workerId, employerId });

    if (!employerId) {
      console.log('❌ applyForJob: employerId fehlt beim Bewerben');
      throw new Error('employerId fehlt beim Bewerben.');
    }

    const result = await addApplication(jobId, workerId, employerId);
    console.log('✅ applyForJob: success', result);
    return result;
  } catch (e) {
    console.log('❌ applyForJob: ERROR', e);
    throw e;
  }
}
