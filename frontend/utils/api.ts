// utils/api.ts - ZENTRALE API-Konfiguration
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== BACKEND URL =====
// WICHTIG: Hier die Backend-URL eintragen!
export const API_BASE = 'https://accessaudit-jobapp.preview.emergentagent.com/api';

// ===== STORAGE KEYS =====
const TOKEN_KEY = '@shiftmatch:token';
const USER_KEY = '@shiftmatch:user';

// ===== HELPER: Get Auth Token =====
export async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated - no token found');
  }
  return token;
}

// ===== HELPER: Get User ID =====
export async function getUserId(): Promise<string> {
  const userJson = await AsyncStorage.getItem(USER_KEY);
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  return user.id;
}

// ===== HELPER: Get User Object =====
export async function getUser(): Promise<{ id: string; email: string; role: string }> {
  const userJson = await AsyncStorage.getItem(USER_KEY);
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  return JSON.parse(userJson);
}

// ===== HELPER: Build Headers =====
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
