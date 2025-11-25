// utils/reviewStore.ts - API-based review management (MongoDB)
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Review } from '../types/review';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://jobfinder-de.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = '@shiftmatch:token';

// Helper: Get auth token from AsyncStorage
async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated - no token found');
  }
  return token;
}

// Helper: Get userId from AsyncStorage
async function getUserId(): Promise<string> {
  const userJson = await AsyncStorage.getItem('@shiftmatch:user');
  if (!userJson) {
    throw new Error('Not authenticated - no user found');
  }
  const user = JSON.parse(userJson);
  return user.id;
}

/**
 * Neue Review hinzufügen oder bestehende aktualisieren
 */
export async function addReview(review: Review): Promise<void> {
  console.log('➕ addReview (API): Creating review', review);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: review.jobId,
        workerId: review.workerId,
        employerId: review.employerId,
        rating: review.rating,
        comment: review.comment,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ addReview (API): Failed', response.status, error);
      throw new Error(`Failed to create review: ${response.status}`);
    }
    
    console.log('✅ addReview (API): Review created successfully');
  } catch (error) {
    console.error('❌ addReview (API): Error', error);
    throw error;
  }
}

/**
 * Alle Reviews für einen bestimmten Worker laden
 */
export async function getReviewsForWorker(workerId: string): Promise<Review[]> {
  console.log('🔍 getReviewsForWorker (API): Fetching reviews for worker', workerId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/reviews/worker/${workerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getReviewsForWorker (API): Failed', response.status, error);
      throw new Error(`Failed to fetch worker reviews: ${response.status}`);
    }
    
    const reviews = await response.json();
    console.log(`✅ getReviewsForWorker (API): Found ${reviews.length} reviews for worker ${workerId}`);
    
    return reviews;
  } catch (error) {
    console.error('❌ getReviewsForWorker (API): Error', error);
    throw error;
  }
}

/**
 * Alle Reviews für einen bestimmten Employer laden
 */
export async function getReviewsForEmployer(employerId: string): Promise<Review[]> {
  console.log('🔍 getReviewsForEmployer (API): Fetching reviews for employer', employerId);
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/reviews/employer/${employerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ getReviewsForEmployer (API): Failed', response.status, error);
      throw new Error(`Failed to fetch employer reviews: ${response.status}`);
    }
    
    const reviews = await response.json();
    console.log(`✅ getReviewsForEmployer (API): Found ${reviews.length} reviews for employer ${employerId}`);
    
    return reviews;
  } catch (error) {
    console.error('❌ getReviewsForEmployer (API): Error', error);
    throw error;
  }
}

/**
 * Durchschnittliche Bewertung berechnen
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Auf 1 Dezimalstelle runden
}

// Legacy function - kept for compatibility
export async function getReviews(): Promise<Review[]> {
  console.warn('⚠️ getReviews() is deprecated - use getReviewsForWorker() or getReviewsForEmployer()');
  return [];
}

/**
 * Prüfen ob für einen Job bereits eine Review existiert
 */
export async function getReviewForJob(
  jobId: string,
  workerId: string,
  employerId: string
): Promise<Review | undefined> {
  console.log('🔍 getReviewForJob (API): Checking for existing review', { jobId, workerId, employerId });
  
  try {
    const userId = await getUserId();
    
    const response = await fetch(`${API_BASE}/reviews/job/${jobId}?workerId=${workerId}&employerId=${employerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('✅ getReviewForJob (API): No existing review found');
        return undefined;
      }
      const error = await response.text();
      console.error('❌ getReviewForJob (API): Failed', response.status, error);
      throw new Error(`Failed to check for existing review: ${response.status}`);
    }
    
    const review = await response.json();
    console.log('✅ getReviewForJob (API): Found existing review', review);
    
    return review;
  } catch (error) {
    console.error('❌ getReviewForJob (API): Error', error);
    throw error;
  }
}
