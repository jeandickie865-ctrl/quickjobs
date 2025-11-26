// utils/reviewStore.ts - Review Store (REFACTORED)
import { API_BASE, getAuthHeaders } from './api';

export interface Review {
  id: string;
  workerId: string;
  employerId: string;
  jobId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ===== GET REVIEWS FOR WORKER =====
export async function getReviewsForWorker(workerId: string): Promise<Review[]> {
  console.log('🔍 getReviewsForWorker: Fetching reviews for worker', workerId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/reviews/worker/${workerId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getReviewsForWorker: Failed', response.status, error);
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    
    const reviews = await response.json();
    console.log('✅ getReviewsForWorker: Found', reviews.length, 'reviews');
    return reviews;
  } catch (error) {
    console.error('❌ getReviewsForWorker: Error', error);
    throw error;
  }
}

// ===== GET REVIEWS FOR EMPLOYER =====
export async function getReviewsForEmployer(employerId: string): Promise<Review[]> {
  console.log('🔍 getReviewsForEmployer: Fetching reviews for employer', employerId);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/reviews/employer/${employerId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getReviewsForEmployer: Failed', response.status, error);
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    
    const reviews = await response.json();
    console.log('✅ getReviewsForEmployer: Found', reviews.length, 'reviews');
    return reviews;
  } catch (error) {
    console.error('❌ getReviewsForEmployer: Error', error);
    throw error;
  }
}

// ===== ADD REVIEW =====
export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  console.log('➕ addReview: Creating review');
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(review),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addReview: Failed', response.status, error);
      throw new Error(`Failed to create review: ${response.status}`);
    }
    
    const createdReview = await response.json();
    console.log('✅ addReview: Review created');
    return createdReview;
  } catch (error) {
    console.error('❌ addReview: Error', error);
    throw error;
  }
}

// ===== CALCULATE AVERAGE RATING =====
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}
