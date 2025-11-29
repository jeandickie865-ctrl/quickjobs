// utils/applicationStore.ts - Application Store (REFACTORED)
import { JobApplication, ApplicationStatus } from '../types/application';
import { API_BASE, getUserId, getAuthHeaders } from './api';

// ===== ADD APPLICATION =====
export async function addApplication(
  jobId: string
): Promise<JobApplication> {
  console.log('➕ addApplication: Creating application for jobId:', jobId);
  console.log('➕ jobId type:', typeof jobId);
  console.log('➕ jobId is undefined?', jobId === undefined);
  
  // workerId is set from token by backend
  // employerId is set from job by backend
  
  try {
    const headers = await getAuthHeaders();
    const body = JSON.stringify({ jobId });
    
    console.log('➕ Request body:', body);
    console.log('➕ Request headers:', headers);
    console.log('➕ API_BASE:', API_BASE);
    
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers,
      body,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addApplication: Failed', response.status, error);
      console.error('❌ Request was:', JSON.stringify({ jobId }));
      console.error('❌ Headers were:', headers);
      throw new Error(`Failed to create application: ${response.status} - ${error}`);
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
export async function getWorkerApplications(): Promise<JobApplication[]> {
  console.log('📥 getWorkerApplications: Getting applications (from token)');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/worker/me`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getWorkerApplications: Failed', response.status, error);
      throw new Error(`Failed to fetch worker applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log('✅ getWorkerApplications: Applications fetched', applications.length);
    return applications;
  } catch (error) {
    console.error('❌ getWorkerApplications: Error', error);
    throw error;
  }
}

// ===== GET APPLICATIONS FOR EMPLOYER =====
export async function getApplicationsForEmployer(): Promise<JobApplication[]> {
  console.log('📥 getApplicationsForEmployer: Getting applications (from token)');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/applications/employer/me`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForEmployer: Failed', response.status, error);
      throw new Error(`Failed to fetch employer applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log('✅ getApplicationsForEmployer: Applications fetched', applications.length);
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
): Promise<JobApplication> {
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
    
    const application = await response.json();
    console.log('✅ acceptApplication: Application accepted', application);
    return application;
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

// ===== APPLY FOR JOB (CORRECTED) =====
export async function applyForJob(
  jobId: string
): Promise<JobApplication> {
  console.log('🔍 applyForJob: Applying for job', { jobId });

  // WICHTIG: workerId NICHT mitschicken!
  // Backend setzt workerId aus dem Token automatisch.
  // Backend setzt employerId aus dem Job automatisch.
  return await addApplication(jobId);
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
