// utils/profileStore.ts
import { WorkerProfile } from '../types/profile';
import { storage } from './storage';

const PROFILE_KEY = '@shiftmatch:worker_profile';

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  console.log('🔍 getWorkerProfile: Loading profile for user', userId);
  const stored = await storage.getItem<WorkerProfile>(PROFILE_KEY);
  
  if (!stored) {
    console.log('⚠️ getWorkerProfile: No profile found');
    return null;
  }
  
  if (stored.userId !== userId) {
    console.log('⚠️ getWorkerProfile: Profile userId mismatch', { stored: stored.userId, requested: userId });
    return null;
  }
  
  // Ensure arrays are never undefined
  const profile = {
    ...stored,
    categories: stored.categories ?? [],
    selectedTags: stored.selectedTags ?? [],
  };
  
  console.log('✅ getWorkerProfile: Profile loaded', {
    userId: profile.userId,
    categories: profile.categories.length,
    tags: profile.selectedTags.length,
  });
  
  return profile;
}

export async function saveWorkerProfile(profile: WorkerProfile): Promise<void> {
  console.log('💾 saveWorkerProfile: Saving profile for user', profile.userId);
  
  // Normalize profile to ensure arrays are never undefined
  const normalized: WorkerProfile = {
    ...profile,
    categories: profile.categories ?? [],
    selectedTags: profile.selectedTags ?? [],
  };
  
  await storage.setItem(PROFILE_KEY, normalized);
  console.log('✅ saveWorkerProfile: Profile saved successfully', {
    userId: normalized.userId,
    categories: normalized.categories.length,
    tags: normalized.selectedTags.length,
    pushToken: normalized.pushToken ? '✓' : '✗',
  });
}