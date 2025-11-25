// utils/chatHelper.ts - Chat Unlock Logic
import { Job } from '../types/job';
import { JobApplication } from '../types/application';

/**
 * Determines if chat is allowed between employer and worker.
 * 
 * Chat is ONLY allowed when:
 * 1. Application is accepted
 * 2. Job status is "matched"
 * 3. Job has matchedWorkerId set to the worker
 * 4. Payment has been completed (implied by matched status)
 */
export function canChat(
  job: Job | null,
  application: JobApplication | null,
  userId: string
): boolean {
  if (!job || !application) {
    console.log('🔒 canChat: false - missing job or application');
    return false;
  }

  const isMatched = 
    job.status === 'matched' &&
    job.matchedWorkerId === application.workerId &&
    application.status === 'accepted';

  console.log('🔍 canChat check:', {
    jobStatus: job.status,
    jobMatchedWorkerId: job.matchedWorkerId,
    applicationWorkerId: application.workerId,
    applicationStatus: application.status,
    result: isMatched
  });

  return isMatched;
}

/**
 * Get chat thread ID for a job/application pair
 */
export function getChatThreadId(jobId: string, employerId: string, workerId: string): string {
  return `${jobId}_${employerId}_${workerId}`;
}
