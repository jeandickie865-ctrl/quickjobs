// utils/diagnostics.ts - AsyncStorage Diagnostic Tool
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';

export async function diagnoseAsyncStorage() {
  console.log('='.repeat(60));
  console.log('🔍 ASYNC STORAGE DIAGNOSTICS START');
  console.log('='.repeat(60));

  try {
    // 1. Alle Keys abrufen
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`\n📋 Total Keys in AsyncStorage: ${allKeys.length}`);
    console.log('Keys:', allKeys);

    // 2. Auth-Daten
    console.log('\n' + '='.repeat(60));
    console.log('🔐 AUTH DATA');
    console.log('='.repeat(60));
    
    const userStr = await AsyncStorage.getItem('@shiftmatch:user');
    const tokenStr = await AsyncStorage.getItem('@shiftmatch:token');
    const usersDbStr = await AsyncStorage.getItem('@shiftmatch:users');
    
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('✅ Current User:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } else {
      console.log('❌ No user logged in');
    }
    
    if (tokenStr) {
      console.log('✅ Token exists:', tokenStr.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found');
    }
    
    if (usersDbStr) {
      const usersDb = JSON.parse(usersDbStr);
      const emails = Object.keys(usersDb);
      console.log(`✅ Users Database: ${emails.length} users registered`);
      emails.forEach(email => {
        console.log(`   - ${email} (${usersDb[email].role})`);
      });
    } else {
      console.log('❌ No users database found');
    }

    // 3. Worker Profile
    console.log('\n' + '='.repeat(60));
    console.log('👤 WORKER PROFILE DATA');
    console.log('='.repeat(60));
    
    const profileStr = await AsyncStorage.getItem('@shiftmatch:worker_profile');
    if (profileStr) {
      const profile: WorkerProfile = JSON.parse(profileStr);
      console.log('✅ Worker Profile found:');
      console.log('   - User ID:', profile.userId);
      console.log('   - Name:', profile.name);
      console.log('   - Address:', `${profile.street}, ${profile.postalCode} ${profile.city}`);
      console.log('   - Coordinates:', profile.homeLat && profile.homeLon 
        ? `✅ Lat: ${profile.homeLat.toFixed(4)}, Lon: ${profile.homeLon.toFixed(4)}`
        : '❌ MISSING');
      console.log('   - Radius:', profile.radiusKm, 'km');
      console.log('   - Categories:', profile.categories?.length || 0, '→', profile.categories);
      console.log('   - Selected Tags:', profile.selectedTags?.length || 0, '→', profile.selectedTags);
      console.log('   - Photo URL:', profile.photoUrl ? '✅ Set' : '❌ Not set');
    } else {
      console.log('❌ No worker profile found');
    }

    // 4. Jobs
    console.log('\n' + '='.repeat(60));
    console.log('💼 JOBS DATA');
    console.log('='.repeat(60));
    
    const jobsStr = await AsyncStorage.getItem('@shiftmatch:jobs');
    if (jobsStr) {
      const jobs: Job[] = JSON.parse(jobsStr);
      console.log(`✅ Total Jobs: ${jobs.length}`);
      
      const openJobs = jobs.filter(j => j.status === 'open');
      console.log(`   - Open Jobs: ${openJobs.length}`);
      
      openJobs.slice(0, 3).forEach((job, idx) => {
        console.log(`\n   📦 Job ${idx + 1}/${openJobs.length}:`);
        console.log('      - ID:', job.id);
        console.log('      - Title:', job.title);
        console.log('      - Category:', job.category);
        console.log('      - Status:', job.status);
        console.log('      - Coordinates:', job.lat && job.lon 
          ? `✅ Lat: ${job.lat.toFixed(4)}, Lon: ${job.lon.toFixed(4)}`
          : '❌ MISSING');
        console.log('      - Required ALL tags:', job.required_all_tags?.length || 0, '→', job.required_all_tags);
        console.log('      - Required ANY tags:', job.required_any_tags?.length || 0, '→', job.required_any_tags);
        console.log('      - Worker Amount:', job.workerAmountCents ? `${job.workerAmountCents} cents` : '❌ MISSING');
        console.log('      - Employer ID:', job.employerId || '❌ MISSING');
      });
      
      if (openJobs.length > 3) {
        console.log(`\n   ... and ${openJobs.length - 3} more jobs`);
      }
    } else {
      console.log('❌ No jobs found');
    }

    // 5. Applications
    console.log('\n' + '='.repeat(60));
    console.log('📨 APPLICATIONS DATA');
    console.log('='.repeat(60));
    
    const appsStr = await AsyncStorage.getItem('@shiftmatch:applications');
    if (appsStr) {
      const apps = JSON.parse(appsStr);
      console.log(`✅ Applications: ${apps.length}`);
      apps.slice(0, 3).forEach((app: any, idx: number) => {
        console.log(`   ${idx + 1}. Job: ${app.jobId}, Worker: ${app.workerId}, Status: ${app.status}`);
      });
    } else {
      console.log('❌ No applications found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 DIAGNOSTICS COMPLETE');
    console.log('='.repeat(60));

    return {
      success: true,
      keyCount: allKeys.length,
      hasUser: !!userStr,
      hasProfile: !!profileStr,
      hasJobs: !!jobsStr,
    };
  } catch (error) {
    console.error('❌ Diagnostic Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
