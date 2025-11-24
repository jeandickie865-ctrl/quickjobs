// Debug-Helper für Job-Probleme
import { addJob } from './jobStore';
import { Job } from '../types/job';

export async function createTestJob(): Promise<void> {
  const testJob: Job = {
    id: 'job-test-' + Date.now(),
    employerId: 'test-employer-' + Date.now(),
    employerType: 'private',
    title: 'Test Gartenarbeit',
    description: 'Rasen mähen und Hecke schneiden - TEST JOB',
    category: 'haus_garten',
    timeMode: 'hour_package',
    hours: 4,
    startAt: '2025-01-15T00:00:00.000Z',
    endAt: '2025-01-15T23:59:00.000Z',
    address: {
      street: 'Teststraße 1',
      postalCode: '12345',
      city: 'Berlin'
    },
    lat: 52.52,
    lon: 13.405,
    workerAmountCents: 10000,
    paymentToWorker: 'cash',
    required_all_tags: [],
    required_any_tags: [],
    status: 'open',
    createdAt: new Date().toISOString()
  };

  console.log('🧪 Creating test job:', testJob);
  await addJob(testJob);
  console.log('✅ Test job created successfully!');
  alert('Test-Job wurde erfolgreich erstellt! Bitte Feed neu laden.');
}
