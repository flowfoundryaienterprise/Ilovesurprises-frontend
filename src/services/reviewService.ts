import type { Review } from '../types';
import { MOCK_REVIEWS } from '../data/mockData';
import { apiClient, type ApiResponse } from './apiClient';

const REVIEWS_STORAGE_KEY = 'ils_reviews_v1';

export const reviewService = {
  /**
   * Retrieves product reviews from local storage / mock data.
   */
  async getProductReviews(_productId: string): Promise<{
    reviews: Review[];
    stats: { averageRating: number; totalReviews: number; breakdown: Record<number, number> };
  }> {
    let reviews: Review[] = MOCK_REVIEWS;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            reviews = parsed;
          }
        } else {
          localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(MOCK_REVIEWS));
        }
      } catch {
        // use fallback mock
      }
    }

    const totalReviews = reviews.length;
    const avg = totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1))
      : 5.0;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });

    return {
      reviews,
      stats: {
        averageRating: avg,
        totalReviews,
        breakdown,
      },
    };
  },

  /**
   * Creates and stores a new customer product review.
   * Sends review to backend POST /api/products/:id/reviews with local persistence fallback.
   */
  async createReview(data: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
    customerName: string;
    surpriseType?: string;
    revealedItem?: string;
  }): Promise<Review> {
    let backendReviewId: string | null = null;
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/api/products/${encodeURIComponent(data.productId)}/reviews`,
        {
          rating: data.rating,
          title: data.title,
          comment: data.comment,
        }
      );
      const resData = response?.data || (response as any);
      if (resData?.id) {
        backendReviewId = resData.id;
      }
    } catch (err) {
      console.warn('Backend review submission failed, falling back to local storage:', err);
    }

    const newReview: Review = {
      id: backendReviewId || `rev-${Date.now()}`,
      productId: data.productId,
      author: data.customerName || 'Verified Customer',
      rating: data.rating,
      date: new Date().toISOString().split('T')[0],
      title: data.title,
      comment: data.comment,
      verified: true,
      productName: data.revealedItem || 'Surprise Reveal',
      revealedSurprise: data.revealedItem,
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
        const existing: Review[] = stored ? JSON.parse(stored) : MOCK_REVIEWS;
        const updated = [newReview, ...existing];
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    return newReview;
  },
};

