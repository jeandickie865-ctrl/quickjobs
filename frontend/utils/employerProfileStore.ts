// utils/employerProfileStore.ts - API-based employer profile management (MongoDB)
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://karriereportal.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = '@shiftmatch:token';

export interface EmployerProfile {
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  street: string;
  houseNumber?: string;  // Added for house number support
  postalCode: string;
  city: string;
  lat?: number;
  lon?: number;
  paymentMethod?: 'card' | 'paypal' | null;
  shortBio?: string;
  profilePhotoUri?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper: Get auth token from AsyncStorage
async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated - no token found');
  }
  return token;
}

export async function getEmployerProfile(userId: string): Promise<EmployerProfile | null> {
  console.log('🔍 getEmployerProfile (API): Loading profile for user', userId);
  
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE}/profiles/employer/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 404) {
      console.log('⚠️ getEmployerProfile (API): Profile not found (404)');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getEmployerProfile (API): API error', response.status, error);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }
    
    const profile = await response.json();
    console.log('✅ getEmployerProfile (API): Profile loaded', profile.userId);
    
    return profile;
  } catch (error) {
    console.error('❌ getEmployerProfile (API): Error', error);
    throw error;
  }
}

export async function saveEmployerProfile(profile: EmployerProfile): Promise<void> {
  console.log('💾 saveEmployerProfile (API): Saving profile for user', profile.userId);
  
  try {
    const token = await getAuthToken();
    const userId = profile.userId;
    
    // Check if profile exists
    let existingProfile = null;
    try {
      existingProfile = await getEmployerProfile(userId);
    } catch (error) {
      console.log('⚠️ saveEmployerProfile (API): Could not check existing profile, will try to create');
    }
    
    if (existingProfile) {
      // Update existing profile
      console.log('🔄 saveEmployerProfile (API): Updating existing profile');
      
      const response = await fetch(`${API_BASE}/profiles/employer/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
          phone: profile.phone,
          email: profile.email,
          street: profile.street,
          postalCode: profile.postalCode,
          city: profile.city,
          lat: profile.lat,
          lon: profile.lon,
          paymentMethod: profile.paymentMethod,
          shortBio: profile.shortBio,
          profilePhotoUri: profile.profilePhotoUri,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ saveEmployerProfile (API): Update failed', response.status, error);
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      console.log('✅ saveEmployerProfile (API): Profile updated successfully');
    } else {
      // Create new profile
      console.log('➕ saveEmployerProfile (API): Creating new profile');
      
      const response = await fetch(`${API_BASE}/profiles/employer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
          phone: profile.phone,
          email: profile.email,
          street: profile.street,
          postalCode: profile.postalCode,
          city: profile.city,
          lat: profile.lat,
          lon: profile.lon,
          paymentMethod: profile.paymentMethod,
          shortBio: profile.shortBio,
          profilePhotoUri: profile.profilePhotoUri,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ saveEmployerProfile (API): Create failed', response.status, error);
        throw new Error(`Failed to create profile: ${response.status}`);
      }
      
      console.log('✅ saveEmployerProfile (API): Profile created successfully');
    }
  } catch (error) {
    console.error('❌ saveEmployerProfile (API): Error', error);
    throw error;
  }
}
