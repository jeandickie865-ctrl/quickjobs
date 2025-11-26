// utils/profileStore.ts - API-based profile management (MongoDB)
import { WorkerProfile } from '../types/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';
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

// Helper: Get userId from token (extract from user object in AsyncStorage)
async function getUserId(): Promise<string> {
  const userJson = await AsyncStorage.getItem('@shiftmatch:user');
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  return user.id;
}

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  console.log('🔍 getWorkerProfile (API): Loading profile for user', userId);
  
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE}/profiles/worker/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      console.log('⚠️ getWorkerProfile (API): Profile not found (404)');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getWorkerProfile (API): API error', response.status, error);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('✅ getWorkerProfile (API): Profile loaded', {
      userId: profile.userId,
      categories: profile.categories?.length || 0,
      tags: profile.selectedTags?.length || 0,
    });
    
    return profile;
  } catch (error) {
    console.error('❌ getWorkerProfile (API): Error', error);
    throw error;
  }
}

export async function saveWorkerProfile(
  userId: string, 
  profileData: Partial<WorkerProfile>
): Promise<void> {
  console.log('💾 SAVE: saveWorkerProfile called');
  console.log('💾 SAVE: userId:', userId);
  console.log('💾 SAVE: profileData:', profileData);
  
  try {
    // First, try to update (PUT)
    console.log('🔄 SAVE: Trying to update profile via PUT request');
    
    let response = await fetch(`${API_BASE}/profiles/worker/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    console.log('📥 SAVE: Backend PUT response status:', response.status);
    
    // If 404, profile doesn't exist - create it with POST
    if (response.status === 404) {
      console.log('⚠️ SAVE: Profile not found (404), creating new profile via POST');
      
      response = await fetch(`${API_BASE}/profiles/worker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      console.log('📥 SAVE: Backend POST response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SAVE: Backend error response:', errorText);
      
      // Try to parse JSON error message
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || `Server Error ${response.status}`);
      } catch {
        throw new Error(errorText || `Server Error ${response.status}`);
      }
    }
    
    const result = await response.json();
    console.log('✅ SAVE: Backend response data:', result);
    console.log('✅ SAVE: Profile saved successfully');
  } catch (error: any) {
    console.error('❌ SAVE: Exception in saveWorkerProfile:', error);
    console.error('❌ SAVE: Error message:', error.message);
    throw error; // Re-throw so UI can handle it
  }
}

// Legacy function - kept for backward compatibility
export async function saveWorkerProfileLegacy(profile: WorkerProfile): Promise<void> {
  console.log('💾 saveWorkerProfile (API): Saving profile for user', profile.userId);
  console.log('💾 saveWorkerProfile (API): Categories:', profile.categories);
  console.log('💾 saveWorkerProfile (API): SelectedTags:', profile.selectedTags);
  
  try {
    const token = await getAuthToken();
    const userId = profile.userId;
    
    // Check if profile exists
    let existingProfile = null;
    try {
      existingProfile = await getWorkerProfile(userId);
    } catch (error) {
      console.log('⚠️ saveWorkerProfile (API): Could not check existing profile, will try to create');
    }
    
    if (existingProfile) {
      // Update existing profile
      console.log('🔄 saveWorkerProfile (API): Updating existing profile');
      
      const response = await fetch(`${API_BASE}/profiles/worker/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: profile.categories || [],
          selectedTags: profile.selectedTags || [],
          radiusKm: profile.radiusKm || 15,
          homeAddress: profile.homeAddress,
          homeLat: profile.homeLat,
          homeLon: profile.homeLon,
          profilePhotoUri: profile.profilePhotoUri,
          documents: profile.documents || [],
          firstName: profile.firstName,
          lastName: profile.lastName,
          shortBio: profile.shortBio,
          contactPhone: profile.contactPhone,
          contactEmail: profile.contactEmail,
          pushToken: profile.pushToken,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ saveWorkerProfile (API): Update failed', response.status, error);
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      console.log('✅ saveWorkerProfile (API): Profile updated successfully');
    } else {
      // Create new profile
      console.log('➕ saveWorkerProfile (API): Creating new profile');
      
      const response = await fetch(`${API_BASE}/profiles/worker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: profile.categories || [],
          selectedTags: profile.selectedTags || [],
          radiusKm: profile.radiusKm || 15,
          homeAddress: profile.homeAddress,
          homeLat: profile.homeLat,
          homeLon: profile.homeLon,
          profilePhotoUri: profile.profilePhotoUri,
          documents: profile.documents || [],
          firstName: profile.firstName,
          lastName: profile.lastName,
          shortBio: profile.shortBio,
          contactPhone: profile.contactPhone,
          contactEmail: profile.contactEmail,
          pushToken: profile.pushToken,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ saveWorkerProfile (API): Create failed', response.status, error);
        throw new Error(`Failed to create profile: ${response.status}`);
      }
      
      console.log('✅ saveWorkerProfile (API): Profile created successfully');
    }
  } catch (error) {
    console.error('❌ saveWorkerProfile (API): Error', error);
    throw error;
  }
}

// Export WorkerProfile type for convenience
export type { WorkerProfile };