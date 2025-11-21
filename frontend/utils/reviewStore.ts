// utils/reviewStore.ts
import { getItem, setItem } from './storage';
import { Review } from '../types/review';

const REVIEW_KEY = '@shiftmatch:reviews';

/**
 * Alle Reviews aus AsyncStorage laden
 */
export async function getReviews(): Promise<Review[]> {
  const reviews = await getItem<Review[]>(REVIEW_KEY);
  return reviews ?? [];
}

/**
 * Neue Review hinzufügen
 * Verhindert Duplikate: Wenn bereits eine Review für jobId + workerId + employerId existiert,
 * wird diese überschrieben
 */
export async function addReview(review: Review): Promise<void> {
  const reviews = await getReviews();
  
  // Prüfen ob bereits eine Review für diesen Job + Worker + Employer existiert
  const existingIndex = reviews.findIndex(
    (r) =>
      r.jobId === review.jobId &&
      r.workerId === review.workerId &&
      r.employerId === review.employerId
  );

  if (existingIndex >= 0) {
    // Existierende Review überschreiben
    console.log('⚠️ Review existiert bereits, wird überschrieben');
    reviews[existingIndex] = review;
  } else {
    // Neue Review hinzufügen
    reviews.push(review);
  }

  await setItem(REVIEW_KEY, reviews);
  console.log('✅ Review gespeichert:', review);
}

/**
 * Alle Reviews für einen bestimmten Worker laden
 */
export async function getReviewsForWorker(workerId: string): Promise<Review[]> {
  const reviews = await getReviews();
  return reviews.filter((r) => r.workerId === workerId);
}

/**
 * Prüfen ob für einen Job bereits eine Review existiert
 */
export async function getReviewForJob(
  jobId: string,
  workerId: string,
  employerId: string
): Promise<Review | undefined> {
  const reviews = await getReviews();
  return reviews.find(
    (r) =>
      r.jobId === jobId &&
      r.workerId === workerId &&
      r.employerId === employerId
  );
}

/**
 * Durchschnittliche Bewertung für einen Worker berechnen
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}
