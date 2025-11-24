// utils/migrateUserIds.ts - Fix für alte User IDs
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function migrateUserIdsToEmailBased() {
  console.log('🔄 Starting User ID migration...');
  
  try {
    // 1. Get users database
    const usersDbStr = await AsyncStorage.getItem('@shiftmatch:users');
    if (!usersDbStr) {
      console.log('⚠️ No users database found');
      return;
    }
    
    const usersDb = JSON.parse(usersDbStr);
    const emails = Object.keys(usersDb);
    
    console.log(`📋 Found ${emails.length} users`);
    
    // 2. Get all jobs
    const jobsStr = await AsyncStorage.getItem('@shiftmatch:jobs');
    const jobs = jobsStr ? JSON.parse(jobsStr) : [];
    
    console.log(`📦 Found ${jobs.length} jobs`);
    
    // 3. Get all applications
    const appsStr = await AsyncStorage.getItem('@shiftmatch:applications');
    const applications = appsStr ? JSON.parse(appsStr) : [];
    
    console.log(`📨 Found ${applications.length} applications`);
    
    // 4. Create old ID → new ID mapping
    const oldToNewIdMap: Record<string, string> = {};
    
    for (const email of emails) {
      const newId = `user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      // Check if there are jobs with old employer IDs
      const jobsForEmail = jobs.filter((j: any) => j.employerId && j.employerId.includes('1763920'));
      
      if (jobsForEmail.length > 0) {
        // This is an employer with old ID
        const oldId = jobsForEmail[0].employerId;
        oldToNewIdMap[oldId] = newId;
        console.log(`🔄 Mapping: ${oldId} → ${newId} (${email})`);
      }
    }
    
    // 5. Update job employer IDs
    let jobsUpdated = false;
    const updatedJobs = jobs.map((job: any) => {
      if (job.employerId && oldToNewIdMap[job.employerId]) {
        console.log(`📦 Updating job ${job.id}: ${job.employerId} → ${oldToNewIdMap[job.employerId]}`);
        jobsUpdated = true;
        return { ...job, employerId: oldToNewIdMap[job.employerId] };
      }
      return job;
    });
    
    if (jobsUpdated) {
      await AsyncStorage.setItem('@shiftmatch:jobs', JSON.stringify(updatedJobs));
      console.log('✅ Jobs updated');
    }
    
    // 6. Update worker profile if needed
    const profileStr = await AsyncStorage.getItem('@shiftmatch:worker_profile');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      
      // Check if profile has old ID format
      if (profile.userId && profile.userId.includes('1763917')) {
        // Find matching email
        const matchingEmail = emails.find(email => {
          const newId = `user_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          return usersDb[email].role === 'worker';
        });
        
        if (matchingEmail) {
          const newId = `user_${matchingEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          profile.userId = newId;
          await AsyncStorage.setItem('@shiftmatch:worker_profile', JSON.stringify(profile));
          console.log(`✅ Worker profile updated: ${newId}`);
        }
      }
    }
    
    console.log('✅ Migration complete!');
    return { success: true, migratedCount: Object.keys(oldToNewIdMap).length };
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return { success: false, error };
  }
}
