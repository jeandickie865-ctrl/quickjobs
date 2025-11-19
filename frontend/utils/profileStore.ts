// utils/profileStore.ts
import { WorkerProfile } from '../types/profile';
import { storage } from './storage';

const PROFILE_KEY = '@shiftmatch:worker_profile';

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  const stored = await storage.getItem<WorkerProfile>(PROFILE_KEY);
  if (!stored) return null;
  if (stored.userId !== userId) return null;
  return stored;
}

export async function saveWorkerProfile(profile: WorkerProfile): Promise<void> {
  await storage.setItem(PROFILE_KEY, profile);
}