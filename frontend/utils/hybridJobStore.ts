// utils/hybridJobStore.ts
// HYBRID-SYSTEM: Versucht Backend, fallback zu AsyncStorage
// Diese Datei ist NEU und ändert nichts an den bestehenden Stores!

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../types/job';

// Backend API URL
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const JOBS_KEY = '@shiftmatch:jobs';
const TOKEN_KEY = '@shiftmatch:token';

// ============================================
// HELPER: Get Auth Token
// ============================================

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log('⚠️ Could not get auth token:', error);
    return null;
  }
}

// ============================================
// HELPER: Backend API Call mit Fehlerbehandlung & AUTH
// ============================================

async function callBackendAPI(endpoint: string, options: RequestInit = {}) {
  try {
    // Hole Auth-Token
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Füge Token hinzu, falls vorhanden
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      // Timeout nach 5 Sekunden
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('⚠️ Backend nicht erreichbar:', error);
    return null;
  }
}

// ============================================
// HYBRID: Get All Jobs
// ============================================

export async function getJobsHybrid(): Promise<Job[]> {
  console.log('🔄 HYBRID: Loading jobs...');

  // 1. Versuche Backend
  const backendJobs = await callBackendAPI('/api/jobs');
  
  if (backendJobs && Array.isArray(backendJobs)) {
    console.log('✅ HYBRID: Loaded', backendJobs.length, 'jobs from BACKEND');
    
    // Speichere auch in AsyncStorage als Cache
    try {
      await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(backendJobs));
      console.log('💾 HYBRID: Cached to AsyncStorage');
    } catch (e) {
      console.log('⚠️ HYBRID: Could not cache to AsyncStorage');
    }
    
    return backendJobs;
  }

  // 2. Fallback zu AsyncStorage
  console.log('📱 HYBRID: Backend nicht verfügbar, nutze AsyncStorage');
  try {
    const stored = await AsyncStorage.getItem(JOBS_KEY);
    const jobs = stored ? JSON.parse(stored) : [];
    console.log('✅ HYBRID: Loaded', jobs.length, 'jobs from AsyncStorage');
    return jobs;
  } catch (e) {
    console.log('❌ HYBRID: Fehler beim Laden aus AsyncStorage:', e);
    return [];
  }
}

// ============================================
// HYBRID: Get Job by ID
// ============================================

export async function getJobByIdHybrid(id: string): Promise<Job | null> {
  console.log('🔄 HYBRID: Loading job', id);

  // 1. Versuche Backend
  const backendJob = await callBackendAPI(`/api/jobs/${id}`);
  
  if (backendJob) {
    console.log('✅ HYBRID: Loaded job from BACKEND');
    return backendJob;
  }

  // 2. Fallback zu AsyncStorage
  console.log('📱 HYBRID: Backend nicht verfügbar, nutze AsyncStorage');
  try {
    const jobs = await getJobsHybrid();
    const job = jobs.find(j => j.id === id);
    return job || null;
  } catch (e) {
    console.log('❌ HYBRID: Fehler:', e);
    return null;
  }
}

// ============================================
// HYBRID: Save Job
// ============================================

export async function saveJobHybrid(job: Job): Promise<void> {
  console.log('🔄 HYBRID: Saving job', job.id);

  // 1. Versuche Backend
  const backendResult = await callBackendAPI('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(job),
  });

  if (backendResult) {
    console.log('✅ HYBRID: Saved to BACKEND');
  } else {
    console.log('⚠️ HYBRID: Backend save failed');
  }

  // 2. IMMER auch in AsyncStorage speichern (als Backup & für Offline)
  try {
    const jobs = await getJobsHybrid();
    const index = jobs.findIndex(j => j.id === job.id);
    
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    
    await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    console.log('✅ HYBRID: Saved to AsyncStorage');
  } catch (e) {
    console.log('❌ HYBRID: AsyncStorage save failed:', e);
    throw e;
  }
}

// ============================================
// HYBRID: Update Job
// ============================================

export async function updateJobHybrid(id: string, patch: Partial<Job>): Promise<void> {
  console.log('🔄 HYBRID: Updating job', id);

  // 1. Versuche Backend
  const backendResult = await callBackendAPI(`/api/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

  if (backendResult) {
    console.log('✅ HYBRID: Updated in BACKEND');
  } else {
    console.log('⚠️ HYBRID: Backend update failed');
  }

  // 2. IMMER auch in AsyncStorage aktualisieren
  try {
    const jobs = await getJobsHybrid();
    const index = jobs.findIndex(j => j.id === id);
    
    if (index >= 0) {
      jobs[index] = { ...jobs[index], ...patch };
      await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
      console.log('✅ HYBRID: Updated in AsyncStorage');
    }
  } catch (e) {
    console.log('❌ HYBRID: AsyncStorage update failed:', e);
    throw e;
  }
}

// ============================================
// EXPORT: Alte Funktionsnamen für Kompatibilität
// ============================================

export const getJobs = getJobsHybrid;
export const getJobById = getJobByIdHybrid;
export const saveJob = saveJobHybrid;
export const updateJob = updateJobHybrid;
