// utils/profileStore.ts
import { WorkerProfile } from '../types/profile';
import { storage } from './storage';

const PROFILE_KEY = '@shiftmatch:worker_profile';

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  console.log('🔍 getWorkerProfile: Loading profile for user', userId);
  const stored = await storage.getItem<any>(PROFILE_KEY);
  
  if (!stored) {
    console.log('⚠️ getWorkerProfile: No profile found');
    return null;
  }
  
  if (stored.userId !== userId) {
    console.log('⚠️ getWorkerProfile: Profile userId mismatch', { stored: stored.userId, requested: userId });
    return null;
  }
  
  // MIGRATION: Altes Format → Neues Format
  let profile: WorkerProfile;
  
  // Check if old format (has street, postalCode, city fields directly)
  if ('street' in stored || 'postalCode' in stored || 'city' in stored) {
    console.log('🔄 Migrating old profile format to new format');
    profile = {
      userId: stored.userId,
      categories: stored.categories ?? [],
      selectedTags: stored.selectedTags ?? [],
      radiusKm: stored.radiusKm ?? 15,
      homeAddress: {
        street: stored.street || '',
        postalCode: stored.postalCode || '',
        city: stored.city || '',
        country: 'DE',
      },
      homeLat: stored.homeLat ?? stored.lat ?? null,
      homeLon: stored.homeLon ?? stored.lon ?? null,
      firstName: stored.name || stored.firstName,
      profilePhotoUri: stored.photoUrl || stored.profilePhotoUri,
      pushToken: stored.pushToken,
    };
    
    // Save migrated version
    await storage.setItem(PROFILE_KEY, profile);
    console.log('✅ Profile migrated and saved');
  } else {
    // Already new format
    profile = {
      ...stored,
      categories: stored.categories ?? [],
      selectedTags: stored.selectedTags ?? [],
      homeLat: stored.homeLat ?? null,
      homeLon: stored.homeLon ?? null,
    };
  }
  
  console.log('✅ getWorkerProfile: Profile loaded', {
    userId: profile.userId,
    categories: profile.categories.length,
    tags: profile.selectedTags.length,
  });
  
  return profile;
}

export async function saveWorkerProfile(profile: WorkerProfile): Promise<void> {
  console.log('💾 saveWorkerProfile: Saving profile for user', profile.userId);
  console.log('💾 saveWorkerProfile: Categories:', profile.categories);
  console.log('💾 saveWorkerProfile: SelectedTags:', profile.selectedTags);
  
  // Normalize profile to ensure arrays are never undefined
  const normalized: WorkerProfile = {
    ...profile,
    categories: profile.categories ?? [],
    selectedTags: profile.selectedTags ?? [],
  };
  
  console.log('💾 saveWorkerProfile: Normalized tags:', normalized.selectedTags);
  
  await storage.setItem(PROFILE_KEY, normalized);
  console.log('✅ saveWorkerProfile: Profile saved successfully', {
    userId: normalized.userId,
    categories: normalized.categories.length,
    tags: normalized.selectedTags.length,
    pushToken: normalized.pushToken ? '✓' : '✗',
  });
}