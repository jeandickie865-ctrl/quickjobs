// utils/employerProfileStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@backup:employer_profiles';

export interface EmployerProfile {
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  paymentMethod: 'card' | 'paypal' | null;
  shortBio?: string;
  profilePhotoUri?: string;
}

export async function getEmployerProfile(userId: string): Promise<EmployerProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const profiles: Record<string, EmployerProfile> = JSON.parse(stored);
    return profiles[userId] || null;
  } catch (error) {
    console.error('Error loading employer profile:', error);
    return null;
  }
}

export async function saveEmployerProfile(profile: EmployerProfile): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const profiles: Record<string, EmployerProfile> = stored ? JSON.parse(stored) : {};

    profiles[profile.userId] = profile;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Error saving employer profile:', error);
    throw error;
  }
}
