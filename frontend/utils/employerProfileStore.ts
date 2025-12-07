// utils/employerProfileStore.ts - Employer Profile Store (REFACTORED)
import { EmployerProfile } from '../types/profile';
import { API_BASE, getUserId, getAuthHeaders } from './api';

// ===== GET EMPLOYER PROFILE (Own profile) =====
export async function getEmployerProfile(userId: string): Promise<EmployerProfile | null> {
  console.log('🔍 getEmployerProfile: Loading profile for user', userId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/profiles/employer/${userId}`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      console.log('⚠️ getEmployerProfile: Profile not found (404)');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getEmployerProfile: API error', response.status, error);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('✅ getEmployerProfile: Profile loaded');
    return profile;
  } catch (error) {
    console.error('❌ getEmployerProfile: Error', error);
    throw error;
  }
}

// ===== GET EMPLOYER PROFILE - PUBLIC VIEW (For workers) =====
export async function getEmployerProfilePublicView(userId: string): Promise<any | null> {
  console.log('🔍 getEmployerProfilePublicView: Loading public profile for user', userId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/profiles/employer/${userId}/public-view`, {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      console.log('⚠️ getEmployerProfilePublicView: Profile not found (404)');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getEmployerProfilePublicView: API error', response.status, error);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('✅ getEmployerProfilePublicView: Public profile loaded');
    return profile;
  } catch (error) {
    console.error('❌ getEmployerProfilePublicView: Error', error);
    throw error;
  }
}

// ===== SAVE EMPLOYER PROFILE =====
export async function saveEmployerProfile(
  userId: string,
  profileData: Partial<EmployerProfile>
): Promise<void> {
  console.log('💾 saveEmployerProfile: Saving profile for', userId);
  
  try {
    const headers = await getAuthHeaders();
    
    // Try PUT first (update existing)
    let response = await fetch(`${API_BASE}/profiles/employer/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    });
    
    console.log('📥 saveEmployerProfile: PUT response status:', response.status);
    
    // If 404, profile doesn't exist - create with POST
    if (response.status === 404) {
      console.log('⚠️ saveEmployerProfile: Profile not found, creating new via POST');
      
      response = await fetch(`${API_BASE}/profiles/employer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(profileData),
      });
      
      console.log('📥 saveEmployerProfile: POST response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ saveEmployerProfile: Backend error:', errorText);
      throw new Error(`Server Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ saveEmployerProfile: Profile saved successfully');
  } catch (error: any) {
    console.error('❌ saveEmployerProfile: Exception:', error.message);
    throw error;
  }
}

export type { EmployerProfile };
