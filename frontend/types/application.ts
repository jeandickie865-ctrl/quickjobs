export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export type JobApplication = {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;  // Owner of the job
  createdAt: string;
  status: ApplicationStatus;
  // Legal confirmation flags (set after match, before contact data)
  employerConfirmedLegal?: boolean;
  workerConfirmedLegal?: boolean;
};
