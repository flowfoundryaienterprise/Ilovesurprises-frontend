import { apiClient, type ApiResponse } from './apiClient';
import { MOCK_STOREFRONT_CONFIG } from '../data/mockData';

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

const CMS_STORAGE_KEY = 'ils_cms_storefront_v1';

export const cmsService = {
  /**
   * Fetches storefront homepage configuration (banners and showcase cards)
   * Connects to backend GET /api/storefront with fallback to local storage
   */
  async getStorefront(): Promise<StorefrontConfig | null> {
    try {
      const response = await apiClient.get<ApiResponse<StorefrontConfig>>('/api/storefront');
      const data = response?.data || (response as any);
      if (data?.showcaseCards && data?.banners) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend storefront fetch failed, using local cache:', err);
    }

    if (typeof window === 'undefined') return MOCK_STOREFRONT_CONFIG;
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(MOCK_STOREFRONT_CONFIG));
      return MOCK_STOREFRONT_CONFIG;
    } catch {
      return MOCK_STOREFRONT_CONFIG;
    }
  },

  /**
   * Fetches active storewide banners
   * Connects to backend GET /api/storefront/banners with fallback
   */
  async getBanners(): Promise<StorefrontBanners | null> {
    try {
      const response = await apiClient.get<ApiResponse<StorefrontBanners>>('/api/storefront/banners');
      const data = response?.data || (response as any);
      if (data?.topStickyAnnouncementBar || data?.promotionalDiscountAlertBar) {
        return data;
      }
    } catch {
      // fallback to getStorefront()
    }
    const sf = await this.getStorefront();
    return sf?.banners || MOCK_STOREFRONT_CONFIG.banners;
  },

  /**
   * Fetches complete storefront configuration for admin editing
   */
  async getAdminStorefront(): Promise<StorefrontConfig | null> {
    try {
      const response = await apiClient.get<ApiResponse<StorefrontConfig>>('/api/admin/storefront');
      const data = response?.data || (response as any);
      if (data?.showcaseCards && data?.banners) {
        return data;
      }
    } catch {
      // fallback
    }
    return this.getStorefront();
  },

  /**
   * Updates storewide announcement and promo discount banners
   * Connects to backend PATCH /api/admin/storefront/banners with local sync
   */
  async updateBanners(banners: Partial<StorefrontBanners>): Promise<boolean> {
    const current = (await this.getStorefront()) || MOCK_STOREFRONT_CONFIG;
    const updated: StorefrontConfig = {
      ...current,
      banners: {
        ...current.banners,
        ...banners,
      },
    };

    try {
      await apiClient.patch('/api/admin/storefront/banners', banners);
    } catch (err) {
      console.warn('Backend banners update failed, saving locally:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_storefront_updated'));
      } catch (err) {
        console.warn('Failed to save banners to localStorage:', err);
      }
    }
    return true;
  },

  /**
   * Updates a showcase product card by key
   * Connects to backend PATCH /api/admin/storefront/showcase/:cardKey with local sync
   */
  async updateShowcaseCard(
    cardKey: string,
    updates: Partial<StorefrontShowcaseCard>
  ): Promise<boolean> {
    const current = (await this.getStorefront()) || MOCK_STOREFRONT_CONFIG;
    const updatedCards = current.showcaseCards.map((c) =>
      c.cardKey === cardKey || c.id === cardKey ? { ...c, ...updates } : c
    );

    const updated: StorefrontConfig = {
      ...current,
      showcaseCards: updatedCards,
    };

    try {
      await apiClient.patch(`/api/admin/storefront/showcase/${encodeURIComponent(cardKey)}`, updates);
    } catch (err) {
      console.warn(`Backend showcase card update failed for ${cardKey}, saving locally:`, err);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_storefront_updated'));
      } catch (err) {
        console.warn('Failed to save showcase card to localStorage:', err);
      }
    }
    return true;
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

