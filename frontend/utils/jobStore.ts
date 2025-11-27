// utils/jobStore.ts - Job Store (REFACTORED)
import { Job } from '../types/job';
import { API_BASE, getUserId, getAuthHeaders } from './api';
import { API_URL } from "../config";

// ===== GET MATCHED JOBS FOR CURRENT WORKER =====
export async function getMatchedJobs(): Promise<Job[]> {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${API_URL}/jobs/matches/me`, {
      method: "GET",
      headers,
    });

    if (res.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      throw new Error("Failed to fetch matched jobs");
    }

    const data = await res.json();

    const mappedJobs: Job[] = data.map((job: any) => ({
      ...job,
      required_all_tags: job.required_all_tags ?? job.tags ?? [],
      required_any_tags: job.required_any_tags ?? []
    }));

    return mappedJobs;
  } catch (error) {
    console.error('❌ getMatchedJobs: Error', error);
    throw error;
  }
}

// ===== ADD JOB =====
export async function addJob(jobCreate: any): Promise<void> {
  console.log('➕ addJob: Creating job', jobCreate.title);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(jobCreate),  // Send JobCreate, not Job
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addJob: Failed', response.status, error);
      throw new Error(`Failed to create job: ${response.status}`);
    }
    
    const createdJob = await response.json();
    console.log('✅ addJob: Job created', createdJob.id);
  } catch (error) {
    console.error('❌ addJob: Error', error);
    throw error;
  }
}

// ===== GET ALL JOBS (including completed) =====
export async function getJobs(): Promise<Job[]> {
  console.log('🔍 getJobs: Fetching ALL jobs (including completed)');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/all`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      console.error('❌ getJobs: Failed', response.status);
      return [];
    }
    
    const jobs: Job[] = await response.json();
    console.log('✅ getJobs: Fetched', jobs.length, 'jobs');
    return jobs;
  } catch (error) {
    console.error('❌ getJobs: Error', error);
    return [];
  }
}

// ===== GET OPEN JOBS =====
export async function getOpenJobs(): Promise<Job[]> {
  console.log('🔍 getOpenJobs: Fetching open jobs');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getOpenJobs: Failed', response.status, error);
      throw new Error(`Failed to fetch open jobs: ${response.status}`);
    }
    
    const jobs = await response.json();
    console.log('✅ getOpenJobs: Found', jobs.length, 'open jobs');
    return jobs;
  } catch (error) {
    console.error('❌ getOpenJobs: Error', error);
    throw error;
  }
}

// ===== GET EMPLOYER JOBS =====
export async function getEmployerJobs(employerId: string): Promise<Job[]> {
  console.log('📋 getEmployerJobs: Fetching jobs for employer', employerId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/employer/${employerId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getEmployerJobs: Failed', response.status, error);
      throw new Error(`Failed to fetch employer jobs: ${response.status}`);
    }
    
    const jobs = await response.json();
    console.log('✅ getEmployerJobs: Found', jobs.length, 'jobs');
    return jobs;
  } catch (error) {
    console.error('❌ getEmployerJobs: Error', error);
    throw error;
  }
}

// ===== GET JOB BY ID =====
export async function getJobById(id: string): Promise<Job | null> {
  console.log('🔍 getJobById: Fetching job', id);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      console.log('⚠️ getJobById: Job not found');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getJobById: Failed', response.status, error);
      throw new Error(`Failed to fetch job: ${response.status}`);
    }
    
    const job = await response.json();
    console.log('✅ getJobById: Job found', id);
    return job;
  } catch (error) {
    console.error('❌ getJobById: Error', error);
    throw error;
  }
}

// ===== UPDATE JOB =====
export async function updateJob(id: string, patch: Partial<Job>): Promise<void> {
  console.log('🔄 updateJob: Updating job', id);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(patch),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ updateJob: Failed', response.status, error);
      throw new Error(`Failed to update job: ${response.status}`);
    }
    
    console.log('✅ updateJob: Job updated', id);
  } catch (error) {
    console.error('❌ updateJob: Error', error);
    throw error;
  }
}

// ===== DELETE JOB =====
export async function deleteJob(id: string): Promise<void> {
  console.log('🗑️ deleteJob: Deleting job', id);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ deleteJob: Failed', response.status, error);
      throw new Error(`Failed to delete job: ${response.status}`);
    }
    
    console.log('✅ deleteJob: Job deleted', id);
  } catch (error) {
    console.error('❌ deleteJob: Error', error);
    throw error;
  }
}

// ===== LEGACY ALIASES =====
export async function getAllJobs(): Promise<Job[]> {
  return await getJobs();
}

export async function saveJob(job: Job): Promise<void> {
  try {
    const existing = await getJobById(job.id);
    if (existing) {
      await updateJob(job.id, job);
    } else {
      await addJob(job);
    }
  } catch {
    await addJob(job);
  }
}

export async function clearJobs(): Promise<void> {
  console.warn('⚠️ clearJobs: Not implemented for API-based storage');
}
