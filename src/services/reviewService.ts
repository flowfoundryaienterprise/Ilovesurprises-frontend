import { apiClient } from './apiClient';
import type { Review } from '../types';

export const reviewService = {
  async getProductReviews(productId: string): Promise<{
    reviews: Review[];
    stats: { averageRating: number; totalReviews: number; breakdown: Record<number, number> };
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          reviews: any[];
          stats: { averageRating: number; totalReviews: number; breakdown: Record<number, number> };
        };
      }>(`/api/reviews/product/${productId}`);

      const reviews: Review[] = response.data.reviews.map((r: any) => ({
        id: r.id,
        productId: r.productId,
        author: r.customerName || (r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : 'Verified Customer'),
        rating: r.rating,
        date: r.createdAt ? r.createdAt.split('T')[0] : 'Recent',
        title: r.title,
        comment: r.comment,
        verified: Boolean(r.isVerifiedPurchase),
        productName: r.revealedItem || 'Surprise Reveal',
        revealedSurprise: r.revealedItem,
      }));

      return { reviews, stats: response.data.stats };
    } catch {
      return {
        reviews: [],
        stats: { averageRating: 5.0, totalReviews: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      };
    }
  },

  async createReview(data: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
    customerName: string;
    surpriseType?: string;
    revealedItem?: string;
  }): Promise<Review> {
    const response = await apiClient.post<{
      success: boolean;
      data: { review: any };
    }>('/api/reviews', data);

    const r = response.data.review;
    return {
      id: r.id,
      productId: r.productId,
      author: r.customerName,
      rating: r.rating,
      date: new Date().toISOString().split('T')[0],
      title: r.title,
      comment: r.comment,
      verified: Boolean(r.isVerifiedPurchase),
      productName: r.revealedItem || 'Surprise Reveal',
      revealedSurprise: r.revealedItem,
    };
  },
};
