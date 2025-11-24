// utils/resetStorage.ts - Complete AsyncStorage Reset Tool
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function resetAllStorage() {
  console.log('🔄 RESETTING ALL ASYNCSTORAGE...');
  
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📋 Found ${keys.length} keys to delete:`, keys);
    
    // Delete all keys
    await AsyncStorage.multiRemove(keys);
    
    console.log('✅ ALL ASYNCSTORAGE CLEARED!');
    console.log('🔄 Please refresh the page (F5) to restart');
    
    // Force reload after 2 seconds
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return { success: true, deletedKeys: keys.length };
  } catch (error) {
    console.error('❌ Error resetting storage:', error);
    return { success: false, error };
  }
}
