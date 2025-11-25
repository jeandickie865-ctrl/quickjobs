// utils/jobStore.ts - API-based job management (MongoDB)
import { Job } from '../types/job';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://workermatch-debug.preview.emergentagent.com';
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
  console.log('🔍 [jobStore] Getting userId from AsyncStorage...');
  const userJson = await AsyncStorage.getItem('@shiftmatch:user');
  console.log('🔍 [jobStore] User JSON from AsyncStorage:', userJson);
  if (!userJson) {
    console.error('❌ [jobStore] No user found in AsyncStorage!');
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  console.log('🔍 [jobStore] Parsed user:', user);
  console.log('🔍 [jobStore] User ID:', user.id);
  return user.id;
}

export async function addJob(job: Job): Promise<void> {
  console.log('➕ addJob (API): Creating job', job.title);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addJob (API): Failed', response.status, error);
      throw new Error(`Failed to create job: ${response.status}`);
    }
    
    const createdJob = await response.json();
    console.log('✅ addJob (API): Job created', createdJob.id);
  } catch (error) {
    console.error('❌ addJob (API): Error', error);
    throw error;
  }
}

export async function getJobs(): Promise<Job[]> {
  console.log('🔍 getJobs (API): Fetching all jobs');
  return await getOpenJobs();
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<void> {
  console.log('🔄 updateJob (API): Updating job', id);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ updateJob (API): Failed', response.status, error);
      throw new Error(`Failed to update job: ${response.status}`);
    }
    
    console.log('✅ updateJob (API): Job updated', id);
  } catch (error) {
    console.error('❌ updateJob (API): Error', error);
    throw error;
  }
}

export async function clearJobs(): Promise<void> {
  console.warn('⚠️ clearJobs (API): Not implemented - jobs are stored in MongoDB');
  // This function is not meaningful with API-based storage
  // Jobs should be deleted individually via deleteJob()
}

// Legacy/convenience functions
export async function getAllJobs(): Promise<Job[]> {
  return await getJobs();
}

export async function saveJob(job: Job): Promise<void> {
  console.log('💾 saveJob (API): Saving job', job.id);
  
  try {
    // Check if job exists by trying to fetch it
    const existing = await getJobById(job.id);
    
    if (existing) {
      // Update existing job
      await updateJob(job.id, job);
    } else {
      // Create new job
      await addJob(job);
    }
  } catch (error) {
    // If fetch fails with 404, create new job
    await addJob(job);
  }
}

export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  console.log('📋 getEmployerJobs (API): Fetching jobs for employer', employerId);
  
  try {
    const userId = await getUserId();
    console.log('🔐 getEmployerJobs: userId from AsyncStorage:', userId);
    console.log('🎯 getEmployerJobs: employerId from parameter:', employerId);
    console.log('✅ getEmployerJobs: IDs match:', userId === employerId);
    
    const response = await fetch(`${API_BASE}/jobs/employer/${employerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 getEmployerJobs: Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getEmployerJobs (API): Failed', response.status, error);
      console.error('❌ getEmployerJobs: Full error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: error,
        userId,
        employerId
      });
      throw new Error(`Failed to fetch employer jobs: ${response.status}`);
    }
    
    const jobs = await response.json();
    console.log(`✅ getEmployerJobs (API): Found ${jobs.length} jobs for employer ${employerId}`);
    
    return jobs;
  } catch (error) {
    console.error('❌ getEmployerJobs (API): Error', error);
    throw error;
  }
}

export async function getOpenJobs(): Promise<Job[]> {
  console.log('🔍 getOpenJobs (API): Fetching all open jobs');
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getOpenJobs (API): Failed', response.status, error);
      throw new Error(`Failed to fetch open jobs: ${response.status}`);
    }
    
    const jobs = await response.json();
    console.log(`✅ getOpenJobs (API): Found ${jobs.length} open jobs`);
    
    return jobs;
  } catch (error) {
    console.error('❌ getOpenJobs (API): Error', error);
    throw error;
  }
}

export async function getJobById(id: string): Promise<Job | null> {
  console.log('🔍 getJobById (API): Fetching job', id);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      console.log('⚠️ getJobById (API): Job not found');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getJobById (API): Failed', response.status, error);
      throw new Error(`Failed to fetch job: ${response.status}`);
    }
    
    const job = await response.json();
    console.log('✅ getJobById (API): Job found', id);
    
    return job;
  } catch (error) {
    console.error('❌ getJobById (API): Error', error);
    throw error;
  }
}

export async function deleteJob(id: string): Promise<void> {
  console.log('🗑️ deleteJob (API): Deleting job', id);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ deleteJob (API): Failed', response.status, error);
      throw new Error(`Failed to delete job: ${response.status}`);
    }
    
    console.log('✅ deleteJob (API): Job deleted', id);
  } catch (error) {
    console.error('❌ deleteJob (API): Error', error);
    throw error;
  }
}

// COMPATIBILITY ALIASES - For backwards compatibility
export async function getEmployerAufträge(employerId: string): Promise<Job[]> {
  console.warn('⚠️ Deprecated: getEmployerAufträge() is deprecated. Use getEmployerJobs() instead.');
  return await getEmployerJobs(employerId);
}

export async function getEmployerAuftraege(employerId: string): Promise<Job[]> {
  console.warn('⚠️ Deprecated: getEmployerAuftraege() is deprecated. Use getEmployerJobs() instead.');
  return await getEmployerJobs(employerId);
}

