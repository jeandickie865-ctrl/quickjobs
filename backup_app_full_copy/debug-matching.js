// Debug Script for Matching Logic
// Run this in browser console to debug matching issues

async function debugMatching() {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  console.log('='.repeat(80));
  console.log('🔍 MATCHING DEBUG ANALYSIS');
  console.log('='.repeat(80));
  
  // 1. Get Worker Profile
  const workerProfileStr = await AsyncStorage.getItem('@shiftmatch:worker_profile');
  if (!workerProfileStr) {
    console.log('❌ NO WORKER PROFILE FOUND');
    return;
  }
  
  const workerProfile = JSON.parse(workerProfileStr);
  console.log('\n👤 WORKER PROFILE:');
  console.log('   User ID:', workerProfile.userId);
  console.log('   Name:', workerProfile.firstName);
  console.log('   City:', workerProfile.homeAddress?.city);
  console.log('   PLZ:', workerProfile.homeAddress?.postalCode);
  console.log('   Coordinates:', workerProfile.homeLat, workerProfile.homeLon);
  console.log('   Radius:', workerProfile.radiusKm, 'km');
  console.log('   Categories:', workerProfile.categories);
  console.log('   Tags:', workerProfile.selectedTags);
  
  // 2. Get Jobs
  const jobsStr = await AsyncStorage.getItem('@shiftmatch:jobs');
  if (!jobsStr) {
    console.log('\n❌ NO JOBS FOUND');
    return;
  }
  
  const jobs = JSON.parse(jobsStr);
  const openJobs = jobs.filter(j => j.status === 'open');
  
  console.log('\n💼 JOBS:');
  console.log('   Total Jobs:', jobs.length);
  console.log('   Open Jobs:', openJobs.length);
  
  if (openJobs.length === 0) {
    console.log('   ❌ No open jobs to match!');
    return;
  }
  
  // 3. Test Matching for each job
  console.log('\n🔎 MATCHING TEST:');
  console.log('='.repeat(80));
  
  openJobs.forEach((job, index) => {
    console.log(`\n📦 Job ${index + 1}/${openJobs.length}:`);
    console.log('   ID:', job.id);
    console.log('   Title:', job.title);
    console.log('   Category:', job.category);
    console.log('   Employer ID:', job.employerId);
    console.log('   Status:', job.status);
    console.log('   Coordinates:', job.lat, job.lon);
    console.log('   Required ALL tags:', job.required_all_tags);
    console.log('   Required ANY tags:', job.required_any_tags);
    
    // Test matching criteria
    console.log('\n   🧪 MATCHING CHECKS:');
    
    // 1. Category match
    const categoryMatch = workerProfile.categories?.includes(job.category);
    console.log(`   ${categoryMatch ? '✅' : '❌'} Category Match:`, 
      `Worker has "${workerProfile.categories?.join(', ')}" vs Job needs "${job.category}"`);
    
    // 2. Required ALL tags
    const requiredAll = job.required_all_tags || [];
    const hasAllTags = requiredAll.every(tag => workerProfile.selectedTags?.includes(tag));
    console.log(`   ${hasAllTags ? '✅' : '❌'} Required ALL Tags:`, 
      requiredAll.length === 0 ? 'None required' : 
      `Worker needs ${requiredAll.join(', ')}`);
    if (!hasAllTags && requiredAll.length > 0) {
      const missing = requiredAll.filter(tag => !workerProfile.selectedTags?.includes(tag));
      console.log('      ⚠️ Missing:', missing.join(', '));
    }
    
    // 3. Required ANY tags
    const requiredAny = job.required_any_tags || [];
    const hasAnyTag = requiredAny.length === 0 || 
      requiredAny.some(tag => workerProfile.selectedTags?.includes(tag));
    console.log(`   ${hasAnyTag ? '✅' : '❌'} Required ANY Tags:`, 
      requiredAny.length === 0 ? 'None required' : 
      `Worker needs one of: ${requiredAny.join(', ')}`);
    
    // 4. Coordinates check
    const jobHasCoords = job.lat && job.lon;
    const workerHasCoords = workerProfile.homeLat && workerProfile.homeLon;
    console.log(`   ${jobHasCoords ? '✅' : '⚠️'} Job Coordinates:`, 
      jobHasCoords ? `${job.lat}, ${job.lon}` : 'Missing');
    console.log(`   ${workerHasCoords ? '✅' : '⚠️'} Worker Coordinates:`, 
      workerHasCoords ? `${workerProfile.homeLat}, ${workerProfile.homeLon}` : 'Missing');
    
    // 5. Distance check (if both have coords)
    if (jobHasCoords && workerHasCoords) {
      const distance = calculateDistance(
        { lat: job.lat, lon: job.lon },
        { lat: workerProfile.homeLat, lon: workerProfile.homeLon }
      );
      const withinRadius = distance <= workerProfile.radiusKm;
      console.log(`   ${withinRadius ? '✅' : '❌'} Distance Check:`, 
        `${distance.toFixed(1)} km (radius: ${workerProfile.radiusKm} km)`);
    }
    
    // 6. Status check
    const statusOk = job.status === 'open' || job.status === 'pending';
    console.log(`   ${statusOk ? '✅' : '❌'} Status Check:`, job.status);
    
    // 7. Already matched
    const alreadyMatched = !!job.matchedWorkerId;
    console.log(`   ${!alreadyMatched ? '✅' : '❌'} Not Already Matched:`, 
      alreadyMatched ? `Matched to ${job.matchedWorkerId}` : 'Available');
    
    // Final result
    const shouldMatch = categoryMatch && hasAllTags && hasAnyTag && statusOk && !alreadyMatched;
    console.log(`\n   🎯 FINAL RESULT: ${shouldMatch ? '✅ SHOULD MATCH' : '❌ NO MATCH'}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 DEBUG COMPLETE');
  console.log('='.repeat(80));
}

function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// Run it
debugMatching();
