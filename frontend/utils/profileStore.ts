// utils/profileStore.ts - Worker Profile Store (REFACTORED)
import { WorkerProfile } from '../types/profile';
import { API_BASE, getUserId, getAuthHeaders } from './api';

// ===== GET WORKER PROFILE =====
export async function getWorkerProfile(userId?: string): Promise<WorkerProfile | null> {
  // If no userId provided, get it from auth
  if (!userId) {
    userId = await getUserId();
    if (!userId) {
      console.error('❌ getWorkerProfile: No userId provided and not authenticated');
      throw new Error('Not authenticated');
    }
  }
  
  console.log('🔍 getWorkerProfile: Loading profile for user', userId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/profiles/worker/${userId}`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      console.log('⚠️ getWorkerProfile: Profile not found (404)');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getWorkerProfile: API error', response.status, error);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('✅ getWorkerProfile: Profile loaded', {
      userId: profile.userId,
      categories: profile.categories?.length || 0,
      tags: profile.selectedTags?.length || 0,
    });
    
    return profile;
  } catch (error) {
    console.error('❌ getWorkerProfile: Error', error);
    throw error;
  }
}

// ===== SAVE WORKER PROFILE =====
export async function saveWorkerProfile(
  userId: string, 
  profileData: Partial<WorkerProfile>
): Promise<void> {
  console.log('💾 saveWorkerProfile: Saving profile for', userId);
  console.log('💾 saveWorkerProfile: Data:', profileData);
  
  try {
    // 1. Bestehendes Profil laden
    const existing = await getWorkerProfile(userId);
    
    // 2. Vollständiges Profil-Objekt erstellen
    const merged = existing ? { ...existing, ...profileData } : profileData;
    
    const headers = await getAuthHeaders();
    
    // 3. merged statt profileData senden
    // Try PUT first (update existing)
    let response = await fetch(`${API_BASE}/profiles/worker/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(merged),
    });
    
    console.log('📥 saveWorkerProfile: PUT response status:', response.status);
    
    // If 404, profile doesn't exist - create with POST
    if (response.status === 404) {
      console.log('⚠️ saveWorkerProfile: Profile not found, creating new via POST');
      
      response = await fetch(`${API_BASE}/profiles/worker`, {
        method: 'POST',
        headers,
        body: JSON.stringify(merged),
      });
      
      console.log('📥 saveWorkerProfile: POST response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ saveWorkerProfile: Backend error:', errorText);
      throw new Error(`Server Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ saveWorkerProfile: Profile saved successfully', result);
  } catch (error: any) {
    console.error('❌ saveWorkerProfile: Exception:', error.message);
    throw error;
  }
}

export type { WorkerProfile };
