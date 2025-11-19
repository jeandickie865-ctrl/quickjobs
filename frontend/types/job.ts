export type JobTimeMode = 'fixed_time' | 'hour_package' | 'project';

export type Job = {
  id: string;
  employerId: string;
  employerType: 'private' | 'business';

  title: string;
  description?: string;
  category: string;

  timeMode: JobTimeMode;

  // fixed_time
  startAt?: string;  // ISO
  endAt?: string;    // ISO

  // hour_package
  hours?: number;

  // project
  dueAt?: string;

  address: string;
  lat: number;
  lon: number;

  workerAmountCents: number;
  paymentToWorker: 'cash' | 'bank' | 'paypal';

  required_all_tags: string[];
  required_any_tags: string[];

  status: 'open' | 'matched' | 'done' | 'canceled';
};