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
  console.log('➕ addApplication called', { jobId, workerId, employerId });
  
  const apps = await loadApplications();
  const existing = apps.find(a => a.jobId === jobId && a.workerId === workerId);
  if (existing) {
    console.log('📋 addApplication: Application already exists', { jobId, workerId, appId: existing.id });
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
  console.log('✅ addApplication: New application created', { appId: app.id, jobId, workerId, employerId });
  return app;
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  console.log('🔍 getApplicationsForJob called', { jobId });
  const apps = await loadApplications();
  const filtered = apps.filter(a => a.jobId === jobId);
  console.log('📋 getApplicationsForJob: Found', filtered.length, 'applications for job', jobId);
  return filtered;
}

export async function getApplicationsForWorker(workerId: string): Promise<JobApplication[]> {
  const apps = await loadApplications();
  return apps.filter(a => a.workerId === workerId);
}

export async function acceptApplication(
  jobId: string, 
  applicationId: string,
  employerConfirmedLegal: boolean = true
): Promise<void> {
  console.log('🎯 acceptApplication called', { jobId, applicationId, employerConfirmedLegal });
  
  const apps = await loadApplications();
  const acceptedApp = apps.find(app => app.id === applicationId);
  
  if (!acceptedApp) {
    console.error('❌ acceptApplication: Application not found', { applicationId });
    throw new Error('Application not found');
  }
  
  const next = apps.map(app => {
    if (app.jobId !== jobId) return app;
    if (app.id === applicationId) {
      const updated = { 
        ...app, 
        status: 'accepted' as ApplicationStatus,
        respondedAt: new Date().toISOString(),
        employerConfirmedLegal,
        workerConfirmedLegal: false,
      };
      console.log('✅ acceptApplication: Application accepted', updated);
      return updated;
    }
    if (app.status === 'pending') {
      console.log('❌ acceptApplication: Rejecting other pending application', app.id);
      return { ...app, status: 'rejected' as ApplicationStatus };
    }
    return app;
  });
  
  await saveApplications(next);
  console.log('💾 acceptApplication: All applications saved');
  
  // Send notification to worker (local notification for now)
  try {
    const { sendMatchNotification } = await import('./notifications');
    await sendMatchNotification('Job Match', 'Arbeitgeber');
    console.log('📬 acceptApplication: Match notification sent to worker');
  } catch (error) {
    console.error('⚠️ acceptApplication: Could not send notification', error);
  }
  
  // TODO: Send email notification (will be replaced by backend later)
  // await sendEmailNotification(workerEmail, jobTitle);
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

// Set employer legal confirmation for a match
export async function setEmployerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  const apps = await loadApplications();
  const next = apps.map(app => 
    app.id === applicationId 
      ? { ...app, employerConfirmedLegal: confirmed } 
      : app
  );
  await saveApplications(next);
  console.log('✅ Employer legal confirmation set:', { applicationId, confirmed });
}

// Set worker legal confirmation for a match
export async function setWorkerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  const apps = await loadApplications();
  const next = apps.map(app => 
    app.id === applicationId 
      ? { ...app, workerConfirmedLegal: confirmed } 
      : app
  );
  await saveApplications(next);
  console.log('✅ Worker legal confirmation set:', { applicationId, confirmed });
}

// Get a single application by ID
export async function getApplicationById(applicationId: string): Promise<JobApplication | null> {
  const apps = await loadApplications();
  return apps.find(app => app.id === applicationId) || null;
}
