import { storage } from './storage';
import { WorkerProfile } from '../types/profile';

const PROFILE_KEY = '@shiftmatch:worker_profile';

export async function getProfile(): Promise<WorkerProfile | null> {
  try {
    return await storage.getItem<WorkerProfile>(PROFILE_KEY);
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

export async function saveProfile(profile: WorkerProfile): Promise<void> {
  try {
    await storage.setItem(PROFILE_KEY, profile);
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await storage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Error clearing profile:', error);
    throw error;
  }
}