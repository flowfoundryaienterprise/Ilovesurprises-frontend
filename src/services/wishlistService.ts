import { apiClient } from './apiClient';

export const wishlistService = {
  async getWishlist(): Promise<string[]> {
    const token = apiClient.getAuthToken();
    if (!token) return [];
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { productIds: string[] };
      }>('/api/wishlist');
      return response.data?.productIds || [];
    } catch {
      return [];
    }
  },

  async addToWishlist(productId: string): Promise<boolean> {
    const token = apiClient.getAuthToken();
    if (!token) return false;
    try {
      await apiClient.post('/api/wishlist', { productId });
      return true;
    } catch {
      return false;
    }
  },

  async removeFromWishlist(productId: string): Promise<boolean> {
    const token = apiClient.getAuthToken();
    if (!token) return false;
    try {
      await apiClient.delete(`/api/wishlist/${productId}`);
      return true;
    } catch {
      return false;
    }
  },
};
