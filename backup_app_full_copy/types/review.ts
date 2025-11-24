// types/review.ts
export type Review = {
  id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string; // ISO date
};
