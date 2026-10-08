const WISHLIST_STORAGE_KEY = 'ilovesurprises_wishlist_v1';

export const wishlistService = {
  async getWishlist(): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // fallback
    }
    return [];
  },

  async addToWishlist(productId: string): Promise<boolean> {
    const list = await this.getWishlist();
    if (!list.includes(productId)) {
      const updated = [...list, productId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('ils_wishlist_updated'));
        } catch {
          // ignore
        }
      }
    }
    return true;
  },

  async removeFromWishlist(productId: string): Promise<boolean> {
    const list = await this.getWishlist();
    const updated = list.filter((id) => id !== productId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_wishlist_updated'));
      } catch {
        // ignore
      }
    }
    return true;
  },
};
