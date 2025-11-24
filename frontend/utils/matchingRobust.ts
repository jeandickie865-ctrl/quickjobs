// utils/matchingRobust.ts - ROBUST MATCHING ENGINE WITH FULL ERROR HANDLING
import { WorkerProfile } from '../types/profile';
import { Job } from '../types/job';
import { calculateDistance } from './distance';

// ============================================================================
// MATCHING RESULT TYPE - For detailed debugging
// ============================================================================
export type MatchResult = {
  matches: boolean;
  reason: string;
  details: {
    step: string;
    passed: boolean;
    info?: any;
  }[];
  jobId: string;
  workerId: string;
};

// ============================================================================
// VALIDATION HELPERS - Ensure data integrity
// ============================================================================

function validateJob(job: Job): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!job) {
    errors.push('Job is null or undefined');
    return { valid: false, errors };
  }
  
  if (!job.id) errors.push('Job missing ID');
  if (!job.category) errors.push('Job missing category');
  if (!job.status) errors.push('Job missing status');
  if (!job.title) errors.push('Job missing title');
  
  return { valid: errors.length === 0, errors };
}

function validateWorker(worker: WorkerProfile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!worker) {
    errors.push('Worker is null or undefined');
    return { valid: false, errors };
  }
  
  if (!worker.userId) errors.push('Worker missing userId');
  if (!worker.categories || worker.categories.length === 0) {
    errors.push('Worker has no categories selected');
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// SAFE ARRAY/STRING HELPERS - Never crash on undefined
// ============================================================================

function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

function safeString(str: string | undefined | null): string {
  return typeof str === 'string' ? str : '';
}

function safeNumber(num: number | undefined | null, defaultVal: number = 0): number {
  return typeof num === 'number' && !isNaN(num) ? num : defaultVal;
}

// ============================================================================
// MATCHING STEPS - Each step is isolated and safe
// ============================================================================

/**
 * Step 1: Validate input data
 */
function step1_validateInput(job: Job, worker: WorkerProfile): {
  passed: boolean;
  info?: any;
} {
  const jobValidation = validateJob(job);
  const workerValidation = validateWorker(worker);
  
  if (!jobValidation.valid || !workerValidation.valid) {
    return {
      passed: false,
      info: {
        jobErrors: jobValidation.errors,
        workerErrors: workerValidation.errors,
      },
    };
  }
  
  return { passed: true };
}

/**
 * Step 2: Check job status
 */
function step2_checkStatus(job: Job): {
  passed: boolean;
  info?: any;
} {
  const status = safeString(job.status).toLowerCase();
  const validStatuses = ['open', 'pending'];
  
  if (!validStatuses.includes(status)) {
    return {
      passed: false,
      info: { status, validStatuses },
    };
  }
  
  return { passed: true, info: { status } };
}

/**
 * Step 3: Check if job already matched
 */
function step3_checkAlreadyMatched(job: Job): {
  passed: boolean;
  info?: any;
} {
  if (job.matchedWorkerId) {
    return {
      passed: false,
      info: { matchedWorkerId: job.matchedWorkerId },
    };
  }
  
  return { passed: true };
}

/**
 * Step 4: Category match
 */
function step4_categoryMatch(job: Job, worker: WorkerProfile): {
  passed: boolean;
  info?: any;
} {
  const jobCategory = safeString(job.category);
  const workerCategories = safeArray(worker.categories);
  
  if (workerCategories.length === 0) {
    return {
      passed: false,
      info: { reason: 'Worker has no categories', workerCategories },
    };
  }
  
  const matches = workerCategories.includes(jobCategory);
  
  return {
    passed: matches,
    info: {
      jobCategory,
      workerCategories,
      matches,
    },
  };
}

/**
 * Step 5: Required ALL tags check
 */
function step5_requiredAllTags(job: Job, worker: WorkerProfile): {
  passed: boolean;
  info?: any;
} {
  const requiredAllTags = safeArray(job.required_all_tags);
  const workerSkills = safeArray(worker.selectedTags);
  
  // No requirements = pass
  if (requiredAllTags.length === 0) {
    return { passed: true, info: { noRequirements: true } };
  }
  
  const missing = requiredAllTags.filter(tag => !workerSkills.includes(tag));
  
  return {
    passed: missing.length === 0,
    info: {
      requiredAllTags,
      workerSkills,
      missing,
    },
  };
}

/**
 * Step 6: Required ANY tags check
 */
function step6_requiredAnyTags(job: Job, worker: WorkerProfile): {
  passed: boolean;
  info?: any;
} {
  const requiredAnyTags = safeArray(job.required_any_tags);
  const workerSkills = safeArray(worker.selectedTags);
  
  // No requirements = pass
  if (requiredAnyTags.length === 0) {
    return { passed: true, info: { noRequirements: true } };
  }
  
  const hasAtLeastOne = requiredAnyTags.some(tag => workerSkills.includes(tag));
  const matching = requiredAnyTags.filter(tag => workerSkills.includes(tag));
  
  return {
    passed: hasAtLeastOne,
    info: {
      requiredAnyTags,
      workerSkills,
      matching,
      hasAtLeastOne,
    },
  };
}

/**
 * Step 7: Radius check (only if both have coordinates)
 */
function step7_radiusCheck(job: Job, worker: WorkerProfile): {
  passed: boolean;
  info?: any;
} {
  const jobLat = safeNumber(job.lat, 0);
  const jobLon = safeNumber(job.lon, 0);
  const workerLat = safeNumber(worker.homeLat || undefined, 0);
  const workerLon = safeNumber(worker.homeLon || undefined, 0);
  const workerRadius = safeNumber(worker.radiusKm, 50);
  
  // If either is missing coordinates, skip radius check (pass)
  if (!jobLat || !jobLon || !workerLat || !workerLon) {
    return {
      passed: true,
      info: {
        skipped: true,
        reason: 'Missing coordinates',
        jobHasCoords: !!(jobLat && jobLon),
        workerHasCoords: !!(workerLat && workerLon),
      },
    };
  }
  
  try {
    const distance = calculateDistance(
      { lat: jobLat, lon: jobLon },
      { lat: workerLat, lon: workerLon }
    );
    
    const withinRadius = distance <= workerRadius;
    
    return {
      passed: withinRadius,
      info: {
        distance: Math.round(distance * 10) / 10,
        workerRadius,
        withinRadius,
      },
    };
  } catch (error) {
    // If distance calculation fails, log and skip (pass)
    console.error('❌ Distance calculation failed:', error);
    return {
      passed: true,
      info: {
        skipped: true,
        reason: 'Distance calculation error',
        error: String(error),
      },
    };
  }
}

// ============================================================================
// MAIN ROBUST MATCHING FUNCTION
// ============================================================================

/**
 * Robust matching engine with full error handling and detailed logging
 * Returns a MatchResult with complete debugging information
 */
export function matchJobToWorkerRobust(job: Job, worker: WorkerProfile): MatchResult {
  const details: MatchResult['details'] = [];
  
  // Initialize result
  const result: MatchResult = {
    matches: false,
    reason: '',
    details,
    jobId: job?.id || 'UNKNOWN',
    workerId: worker?.userId || 'UNKNOWN',
  };
  
  try {
    // Step 1: Validate input
    const step1 = step1_validateInput(job, worker);
    details.push({ step: '1. Input Validation', passed: step1.passed, info: step1.info });
    if (!step1.passed) {
      result.reason = 'Invalid input data';
      return result;
    }
    
    // Step 2: Check status
    const step2 = step2_checkStatus(job);
    details.push({ step: '2. Job Status', passed: step2.passed, info: step2.info });
    if (!step2.passed) {
      result.reason = 'Job status not open/pending';
      return result;
    }
    
    // Step 3: Check already matched
    const step3 = step3_checkAlreadyMatched(job);
    details.push({ step: '3. Already Matched', passed: step3.passed, info: step3.info });
    if (!step3.passed) {
      result.reason = 'Job already matched';
      return result;
    }
    
    // Step 4: Category match
    const step4 = step4_categoryMatch(job, worker);
    details.push({ step: '4. Category Match', passed: step4.passed, info: step4.info });
    if (!step4.passed) {
      result.reason = 'Category mismatch';
      return result;
    }
    
    // Step 5: Required ALL tags
    const step5 = step5_requiredAllTags(job, worker);
    details.push({ step: '5. Required ALL Tags', passed: step5.passed, info: step5.info });
    if (!step5.passed) {
      result.reason = 'Missing required tags (ALL)';
      return result;
    }
    
    // Step 6: Required ANY tags
    const step6 = step6_requiredAnyTags(job, worker);
    details.push({ step: '6. Required ANY Tags', passed: step6.passed, info: step6.info });
    if (!step6.passed) {
      result.reason = 'Missing required tags (ANY)';
      return result;
    }
    
    // Step 7: Radius check
    const step7 = step7_radiusCheck(job, worker);
    details.push({ step: '7. Radius Check', passed: step7.passed, info: step7.info });
    if (!step7.passed) {
      result.reason = 'Outside radius';
      return result;
    }
    
    // All checks passed!
    result.matches = true;
    result.reason = 'All checks passed';
    
    return result;
    
  } catch (error) {
    // Catch any unexpected errors
    console.error('❌ CRITICAL: Matching engine error:', error);
    result.matches = false;
    result.reason = 'Critical error: ' + String(error);
    details.push({
      step: 'ERROR',
      passed: false,
      info: { error: String(error), stack: error instanceof Error ? error.stack : undefined },
    });
    return result;
  }
}

// ============================================================================
// SIMPLE BOOLEAN WRAPPER - For existing code compatibility
// ============================================================================

/**
 * Simple boolean wrapper for robust matching
 * Use this to replace existing matching calls
 */
export function matchJobToWorkerSafe(job: Job, worker: WorkerProfile): boolean {
  try {
    const result = matchJobToWorkerRobust(job, worker);
    
    // Log detailed information for debugging
    if (!result.matches) {
      console.log(`❌ Job "${job?.title}" did NOT match - Reason: ${result.reason}`);
    } else {
      console.log(`✅ Job "${job?.title}" MATCHED`);
    }
    
    return result.matches;
  } catch (error) {
    console.error('❌ CRITICAL: Safe matching wrapper failed:', error);
    return false; // Fail-safe: don't match on error
  }
}

// ============================================================================
// BATCH MATCHING WITH STATS
// ============================================================================

export type MatchingStats = {
  totalJobs: number;
  matchedJobs: number;
  failedByReason: Record<string, number>;
  avgProcessingTimeMs: number;
};

/**
 * Filter jobs with detailed statistics
 */
export function filterMatchingJobsRobust(
  jobs: Job[],
  worker: WorkerProfile
): { matches: Job[]; stats: MatchingStats } {
  const startTime = Date.now();
  const failedByReason: Record<string, number> = {};
  const matches: Job[] = [];
  
  for (const job of jobs) {
    const result = matchJobToWorkerRobust(job, worker);
    
    if (result.matches) {
      matches.push(job);
    } else {
      failedByReason[result.reason] = (failedByReason[result.reason] || 0) + 1;
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  const stats: MatchingStats = {
    totalJobs: jobs.length,
    matchedJobs: matches.length,
    failedByReason,
    avgProcessingTimeMs: jobs.length > 0 ? processingTime / jobs.length : 0,
  };
  
  console.log('📊 MATCHING STATS:', stats);
  
  return { matches, stats };
}
