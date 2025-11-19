// utils/profileStore.ts
import { WorkerProfile } from '../types/profile';
import { storage } from './storage';

const PROFILE_KEY = '@shiftmatch:worker_profile';

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  const stored = await storage.getItem<WorkerProfile>(PROFILE_KEY);
  if (!stored) return null;
  if (stored.userId !== userId) return null;
  
  // Ensure arrays are never undefined
  return {
    ...stored,
    categories: stored.categories ?? [],
    selectedTags: stored.selectedTags ?? [],
  };
}

export async function saveWorkerProfile(profile: WorkerProfile): Promise<void> {
  // Normalize profile to ensure arrays are never undefined
  const normalized: WorkerProfile = {
    ...profile,
    categories: profile.categories ?? [],
    selectedTags: profile.selectedTags ?? [],
  };
  await storage.setItem(PROFILE_KEY, normalized);
}