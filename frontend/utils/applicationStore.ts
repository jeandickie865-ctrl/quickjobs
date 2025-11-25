// utils/applicationStore.ts - API-based application management (MongoDB)
import { JobApplication, ApplicationStatus } from '../types/application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://jobmatcher-de.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = '@shiftmatch:token';

// Helper: Get auth token from AsyncStorage
async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated - no token found');
  }
  return token;
}

// Helper: Get userId from AsyncStorage
async function getUserId(): Promise<string> {
  const userJson = await AsyncStorage.getItem('@shiftmatch:user');
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  return user.id;
}

export async function addApplication(
  jobId: string,
  workerId: string,
  employerId: string
): Promise<JobApplication> {
  console.log('➕ addApplication (API): Creating application', { jobId, workerId, employerId });
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        workerId,
        employerId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addApplication (API): Failed', response.status, error);
      throw new Error(`Failed to create application: ${response.status}`);
    }
    
    const application = await response.json();
    console.log('✅ addApplication (API): Application created', application.id);
    
    return application;
  } catch (error) {
    console.error('❌ addApplication (API): Error', error);
    throw error;
  }
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  console.log('🔍 getApplicationsForJob (API): Fetching applications for job', jobId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/job/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForJob (API): Failed', response.status, error);
      throw new Error(`Failed to fetch applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log(`✅ getApplicationsForJob (API): Found ${applications.length} applications for job ${jobId}`);
    
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForJob (API): Error', error);
    throw error;
  }
}

export async function getApplicationsForWorker(workerId: string): Promise<JobApplication[]> {
  console.log('🔍 getApplicationsForWorker (API): Fetching applications for worker', workerId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/worker/${workerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForWorker (API): Failed', response.status, error);
      throw new Error(`Failed to fetch worker applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log(`✅ getApplicationsForWorker (API): Found ${applications.length} applications for worker ${workerId}`);
    
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForWorker (API): Error', error);
    throw error;
  }
}

export async function acceptApplication(
  applicationId: string,
  employerConfirmedLegal: boolean = true
): Promise<void> {
  console.log('🎯 acceptApplication (API): Accepting application', applicationId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}/accept?employer_confirmed_legal=${employerConfirmedLegal}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ acceptApplication (API): Failed', response.status, error);
      throw new Error(`Failed to accept application: ${response.status}`);
    }
    
    console.log('✅ acceptApplication (API): Application accepted', applicationId);
    
    // Note: Notification handling would be done on the backend or via push notifications
  } catch (error) {
    console.error('❌ acceptApplication (API): Error', error);
    throw error;
  }
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  console.log('🔄 updateApplicationStatus (API): Updating status', { id, status });
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ updateApplicationStatus (API): Failed', response.status, error);
      throw new Error(`Failed to update application status: ${response.status}`);
    }
    
    console.log('✅ updateApplicationStatus (API): Status updated', { id, status });
  } catch (error) {
    console.error('❌ updateApplicationStatus (API): Error', error);
    throw error;
  }
}

// Alias für addApplication mit erweiterten Logs
export async function applyForJob(
  jobId: string,
  workerId: string,
  employerId: string
): Promise<JobApplication> {
  console.log('🔍 applyForJob (API): Applying for job', { jobId, workerId, employerId });
  
  if (!employerId) {
    console.error('❌ applyForJob (API): employerId missing');
    throw new Error('employerId fehlt beim Bewerben.');
  }
  
  return await addApplication(jobId, workerId, employerId);
}

// Set employer legal confirmation for a match
export async function setEmployerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  console.log('✅ setEmployerLegalConfirmation (API):', { applicationId, confirmed });
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employerConfirmedLegal: confirmed }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ setEmployerLegalConfirmation (API): Failed', response.status, error);
      throw new Error(`Failed to set employer legal confirmation: ${response.status}`);
    }
    
    console.log('✅ Employer legal confirmation set');
  } catch (error) {
    console.error('❌ setEmployerLegalConfirmation (API): Error', error);
    throw error;
  }
}

// Set worker legal confirmation for a match
export async function setWorkerLegalConfirmation(applicationId: string, confirmed: boolean): Promise<void> {
  console.log('✅ setWorkerLegalConfirmation (API):', { applicationId, confirmed });
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workerConfirmedLegal: confirmed }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ setWorkerLegalConfirmation (API): Failed', response.status, error);
      throw new Error(`Failed to set worker legal confirmation: ${response.status}`);
    }
    
    console.log('✅ Worker legal confirmation set');
  } catch (error) {
    console.error('❌ setWorkerLegalConfirmation (API): Error', error);
    throw error;
  }
}

// Get a single application by ID
export async function getApplicationById(applicationId: string): Promise<JobApplication | null> {
  console.log('🔍 getApplicationById (API): Fetching application', applicationId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      console.log('⚠️ getApplicationById (API): Application not found');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationById (API): Failed', response.status, error);
      throw new Error(`Failed to fetch application: ${response.status}`);
    }
    
    const application = await response.json();
    console.log('✅ getApplicationById (API): Application found', applicationId);
    
    return application;
  } catch (error) {
    console.error('❌ getApplicationById (API): Error', error);
    throw error;
  }
}

// Get all applications for a specific employer
export async function getApplicationsForEmployer(employerId: string): Promise<JobApplication[]> {
  console.log('📋 getApplicationsForEmployer (API): Fetching applications for employer', employerId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/applications/employer/${employerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getApplicationsForEmployer (API): Failed', response.status, error);
      throw new Error(`Failed to fetch employer applications: ${response.status}`);
    }
    
    const applications = await response.json();
    console.log(`✅ getApplicationsForEmployer (API): Found ${applications.length} applications for employer ${employerId}`);
    
    return applications;
  } catch (error) {
    console.error('❌ getApplicationsForEmployer (API): Error', error);
    throw error;
  }
}
