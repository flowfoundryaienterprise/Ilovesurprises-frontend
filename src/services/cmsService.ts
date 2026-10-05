import { apiClient } from './apiClient';

export interface StorefrontShowcaseCard {
  id: string;
  cardKey: string;
  displayTitle: string;
  highlightBadge: string;
  tagline: string;
  ctaButtonText: string;
  targetCategoryKey: string;
  showcaseImageUri: string;
  displayOnHomepage: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface StorefrontBanners {
  topStickyAnnouncementBar: {
    isActive: boolean;
    announcementCopy: string;
  };
  promotionalDiscountAlertBar: {
    isActive: boolean;
    promoCopy: string;
    promoCode: string;
  };
}

export interface StorefrontConfig {
  showcaseCards: StorefrontShowcaseCard[];
  banners: StorefrontBanners;
}

export const cmsService = {
  /**
   * Fetches live storefront homepage configuration (banners and showcase cards)
   * Primary endpoint: GET /api/storefront
   */
  async getStorefront(): Promise<StorefrontConfig | null> {
    try {
      const response = await apiClient.get<{
        status: string;
        data: StorefrontConfig;
      }>('/api/storefront', { skipAuth: true });

      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.warn('[CmsService] Failed to fetch live /api/storefront:', err);
      return null;
    }
  },

  /**
   * Fetches active storewide banners
   */
  async getBanners(): Promise<StorefrontBanners | null> {
    try {
      const response = await apiClient.get<{
        status: string;
        data: { banners: StorefrontBanners };
      }>('/api/storefront/banners', { skipAuth: true });

      return response.data?.banners || null;
    } catch {
      const sf = await this.getStorefront();
      return sf?.banners || null;
    }
  },

  /**
   * Fetches complete storefront configuration for admin editing
   */
  async getAdminStorefront(): Promise<StorefrontConfig | null> {
    try {
      const response = await apiClient.get<{
        status: string;
        data: StorefrontConfig;
      }>('/api/admin/storefront');

      return response.data || null;
    } catch (err) {
      console.warn('[CmsService] Failed to fetch /api/admin/storefront:', err);
      return this.getStorefront();
    }
  },

  /**
   * Updates storewide announcement and promo discount banners
   */
  async updateBanners(banners: Partial<StorefrontBanners>): Promise<boolean> {
    try {
      await apiClient.patch('/api/admin/storefront/banners', banners);
      window.dispatchEvent(new CustomEvent('ils_storefront_updated'));
      return true;
    } catch (err) {
      console.error('[CmsService] Failed to update /api/admin/storefront/banners:', err);
      return false;
    }
  },

  /**
   * Updates a showcase product card by key
   */
  async updateShowcaseCard(
    cardKey: string,
    updates: Partial<StorefrontShowcaseCard>
  ): Promise<boolean> {
    try {
      await apiClient.patch(`/api/admin/storefront/showcase/${encodeURIComponent(cardKey)}`, updates);
      window.dispatchEvent(new CustomEvent('ils_storefront_updated'));
      return true;
    } catch (err) {
      console.error(`[CmsService] Failed to update showcase card "${cardKey}":`, err);
      return false;
    }
  },

  /**
   * Fallback mock/custom page handler
   */
  async getPage(_slug: string): Promise<any | null> {
    return null;
  },

  /**
   * Fallback mock/custom navigation handler
   */
  async getNavigation(): Promise<any[]> {
    return [];
  },
};
