export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

export type JobApplication = {
  id: string;
  jobId: string;
  workerId: string;
  createdAt: string;
  status: ApplicationStatus;
};
