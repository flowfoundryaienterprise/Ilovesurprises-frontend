/**
 * Storefront content service (Hero, Showcase Cards, Banners, Value Proposition,
 * About Story, FAQ Catalog, Footer, and Image Upload Engine).
 *
 * `GET /api/storefront` is the public source of truth for homepage content.
 * `GET /api/admin/storefront` returns the full configuration for admin editing.
 * Bulk publishing updates all sections via `PUT /api/admin/storefront`.
 * Default settings can be restored via `POST /api/admin/storefront/reset`.
 * Individual section mutations are available via granular REST endpoints.
 */

import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';
import type {
  HeroBenefitTile,
  HeroContentConfig,
  ValuePropositionConfig,
  AboutContentConfig,
  FaqContentItem,
  FooterContentConfig,
  HomepageFeaturedCard,
} from '../types/admin';

export type {
  HeroBenefitTile,
  HeroContentConfig,
  ValuePropositionConfig,
  AboutContentConfig,
  FaqContentItem,
  FooterContentConfig,
  HomepageFeaturedCard,
};

// --- DATA STRUCTURES & DTOS ---

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
  itemCount?: number;
  accentBorder?: string;
  // Aliases for compatibility
  title?: string;
  badge?: string;
  categoryKey?: string;
  ctaText?: string;
  image?: string;
  active?: boolean;
}

export interface TopStickyAnnouncementBar {
  isActive: boolean;
  announcementCopy: string;
  announcementLink?: string;
}

export interface PromotionalDiscountAlertBar {
  isActive: boolean;
  promoCopy: string;
  promoCode: string;
}

export interface StorefrontBanners {
  topStickyAnnouncementBar: TopStickyAnnouncementBar;
  promotionalDiscountAlertBar: PromotionalDiscountAlertBar;
}

export interface StorefrontConfig {
  hero?: HeroContentConfig;
  showcaseCards: StorefrontShowcaseCard[];
  featuredCards?: HomepageFeaturedCard[];
  banners: StorefrontBanners;
  valueProposition?: ValuePropositionConfig;
  aboutContent?: AboutContentConfig;
  faqItems?: FaqContentItem[];
  footerContent?: FooterContentConfig;
  announcementText?: string;
  announcementActive?: boolean;
  announcementLink?: string;
  promoBannerText?: string;
  promoBannerCode?: string;
  promoBannerActive?: boolean;
}

// --- UPDATE & MUTATION INPUTS ---

export interface UpdateHeroInput {
  desktopBannerImage?: string;
  mobileBannerImage?: string;
  headline?: string;
  subheadline?: string;
  benefitTiles?: HeroBenefitTile[];
}

export interface CreateHeroBenefitTileInput {
  id?: string;
  title: string;
  subtitle: string;
  iconName?: string;
  actionType?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateHeroBenefitTileInput {
  title?: string;
  subtitle?: string;
  iconName?: string;
  actionType?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateShowcaseCardInput {
  id?: string;
  cardKey: string;
  displayTitle?: string;
  title?: string;
  highlightBadge?: string;
  badge?: string;
  tagline?: string;
  ctaButtonText?: string;
  ctaText?: string;
  targetCategoryKey?: string;
  categoryKey?: string;
  showcaseImageUri?: string;
  image?: string;
  displayOnHomepage?: boolean;
  isActive?: boolean;
  active?: boolean;
  sortOrder?: number;
  itemCount?: number;
  accentBorder?: string;
}

export interface UpdateShowcaseCardInput {
  cardKey?: string;
  displayTitle?: string;
  title?: string;
  highlightBadge?: string;
  badge?: string;
  tagline?: string;
  ctaButtonText?: string;
  ctaText?: string;
  targetCategoryKey?: string;
  categoryKey?: string;
  showcaseImageUri?: string;
  image?: string;
  displayOnHomepage?: boolean;
  isActive?: boolean;
  active?: boolean;
  sortOrder?: number;
  itemCount?: number;
  accentBorder?: string;
}

export interface UpdateStorefrontBannersInput {
  topStickyAnnouncementBar?: Partial<TopStickyAnnouncementBar>;
  promotionalDiscountAlertBar?: Partial<PromotionalDiscountAlertBar>;
  announcementText?: string;
  announcementActive?: boolean;
  announcementLink?: string;
  promoBannerText?: string;
  promoBannerCode?: string;
  promoBannerActive?: boolean;
}

export interface UpdateValuePropositionInput {
  eyebrow?: string;
  title?: string;
  description?: string;
  points?: string[];
}

export interface UpdateAboutContentInput {
  badge?: string;
  headline?: string;
  storyText?: string;
  naturalSoyStat?: string;
  unboxingsStat?: string;
  realCashStat?: string;
}

export interface CreateFaqItemInput {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateFaqItemInput {
  question?: string;
  answer?: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateFooterContentInput {
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  copyrightText?: string;
  supportEmail?: string;
  supportPhone?: string;
  guaranteeText?: string;
}

export interface UpdateFullHomepageContentInput {
  announcementText?: string;
  announcementActive?: boolean;
  announcementLink?: string;
  promoBannerText?: string;
  promoBannerCode?: string;
  promoBannerActive?: boolean;
  banners?: UpdateStorefrontBannersInput;
  featuredCards?: (StorefrontShowcaseCard | HomepageFeaturedCard)[];
  showcaseCards?: StorefrontShowcaseCard[];
  hero?: UpdateHeroInput;
  valueProposition?: UpdateValuePropositionInput;
  aboutContent?: UpdateAboutContentInput;
  faqItems?: FaqContentItem[];
  footerContent?: UpdateFooterContentInput;
}

export interface UploadImageResult {
  url: string;
  absoluteUrl: string;
  filename?: string;
  size?: number;
  mimetype?: string;
}

/** Event emitted after a confirmed server-side storefront change. */
export const STOREFRONT_UPDATED_EVENT = 'ils_storefront_updated';

function emitStorefrontUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STOREFRONT_UPDATED_EVENT));
}

/**
 * Validates and ensures image URLs are absolute or valid paths.
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
  // =========================================================================
  // 1. Full Storefront & Bulk Publishing
  // =========================================================================

  /**
   * Public storefront configuration (GET /api/storefront).
   */
  async getStorefront(options?: { signal?: AbortSignal }): Promise<StorefrontConfig> {
    const response = await apiClient.get<ApiResponse<StorefrontConfig>>(
      '/api/storefront',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<StorefrontConfig>(response, '/api/storefront');

    return {
      ...data,
      showcaseCards: sortCards(data.showcaseCards || []),
    };
  },

  /**
   * Full configuration for admin editing, including drafts and hidden items (GET /api/admin/storefront).
   * Requires an ADMIN token.
   */
  async getAdminStorefront(options?: { signal?: AbortSignal }): Promise<StorefrontConfig> {
    const response = await apiClient.get<ApiResponse<StorefrontConfig>>(
      '/api/admin/storefront',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<StorefrontConfig>(response, '/api/admin/storefront');

    return {
      ...data,
      showcaseCards: sortCards(data.showcaseCards || []),
    };
  },

  /**
   * Bulk updates all storefront sections simultaneously (PUT /api/admin/storefront).
   * Matches "Publish to Storefront" action button.
   */
  async updateFullStorefront(
    content: UpdateFullHomepageContentInput
  ): Promise<StorefrontConfig> {
    const response = await apiClient.put<ApiResponse<StorefrontConfig> | StorefrontConfig>(
      '/api/admin/storefront',
      content
    );
    const data = unwrap<StorefrontConfig>(response, '/api/admin/storefront');
    emitStorefrontUpdated();
    return {
      ...data,
      showcaseCards: sortCards(data.showcaseCards || []),
    };
  },

  /**
   * Resets all storefront content to system factory defaults (POST /api/admin/storefront/reset).
   * Matches "Reset Defaults" action button.
   */
  async resetStorefrontDefaults(): Promise<StorefrontConfig> {
    const response = await apiClient.post<ApiResponse<StorefrontConfig> | StorefrontConfig>(
      '/api/admin/storefront/reset',
      {}
    );
    const data = unwrap<StorefrontConfig>(response, '/api/admin/storefront/reset');
    emitStorefrontUpdated();
    return {
      ...data,
      showcaseCards: sortCards(data.showcaseCards || []),
    };
  },

  // =========================================================================
  // 2. Tab 1: Hero & Benefit Quick-Action Tiles
  // =========================================================================

  /** Gets hero images, headline copy, and benefit tiles (GET /api/storefront/hero). */
  async getHero(options?: { signal?: AbortSignal }): Promise<HeroContentConfig> {
    const response = await apiClient.get<ApiResponse<{ hero?: HeroContentConfig } | HeroContentConfig>>(
      '/api/storefront/hero',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<{ hero?: HeroContentConfig } | HeroContentConfig>(
      response,
      '/api/storefront/hero'
    );
    return (data as { hero?: HeroContentConfig }).hero ?? (data as HeroContentConfig);
  },

  /** Updates hero banner images and headline copy (PATCH /api/admin/storefront/hero). */
  async updateHero(hero: UpdateHeroInput): Promise<HeroContentConfig> {
    const response = await apiClient.patch<ApiResponse<{ hero?: HeroContentConfig } | HeroContentConfig>>(
      '/api/admin/storefront/hero',
      hero
    );
    const data = unwrap<{ hero?: HeroContentConfig } | HeroContentConfig>(
      response,
      '/api/admin/storefront/hero'
    );
    emitStorefrontUpdated();
    return (data as { hero?: HeroContentConfig }).hero ?? (data as HeroContentConfig);
  },

  /** Gets all hero benefit tiles (GET /api/storefront/hero/tiles). */
  async getBenefitTiles(options?: { signal?: AbortSignal }): Promise<HeroBenefitTile[]> {
    const response = await apiClient.get<ApiResponse<{ benefitTiles?: HeroBenefitTile[] } | HeroBenefitTile[]>>(
      '/api/storefront/hero/tiles',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<{ benefitTiles?: HeroBenefitTile[] } | HeroBenefitTile[]>(
      response,
      '/api/storefront/hero/tiles'
    );
    const tiles = Array.isArray(data) ? data : data.benefitTiles || [];
    return [...tiles].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },

  /** Gets a single benefit tile by ID (GET /api/storefront/hero/tiles/:id). */
  async getBenefitTileById(id: string): Promise<HeroBenefitTile> {
    const response = await apiClient.get<ApiResponse<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>>(
      `/api/storefront/hero/tiles/${encodeURIComponent(id)}`
    );
    const data = unwrap<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>(
      response,
      `/api/storefront/hero/tiles/${id}`
    );
    return (data as { benefitTile?: HeroBenefitTile }).benefitTile ?? (data as HeroBenefitTile);
  },

  /** Creates a new benefit quick-action tile (POST /api/admin/storefront/hero/tiles). */
  async createBenefitTile(tile: CreateHeroBenefitTileInput): Promise<HeroBenefitTile> {
    const response = await apiClient.post<ApiResponse<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>>(
      '/api/admin/storefront/hero/tiles',
      tile
    );
    const data = unwrap<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>(
      response,
      '/api/admin/storefront/hero/tiles'
    );
    emitStorefrontUpdated();
    return (data as { benefitTile?: HeroBenefitTile }).benefitTile ?? (data as HeroBenefitTile);
  },

  /** Updates an existing benefit tile (PATCH /api/admin/storefront/hero/tiles/:id). */
  async updateBenefitTile(id: string, updates: UpdateHeroBenefitTileInput): Promise<HeroBenefitTile> {
    const response = await apiClient.patch<ApiResponse<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>>(
      `/api/admin/storefront/hero/tiles/${encodeURIComponent(id)}`,
      updates
    );
    const data = unwrap<{ benefitTile?: HeroBenefitTile } | HeroBenefitTile>(
      response,
      `/api/admin/storefront/hero/tiles/${id}`
    );
    emitStorefrontUpdated();
    return (data as { benefitTile?: HeroBenefitTile }).benefitTile ?? (data as HeroBenefitTile);
  },

  /** Deletes a benefit tile (DELETE /api/admin/storefront/hero/tiles/:id). */
  async deleteBenefitTile(id: string): Promise<{ success: boolean; id: string }> {
    const response = await apiClient.delete<ApiResponse<{ id?: string } | any>>(
      `/api/admin/storefront/hero/tiles/${encodeURIComponent(id)}`
    );
    unwrap(response, `/api/admin/storefront/hero/tiles/${id}`);
    emitStorefrontUpdated();
    return { success: true, id };
  },

  // =========================================================================
  // 3. Tab 2: Priority Collections (Showcase Cards CRUD)
  // =========================================================================

  /** Public showcase cards only (GET /api/storefront/showcase). */
  async getShowcaseCards(options?: { signal?: AbortSignal }): Promise<StorefrontShowcaseCard[]> {
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

  /** Gets single showcase card by key or ID (GET /api/storefront/showcase/:cardKey). */
  async getShowcaseCard(cardKey: string): Promise<StorefrontShowcaseCard> {
    const response = await apiClient.get<
      ApiResponse<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>
    >(`/api/storefront/showcase/${encodeURIComponent(cardKey)}`);

    const data = unwrap<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>(
      response,
      `/api/storefront/showcase/${cardKey}`
    );
    return (data as { showcaseCard?: StorefrontShowcaseCard }).showcaseCard ?? (data as StorefrontShowcaseCard);
  },

  /** Creates a new showcase card (POST /api/admin/storefront/showcase). */
  async createShowcaseCard(card: CreateShowcaseCardInput): Promise<StorefrontShowcaseCard> {
    if (card.showcaseImageUri) {
      const imageUrl = toAbsoluteImageUrl(card.showcaseImageUri);
      if (imageUrl) {
        card.showcaseImageUri = imageUrl;
      }
    }
    const response = await apiClient.post<
      ApiResponse<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>
    >('/api/admin/storefront/showcase', card);

    const data = unwrap<{ showcaseCard?: StorefrontShowcaseCard } | StorefrontShowcaseCard>(
      response,
      '/api/admin/storefront/showcase'
    );
    emitStorefrontUpdated();
    return (data as { showcaseCard?: StorefrontShowcaseCard }).showcaseCard ?? (data as StorefrontShowcaseCard);
  },

  /**
   * Updates a showcase card via `PATCH /api/admin/storefront/showcase/:cardKey`.
   * Throws on failure so the admin never sees an unsaved change as saved.
   */
  async updateShowcaseCard(
    cardKey: string,
    updates: UpdateShowcaseCardInput
  ): Promise<StorefrontShowcaseCard> {
    if (!cardKey) {
      throw new ApiError('A card key is required.', 400, 'validation');
    }

    const body: Record<string, any> = {};

    if (updates.displayTitle !== undefined) body.displayTitle = updates.displayTitle;
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.highlightBadge !== undefined) body.highlightBadge = updates.highlightBadge;
    if (updates.badge !== undefined) body.badge = updates.badge;
    if (updates.tagline !== undefined) body.tagline = updates.tagline;
    if (updates.ctaButtonText !== undefined) body.ctaButtonText = updates.ctaButtonText;
    if (updates.ctaText !== undefined) body.ctaText = updates.ctaText;
    if (updates.targetCategoryKey !== undefined) {
      body.targetCategoryKey = updates.targetCategoryKey;
    }
    if (updates.categoryKey !== undefined) {
      body.categoryKey = updates.categoryKey;
    }
    if (updates.displayOnHomepage !== undefined) {
      body.displayOnHomepage = updates.displayOnHomepage;
    }
    if (updates.isActive !== undefined) body.isActive = updates.isActive;
    if (updates.active !== undefined) body.active = updates.active;
    if (updates.sortOrder !== undefined) body.sortOrder = Number(updates.sortOrder);
    if (updates.itemCount !== undefined) body.itemCount = Number(updates.itemCount);
    if (updates.accentBorder !== undefined) body.accentBorder = updates.accentBorder;

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
    } else if (updates.image !== undefined) {
      const imageUrl = toAbsoluteImageUrl(updates.image);
      if (imageUrl) {
        body.showcaseImageUri = imageUrl;
      }
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

  /** Deletes a showcase card (DELETE /api/admin/storefront/showcase/:cardKey). */
  async deleteShowcaseCard(cardKey: string): Promise<{ success: boolean; cardKey: string }> {
    const response = await apiClient.delete<ApiResponse<{ cardKey?: string } | any>>(
      `/api/admin/storefront/showcase/${encodeURIComponent(cardKey)}`
    );
    unwrap(response, `/api/admin/storefront/showcase/${cardKey}`);
    emitStorefrontUpdated();
    return { success: true, cardKey };
  },

  // =========================================================================
  // 4. Tab 3: Announcements & Promo Discount Bar
  // =========================================================================

  /** Active storewide banners (GET /api/storefront/banners). */
  async getBanners(options?: { signal?: AbortSignal }): Promise<StorefrontBanners> {
    const response = await apiClient.get<ApiResponse<{ banners?: StorefrontBanners } | StorefrontBanners>>(
      '/api/storefront/banners',
      undefined,
      { signal: options?.signal }
    );
    const data = unwrap<{ banners?: StorefrontBanners } | StorefrontBanners>(
      response,
      '/api/storefront/banners'
    );
    return (data as { banners?: StorefrontBanners }).banners ?? (data as StorefrontBanners);
  },

  /** Updates storewide banners (PATCH /api/admin/storefront/banners). */
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

  // =========================================================================
  // 5. Tab 4: Value Proposition & Guarantees
  // =========================================================================

  /** Gets value proposition copy and points (GET /api/storefront/value-proposition). */
  async getValueProposition(options?: { signal?: AbortSignal }): Promise<ValuePropositionConfig> {
    const response = await apiClient.get<
      ApiResponse<{ valueProposition?: ValuePropositionConfig } | ValuePropositionConfig>
    >('/api/storefront/value-proposition', undefined, { signal: options?.signal });

    const data = unwrap<{ valueProposition?: ValuePropositionConfig } | ValuePropositionConfig>(
      response,
      '/api/storefront/value-proposition'
    );
    return (data as { valueProposition?: ValuePropositionConfig }).valueProposition ?? (data as ValuePropositionConfig);
  },

  /** Updates value proposition copy and points (PATCH /api/admin/storefront/value-proposition). */
  async updateValueProposition(
    valueProp: UpdateValuePropositionInput
  ): Promise<ValuePropositionConfig> {
    const response = await apiClient.patch<
      ApiResponse<{ valueProposition?: ValuePropositionConfig } | ValuePropositionConfig>
    >('/api/admin/storefront/value-proposition', valueProp);

    const data = unwrap<{ valueProposition?: ValuePropositionConfig } | ValuePropositionConfig>(
      response,
      '/api/admin/storefront/value-proposition'
    );
    emitStorefrontUpdated();
    return (data as { valueProposition?: ValuePropositionConfig }).valueProposition ?? (data as ValuePropositionConfig);
  },

  // =========================================================================
  // 6. Tab 5: About Brand Story & Craftsmanship
  // =========================================================================

  /** Gets brand story, badge, and proof statistics (GET /api/storefront/about). */
  async getAboutContent(options?: { signal?: AbortSignal }): Promise<AboutContentConfig> {
    const response = await apiClient.get<
      ApiResponse<{ aboutContent?: AboutContentConfig } | AboutContentConfig>
    >('/api/storefront/about', undefined, { signal: options?.signal });

    const data = unwrap<{ aboutContent?: AboutContentConfig } | AboutContentConfig>(
      response,
      '/api/storefront/about'
    );
    return (data as { aboutContent?: AboutContentConfig }).aboutContent ?? (data as AboutContentConfig);
  },

  /** Updates brand story and statistics (PATCH /api/admin/storefront/about). */
  async updateAboutContent(about: UpdateAboutContentInput): Promise<AboutContentConfig> {
    const response = await apiClient.patch<
      ApiResponse<{ aboutContent?: AboutContentConfig } | AboutContentConfig>
    >('/api/admin/storefront/about', about);

    const data = unwrap<{ aboutContent?: AboutContentConfig } | AboutContentConfig>(
      response,
      '/api/admin/storefront/about'
    );
    emitStorefrontUpdated();
    return (data as { aboutContent?: AboutContentConfig }).aboutContent ?? (data as AboutContentConfig);
  },

  // =========================================================================
  // 7. Tab 6: FAQ Catalog CRUD
  // =========================================================================

  /** Gets all FAQs, optionally filtered by category (GET /api/storefront/faqs). */
  async getFaqs(category?: string, options?: { signal?: AbortSignal }): Promise<FaqContentItem[]> {
    const params = category ? { category } : undefined;
    const response = await apiClient.get<ApiResponse<{ faqItems?: FaqContentItem[] } | FaqContentItem[]>>(
      '/api/storefront/faqs',
      params,
      { signal: options?.signal }
    );
    const data = unwrap<{ faqItems?: FaqContentItem[] } | FaqContentItem[]>(
      response,
      '/api/storefront/faqs'
    );
    const faqs = Array.isArray(data) ? data : data.faqItems || [];
    return [...faqs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },

  /** Gets single FAQ item by ID (GET /api/storefront/faqs/:id). */
  async getFaqById(id: string): Promise<FaqContentItem> {
    const response = await apiClient.get<ApiResponse<{ faqItem?: FaqContentItem } | FaqContentItem>>(
      `/api/storefront/faqs/${encodeURIComponent(id)}`
    );
    const data = unwrap<{ faqItem?: FaqContentItem } | FaqContentItem>(
      response,
      `/api/storefront/faqs/${id}`
    );
    return (data as { faqItem?: FaqContentItem }).faqItem ?? (data as FaqContentItem);
  },

  /** Adds a new question to the FAQ Catalog (POST /api/admin/storefront/faqs). */
  async createFaq(faq: CreateFaqItemInput): Promise<FaqContentItem> {
    const response = await apiClient.post<ApiResponse<{ faqItem?: FaqContentItem } | FaqContentItem>>(
      '/api/admin/storefront/faqs',
      faq
    );
    const data = unwrap<{ faqItem?: FaqContentItem } | FaqContentItem>(
      response,
      '/api/admin/storefront/faqs'
    );
    emitStorefrontUpdated();
    return (data as { faqItem?: FaqContentItem }).faqItem ?? (data as FaqContentItem);
  },

  /** Updates an existing FAQ item (PATCH /api/admin/storefront/faqs/:id). */
  async updateFaq(id: string, updates: UpdateFaqItemInput): Promise<FaqContentItem> {
    const response = await apiClient.patch<ApiResponse<{ faqItem?: FaqContentItem } | FaqContentItem>>(
      `/api/admin/storefront/faqs/${encodeURIComponent(id)}`,
      updates
    );
    const data = unwrap<{ faqItem?: FaqContentItem } | FaqContentItem>(
      response,
      `/api/admin/storefront/faqs/${id}`
    );
    emitStorefrontUpdated();
    return (data as { faqItem?: FaqContentItem }).faqItem ?? (data as FaqContentItem);
  },

  /** Deletes an FAQ item (DELETE /api/admin/storefront/faqs/:id). */
  async deleteFaq(id: string): Promise<{ success: boolean; id: string }> {
    const response = await apiClient.delete<ApiResponse<{ id?: string } | any>>(
      `/api/admin/storefront/faqs/${encodeURIComponent(id)}`
    );
    unwrap(response, `/api/admin/storefront/faqs/${id}`);
    emitStorefrontUpdated();
    return { success: true, id };
  },

  // =========================================================================
  // 8. Tab 7: Storewide Footer & Legal
  // =========================================================================

  /** Gets footer copy, contacts, and copyright (GET /api/storefront/footer). */
  async getFooterContent(options?: { signal?: AbortSignal }): Promise<FooterContentConfig> {
    const response = await apiClient.get<
      ApiResponse<{ footerContent?: FooterContentConfig } | FooterContentConfig>
    >('/api/storefront/footer', undefined, { signal: options?.signal });

    const data = unwrap<{ footerContent?: FooterContentConfig } | FooterContentConfig>(
      response,
      '/api/storefront/footer'
    );
    return (data as { footerContent?: FooterContentConfig }).footerContent ?? (data as FooterContentConfig);
  },

  /** Updates footer copy, contacts, and copyright (PATCH /api/admin/storefront/footer). */
  async updateFooterContent(footer: UpdateFooterContentInput): Promise<FooterContentConfig> {
    const response = await apiClient.patch<
      ApiResponse<{ footerContent?: FooterContentConfig } | FooterContentConfig>
    >('/api/admin/storefront/footer', footer);

    const data = unwrap<{ footerContent?: FooterContentConfig } | FooterContentConfig>(
      response,
      '/api/admin/storefront/footer'
    );
    emitStorefrontUpdated();
    return (data as { footerContent?: FooterContentConfig }).footerContent ?? (data as FooterContentConfig);
  },

  // =========================================================================
  // 9. Image Upload Engine
  // =========================================================================

  /**
   * Uploads an image using dual mode:
   * - Multipart Form Data when given a File object
   * - Base64 Data URL JSON when given a data:image/... string
   *
   * Calls POST /api/admin/storefront/upload (with fallback to /api/storefront/upload).
   */
  async uploadImage(imageFileOrDataUrl: File | string): Promise<UploadImageResult> {
    let response: ApiResponse<UploadImageResult>;

    if (imageFileOrDataUrl instanceof File) {
      const formData = new FormData();
      formData.append('image', imageFileOrDataUrl);
      formData.append('file', imageFileOrDataUrl);
      response = await apiClient.post<ApiResponse<UploadImageResult>>(
        '/api/admin/storefront/upload',
        formData
      );
    } else {
      response = await apiClient.post<ApiResponse<UploadImageResult>>(
        '/api/admin/storefront/upload',
        { image: imageFileOrDataUrl, dataUrl: imageFileOrDataUrl }
      );
    }

    const data = unwrap<UploadImageResult>(response, '/api/admin/storefront/upload');
    return data;
  },

  // =========================================================================
  // Compatibility helpers
  // =========================================================================

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
