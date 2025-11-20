import { Address } from './address';

export type JobTimeMode = 'fixed_time' | 'hour_package' | 'project';

export type Job = {
  id: string;
  employerId: string;
  employerType: 'private' | 'business';

  title: string;
  description?: string;
  category: string;

  timeMode: JobTimeMode;

  // fixed_time: z. B. "heute 19–23 Uhr"
  startAt?: string;  // ISO
  endAt?: string;    // ISO

  // hour_package: z. B. "6 Stunden Lagerarbeit"
  hours?: number;

  // project: z. B. "Hecke schneiden bis Freitag"
  dueAt?: string;

  address: Address;      // Strukturierte Adresse (statt string)
  lat: number;
  lon: number;

  workerAmountCents: number; // Gesamtbetrag für den Arbeitnehmer
  paymentToWorker: 'cash' | 'bank' | 'paypal';

  required_all_tags: string[]; // müssen im Worker-Profil vorhanden sein
  required_any_tags: string[]; // mindestens einer davon sollte vorhanden sein

  status: 'draft' | 'open' | 'matched' | 'done' | 'canceled';
  matchedWorkerId?: string;  // Set when an application is accepted

  createdAt: string;
};