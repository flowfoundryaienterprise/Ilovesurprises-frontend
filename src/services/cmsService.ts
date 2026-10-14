/**
 * Storefront content service (homepage showcase cards and storewide banners).
 *
 * `GET /api/storefront` is the single source of truth for this content. There
 * is deliberately no local mirror and no mock fallback: two sources would let
 * the public homepage and the admin editor disagree, and a mock fallback would
 * show content that is not in the database.
 *
 * Admin writes go to `PATCH /api/admin/storefront/*` and are only reported as
 * saved once the server confirms them.
 */

import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';

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

/**
 * Banner update payload. Mirrors `updateStorefrontBannersSchema` on the
 * backend, where both bars and every field within them are optional, so a
 * caller can patch a single value.
 */
export interface UpdateStorefrontBannersInput {
  topStickyAnnouncementBar?: Partial<StorefrontBanners['topStickyAnnouncementBar']>;
  promotionalDiscountAlertBar?: Partial<StorefrontBanners['promotionalDiscountAlertBar']>;
}

/** Event emitted after a confirmed server-side storefront change. */
export const STOREFRONT_UPDATED_EVENT = 'ils_storefront_updated';

function emitStorefrontUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STOREFRONT_UPDATED_EVENT));
}

/**
 * The backend validates `showcaseImageUri` with `z.string().url()`, so only
 * absolute URLs are accepted. Relative asset paths are resolved against the
 * current origin; anything else returns null so the caller can report a clear
 * validation message rather than letting the request 400.
 */
function toAbsoluteImageUrl(value: string | undefined | null): string | null {
  const raw = (value || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/') && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${raw}`;
  }
  return null;
}

/** Sorts cards the way the homepage renders them. */
function sortCards(cards: StorefrontShowcaseCard[]): StorefrontShowcaseCard[] {
  return [...cards].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export const cmsService = {
  /**
   * Public storefront configuration. Errors propagate so callers can decide
   * between a retry and rendering their own empty/error state — never silently
   * substituting placeholder content.
   */
  async getStorefront(options?: { signal?: AbortSignal }): Promise<StorefrontConfig> {
    const response = await apiClient.get<ApiResponse<StorefrontConfig>>(
      '/api/storefront',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<StorefrontConfig>(response, '/api/storefront');

    return {
      showcaseCards: sortCards(data.showcaseCards || []),
      banners: data.banners,
    };
  },

  /** Active storewide banners. */
  async getBanners(options?: { signal?: AbortSignal }): Promise<StorefrontBanners> {
    const response = await apiClient.get<ApiResponse<StorefrontBanners>>(
      '/api/storefront/banners',
      undefined,
      { signal: options?.signal }
    );
    return unwrap<StorefrontBanners>(response, '/api/storefront/banners');
  },

  /** Public showcase cards only. */
  async getShowcaseCards(options?: {
    signal?: AbortSignal;
  }): Promise<StorefrontShowcaseCard[]> {
    const response = await apiClient.get<
      ApiResponse<{ showcaseCards?: StorefrontShowcaseCard[] } | StorefrontShowcaseCard[]>
    >('/api/storefront/showcase', undefined, { signal: options?.signal });

    const data = unwrap<{ showcaseCards?: StorefrontShowcaseCard[] } | StorefrontShowcaseCard[]>(
      response,
      '/api/storefront/showcase'
    );

    const cards = Array.isArray(data) ? data : data.showcaseCards || [];
    return sortCards(cards);
  },

  /**
   * Full configuration for admin editing, including inactive and hidden cards.
   * Requires an ADMIN token.
   */
  async getAdminStorefront(options?: {
    signal?: AbortSignal;
  }): Promise<StorefrontConfig> {
    const response = await apiClient.get<ApiResponse<StorefrontConfig>>(
      '/api/admin/storefront',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<StorefrontConfig>(response, '/api/admin/storefront');

    return {
      showcaseCards: sortCards(data.showcaseCards || []),
      banners: data.banners,
    };
  },

  /**
   * Updates the storewide banners via `PATCH /api/admin/storefront/banners`.
   *
   * Throws on failure. The previous implementation caught the error, wrote the
   * change to localStorage, and returned true — reporting a save that never
   * reached the database.
   */
  async updateBanners(banners: UpdateStorefrontBannersInput): Promise<StorefrontBanners> {
    const response = await apiClient.patch<
      ApiResponse<{ banners?: StorefrontBanners } | StorefrontBanners>
    >('/api/admin/storefront/banners', banners);

    const data = unwrap<{ banners?: StorefrontBanners } | StorefrontBanners>(
      response,
      '/api/admin/storefront/banners'
    );

    emitStorefrontUpdated();

    const updated = (data as { banners?: StorefrontBanners }).banners;
    return updated ?? (data as StorefrontBanners);
  },

  /**
   * Updates a showcase card via `PATCH /api/admin/storefront/showcase/:cardKey`.
   * Throws on failure so the admin never sees an unsaved change as saved.
   */
  async updateShowcaseCard(
    cardKey: string,
    updates: Partial<StorefrontShowcaseCard>
  ): Promise<StorefrontShowcaseCard> {
    if (!cardKey) {
      throw new ApiError('A card key is required.', 400, 'validation');
    }

    const body: Record<string, any> = {};

    if (updates.displayTitle !== undefined) body.displayTitle = updates.displayTitle;
    if (updates.highlightBadge !== undefined) body.highlightBadge = updates.highlightBadge;
    if (updates.tagline !== undefined) body.tagline = updates.tagline;
    if (updates.ctaButtonText !== undefined) body.ctaButtonText = updates.ctaButtonText;
    if (updates.targetCategoryKey !== undefined) {
      body.targetCategoryKey = updates.targetCategoryKey;
    }
    if (updates.displayOnHomepage !== undefined) {
      body.displayOnHomepage = updates.displayOnHomepage;
    }
    if (updates.isActive !== undefined) body.isActive = updates.isActive;
    if (updates.sortOrder !== undefined) body.sortOrder = Number(updates.sortOrder);

    if (updates.showcaseImageUri !== undefined) {
      const imageUrl = toAbsoluteImageUrl(updates.showcaseImageUri);
      if (!imageUrl) {
        throw new ApiError(
          'The showcase image must be an absolute URL (for example https://...). Upload the image first, then save the URL it returns.',
          400,
          'validation'
        );
      }
      body.showcaseImageUri = imageUrl;
    }

    const response = await apiClient.patch<
      ApiResponse<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>
    >(`/api/admin/storefront/showcase/${encodeURIComponent(cardKey)}`, body);

    const data = unwrap<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>(
      response,
      `/api/admin/storefront/showcase/${cardKey}`
    );

    emitStorefrontUpdated();

    const updated = (data as { showcaseCard?: StorefrontShowcaseCard }).showcaseCard;
    return updated ?? (data as StorefrontShowcaseCard);
  },

  /**
   * Custom CMS pages: the backend has a `cms_pages` table but exposes no
   * route, so there is nothing to fetch.
   */
  async getPage(_slug: string): Promise<null> {
    return null;
  },

  /**
   * Custom navigation: the backend has a `cms_navigation_items` table but
   * exposes no route. Navigation is rendered from the shipped configuration.
   */
  async getNavigation(): Promise<never[]> {
    return [];
  },
};
