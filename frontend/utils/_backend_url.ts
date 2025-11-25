// utils/_backend_url.ts - Centralized backend URL configuration
import Constants from 'expo-constants';

// Get backend URL from environment or use relative path (for deployed environments)
// NEVER use hardcoded preview URLs as fallback!
const getBackendUrl = (): string => {
  // Try to get from Expo config
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  
  if (configUrl) {
    console.log('📡 Using backend URL from config:', configUrl);
    return configUrl;
  }
  
  // Fallback to relative path (works in deployed environments)
  console.log('📡 Using relative backend URL (deployed environment)');
  return '';
};

export const BACKEND_URL = getBackendUrl();
export const API_BASE = `${BACKEND_URL}/api`;
export const TOKEN_KEY = '@shiftmatch:token';

// Helper: Get auth token from AsyncStorage
export async function getAuthToken(): Promise<string> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated - no token found');
  }
  return token;
}

// Helper: Get userId from AsyncStorage
export async function getUserId(): Promise<string> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default);
  const userJson = await AsyncStorage.getItem('@shiftmatch:user');
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  return user.id;
}
