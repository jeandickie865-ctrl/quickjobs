// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API base URL from environment
const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

/**
 * Get auth token from AsyncStorage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('@backup:token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// APPLICATIONS API
// ============================================

export interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: 'applied' | 'selected' | 'pending_payment' | 'active';
  created_at: string;
}

/**
 * Worker bewirbt sich auf einen Job
 */
export async function applyForJob(jobId: string): Promise<Application> {
  return apiRequest<Application>('/api/applications', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

/**
 * Worker lädt eigene Bewerbungen
 */
export async function getMyApplications(): Promise<Application[]> {
  return apiRequest<Application[]>('/api/applications/me');
}

/**
 * Employer lädt Bewerbungen für einen Job
 */
export async function getApplicationsForJob(jobId: string): Promise<Application[]> {
  return apiRequest<Application[]>(`/api/applications/job/${jobId}`);
}

// ============================================
// MATCHES API
// ============================================

export interface SelectWorkerResponse {
  status: string;
  application_id: string;
}

/**
 * Employer wählt einen Worker aus
 */
export async function selectWorker(applicationId: string): Promise<SelectWorkerResponse> {
  return apiRequest<SelectWorkerResponse>(`/api/matches/select/${applicationId}`, {
    method: 'POST',
  });
}

// ============================================
// JOBS API
// ============================================

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  categories: string[];
  qualifications: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<Job> {
  return apiRequest<Job>(`/api/jobs/${jobId}`);
}

// ============================================
// PROFILES API
// ============================================

export interface WorkerProfile {
  id: string;
  user_id: string;
  name: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  categories: string[];
  qualifications: string[];
  activities: string[];
  radius_km: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Worker Profile laden
 */
export async function getWorkerProfile(): Promise<WorkerProfile> {
  return apiRequest<WorkerProfile>('/api/profiles/worker/me');
}

/**
 * Worker Profile aktualisieren
 */
export async function updateWorkerProfile(data: Partial<WorkerProfile>): Promise<WorkerProfile> {
  return apiRequest<WorkerProfile>('/api/profiles/worker/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============================================
// UPLOAD API
// ============================================

export interface PhotoUploadResponse {
  photo_url: string;
  message: string;
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(uri: string): Promise<PhotoUploadResponse> {
  const token = await getAuthToken();
  
  // Create form data
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';
  
  // @ts-ignore - React Native FormData accepts this format
  formData.append('file', {
    uri,
    name: filename,
    type: 'image/jpeg',
  });
  
  const url = `${API_BASE_URL}/api/upload/profile-photo`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
}
