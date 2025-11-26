// utils/applicationStore.ts - Application Store (REFACTORED)
import { JobApplication, ApplicationStatus } from '../types/application';
import { API_BASE, getUserId, getAuthHeaders } from './api';

// ===== ADD APPLICATION =====
export async function addApplication(
  jobId: string,
  employerId: string
): Promise<JobApplication> {
  console.log('➕ addApplication: Creating application', { jobId, employerId });
  // workerId is set from token by backend
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobId, employerId }),  // No workerId - backend sets it from token
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addApplication: Failed', response.status, error);
      throw new Error(`Failed to create application: ${response.status}`);
    }
    
    const application = await response.json();
    console.log('✅ addApplication: Application created', application.id);
    return application;
  } catch (error) {
    console.error('❌ addApplication: Error', error);
    throw error;
  }
}

// ===== GET APPLICATIONS FOR JOB =====
export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  console.log('🔍 getApplicationsForJob: Fetching applications for job', jobId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/job/${jobId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForJob: Failed', response.status, error);
      throw new Error(`Failed to fetch applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log('✅ getApplicationsForJob: Found', applications.length, 'applications');
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForJob: Error', error);
    throw error;
  }
}

// ===== GET APPLICATIONS FOR WORKER =====
export async function getApplicationsForWorker(workerId: string): Promise<JobApplication[]> {
  console.log('🔍 getApplicationsForWorker: Fetching applications for worker', workerId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/worker/${workerId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForWorker: Failed', response.status, error);
      throw new Error(`Failed to fetch worker applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log('✅ getApplicationsForWorker: Found', applications.length, 'applications');
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForWorker: Error', error);
    throw error;
  }
}

// ===== GET APPLICATIONS FOR EMPLOYER =====
export async function getApplicationsForEmployer(employerId: string): Promise<JobApplication[]> {
  console.log('📋 getApplicationsForEmployer: Fetching applications for employer', employerId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/employer/${employerId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForEmployer: Failed', response.status, error);
      throw new Error(`Failed to fetch employer applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log('✅ getApplicationsForEmployer: Found', applications.length, 'applications');
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForEmployer: Error', error);
    throw error;
  }
}

// ===== GET APPLICATION BY ID =====
export async function getApplicationById(applicationId: string): Promise<JobApplication | null> {
  console.log('🔍 getApplicationById: Fetching application', applicationId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      console.log('⚠️ getApplicationById: Application not found');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationById: Failed', response.status, error);
      throw new Error(`Failed to fetch application: ${response.status}`);
    }
    
    const application = await response.json();
    console.log('✅ getApplicationById: Application found');
    return application;
  } catch (error) {
    console.error('❌ getApplicationById: Error', error);
    throw error;
  }
}

// ===== ACCEPT APPLICATION =====
export async function acceptApplication(
  applicationId: string,
  employerConfirmedLegal: boolean = true
): Promise<void> {
  console.log('🎯 acceptApplication: Accepting application', applicationId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}/accept?employer_confirmed_legal=${employerConfirmedLegal}`, {
      method: 'PUT',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ acceptApplication: Failed', response.status, error);
      throw new Error(`Failed to accept application: ${response.status}`);
    }
    
    console.log('✅ acceptApplication: Application accepted');
  } catch (error) {
    console.error('❌ acceptApplication: Error', error);
    throw error;
  }
}

// ===== UPDATE APPLICATION STATUS =====
export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  console.log('🔄 updateApplicationStatus: Updating status', { id, status });
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ updateApplicationStatus: Failed', response.status, error);
      throw new Error(`Failed to update application status: ${response.status}`);
    }
    
    console.log('✅ updateApplicationStatus: Status updated');
  } catch (error) {
    console.error('❌ updateApplicationStatus: Error', error);
    throw error;
  }
}

// ===== APPLY FOR JOB (Alias) =====
export async function applyForJob(
  jobId: string,
  workerId: string,
  employerId: string
): Promise<JobApplication> {
  console.log('🔍 applyForJob: Applying for job', { jobId, workerId, employerId });
  
  if (!employerId) {
    console.error('❌ applyForJob: employerId missing');
    throw new Error('employerId fehlt beim Bewerben.');
  }
  
  return await addApplication(jobId, workerId, employerId);
}

// ===== SET EMPLOYER LEGAL CONFIRMATION =====
export async function setEmployerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  console.log('✅ setEmployerLegalConfirmation:', { applicationId, confirmed });
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ employerConfirmedLegal: confirmed }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ setEmployerLegalConfirmation: Failed', response.status, error);
      throw new Error(`Failed to set employer legal confirmation: ${response.status}`);
    }
    
    console.log('✅ Employer legal confirmation set');
  } catch (error) {
    console.error('❌ setEmployerLegalConfirmation: Error', error);
    throw error;
  }
}

// ===== SET WORKER LEGAL CONFIRMATION =====
export async function setWorkerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  console.log('✅ setWorkerLegalConfirmation:', { applicationId, confirmed });
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ workerConfirmedLegal: confirmed }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ setWorkerLegalConfirmation: Failed', response.status, error);
      throw new Error(`Failed to set worker legal confirmation: ${response.status}`);
    }
    
    console.log('✅ Worker legal confirmation set');
  } catch (error) {
    console.error('❌ setWorkerLegalConfirmation: Error', error);
    throw error;
  }
}
