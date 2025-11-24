// Debug-Helfer für AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function debugAsyncStorage() {
  console.log('🔍 === DEBUG ASYNC STORAGE ===');
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📦 Total keys: ${keys.length}`);
    console.log('📦 Keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`📦 ${key}:`, JSON.stringify(parsed, null, 2).substring(0, 200));
        } catch {
          console.log(`📦 ${key}:`, value.substring(0, 100));
        }
      }
    }
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
  }
  
  console.log('🔍 === END DEBUG ===');
}
