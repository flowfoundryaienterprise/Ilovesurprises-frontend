import type {
  AdminRole,
  AdminRoleDefinition,
  AdminTab,
  AdminKPIs,
  AdminActivityItem,
  RepresentativeAdminRecord,
  RepStatus,
  MembershipAdminRecord,
  AdminProductItem,
  AdminCollectionItem,
  AdminCustomerItem,
  AdminRefundRecord,
  AdminDiscountCode,
  AdminCommissionRecord,
  CommissionLedgerStatus,
  AdminReportData,
  AdminSettingsData,
  AdminOrderItem,
  HomepageContentConfig,
  AdminStaffUser,
} from '../types/admin';
import { categoriesData } from '../data/categories';
import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';
import { analyticsService } from './analyticsService';
import { cmsService } from './cmsService';

/**
 * Admin service.
 *
 * Products, users, roles, storefront content, analytics, and the commission
 * ledger are read from and written to the Express backend; those are
 * server-authoritative and have no local mirror.
 *
 * Some admin surfaces have no backend endpoint yet (orders, collections CRUD,
 * inventory logs, store settings, refunds, discounts, memberships, appraisals).
 * Those remain browser-local and are explicitly flagged by
 * `ADMIN_FEATURE_AVAILABILITY` so the UI can label them instead of presenting
 * local state as persisted business data.
 */

/** Safety bound when walking paginated product pages. */
const MAX_ADMIN_PRODUCT_PAGES = 50;

/**
 * Which admin capabilities are backed by a real endpoint.
 * `false` means the backend exposes no route, so the data is local-only and
 * must be presented as such.
 */
export const ADMIN_FEATURE_AVAILABILITY = {
  products: true,
  productVariants: false,
  users: true,
  userRoles: true,
  affiliateAccounts: true,
  commissionLedger: true,
  analytics: true,
  storefrontContent: true,
  orders: false,
  paymentStatuses: false,
  inventoryLog: false,
  collectionsCrud: false,
  storeSettings: false,
  refunds: false,
  discounts: false,
  memberships: false,
  appraisals: false,
} as const;

export type AdminFeature = keyof typeof ADMIN_FEATURE_AVAILABILITY;

export function isAdminFeatureBackedByApi(feature: AdminFeature): boolean {
  return ADMIN_FEATURE_AVAILABILITY[feature];
}

/** Backend product DTO (mirrors backend ProductResponseDTO). */
export interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  images: string[];
  categoryId: string | null;
  categoryName?: string | null;
  badge: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
  inStock: boolean;
  lowStockThreshold: number;
  sku: string | null;
  isBestSeller: boolean;
  isNew: boolean;
  status: string;
  surpriseType?: string | null;
  surpriseValue?: number | string | null;
}

export interface BackendProductListPayload {
  products: BackendProduct[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Backend admin user DTO (mirrors backend UserResponseDTO). */
export interface BackendAdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAdminUserListPayload {
  users: BackendAdminUser[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Accepts either `{product}` or a bare product object. */
function extractProduct(response: any, endpoint: string): BackendProduct {
  const data = unwrap<{ product?: BackendProduct } | BackendProduct>(response, endpoint);
  const product = (data as { product?: BackendProduct })?.product ?? (data as BackendProduct);
  if (!product?.id) {
    throw new ApiError(
      `The server did not return a product for ${endpoint}.`,
      0,
      'parse'
    );
  }
  return product;
}

/** Maps a `ProductStatus` enum value to the admin UI's lowercase status. */
function toUiProductStatus(status: string | undefined): AdminProductItem['status'] {
  switch (String(status || '').toUpperCase()) {
    case 'DRAFT':
      return 'draft';
    case 'ARCHIVED':
      return 'archived';
    default:
      return 'active';
  }
}

/** Maps the admin UI status back to the backend `ProductStatus` enum. */
function toBackendProductStatus(status: string | undefined): string {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'DRAFT';
    case 'archived':
      return 'ARCHIVED';
    default:
      return 'ACTIVE';
  }
}

/**
 * The backend validates image fields as absolute URLs. Relative asset paths
 * are resolved against the current origin; anything else is rejected by
 * returning null so the caller can surface a clear validation message rather
 * than letting the backend 400.
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

/** Maps a backend product onto the admin table's view model. */
export function mapBackendProductToAdmin(p: BackendProduct): AdminProductItem {
  const categoryName =
    p.categoryName ||
    categoriesData.find((c) => c.id === p.categoryId)?.name ||
    p.badge ||
    'Uncategorized';

  return {
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    category: categoryName,
    price: Number(p.price) || 0,
    originalPrice:
      p.compareAtPrice !== null && p.compareAtPrice !== undefined
        ? Number(p.compareAtPrice)
        : undefined,
    description: p.description || p.shortDescription || undefined,
    stock: Number(p.stock) || 0,
    lowStockThreshold: Number(p.lowStockThreshold) || 0,
    surpriseType: p.surpriseType || '',
    surpriseValue:
      p.surpriseValue !== null && p.surpriseValue !== undefined
        ? String(p.surpriseValue)
        : undefined,
    image: p.imageUrl || p.images?.[0] || '',
    images: Array.isArray(p.images) ? p.images : undefined,
    rating: Number(p.rating) || 0,
    reviewCount: Number(p.reviewCount) || 0,
    status: toUiProductStatus(p.status),
    isBestSeller: Boolean(p.isBestSeller),
  };
}

/** Maps a backend user onto the admin customer table's view model. */
export function mapBackendUserToCustomer(u: BackendAdminUser): AdminCustomerItem {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();

  return {
    id: u.id,
    name: name || u.email.split('@')[0],
    email: u.email,
    // The backend user record carries no phone number.
    phone: '',
    // Order counts, lifetime spend, and last-order date require an orders
    // endpoint that does not exist yet. They are reported as unavailable (0 /
    // empty) rather than estimated, and the Customers view labels them.
    ordersCount: 0,
    totalSpent: 0,
    lastOrderDate: '',
    status: u.isActive ? 'active' : 'inactive',
  };
}

/** One admin commission ledger row (mirrors backend AdminLedgerItemDTO). */
export interface BackendAdminLedgerItem {
  id: string;
  representative: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    status: string;
  };
  orderAndCustomer: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
  };
  tierLevel: {
    level: number;
    name: string;
    ratePercent: number;
  };
  orderVolume: number;
  commissionEarned: {
    rate: number;
    amountUsd: number;
    formattedAmount: string;
  };
  status: string;
  availableAt: string;
  ruleVersion: string;
  parentLedgerId: string | null;
  note: string | null;
  createdAt: string;
}

/**
 * The ledger endpoint's payload. The backend returns `{ items, pagination }`;
 * the alternative keys are read defensively only as a tolerance measure.
 */
export interface BackendAdminLedgerPayload {
  items?: BackendAdminLedgerItem[];
  entries?: BackendAdminLedgerItem[];
  ledger?: BackendAdminLedgerItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Maps a backend ledger status onto the admin UI's status union.
 * Backend statuses: pending | available | paid | hold | void | reversed.
 */
function toUiCommissionStatus(status: string): CommissionLedgerStatus {
  switch (String(status || '').toLowerCase()) {
    case 'paid':
      return 'paid';
    case 'available':
      return 'approved';
    case 'reversed':
    case 'void':
      return 'reversed';
    case 'hold':
      return 'unqualified';
    default:
      return 'pending';
  }
}

/**
 * Maps a server-calculated ledger entry onto the admin table's view model.
 * Commission amounts and rates are taken exactly as the backend computed them.
 */
export function mapBackendLedgerEntry(
  entry: BackendAdminLedgerItem
): AdminCommissionRecord {
  const level = Number(entry.tierLevel?.level);

  return {
    id: entry.id,
    repId: entry.representative?.id || '',
    repName: entry.representative?.fullName || entry.representative?.username || '',
    repUsername: entry.representative?.username || '',
    orderId: entry.orderAndCustomer?.orderNumber || entry.orderAndCustomer?.orderId || '',
    orderAmount: Number(entry.orderVolume) || 0,
    // Level 0 is the selling representative's own commission.
    tier: (level === 0 ? 'selling_rep' : level) as AdminCommissionRecord['tier'],
    tierLabel: entry.tierLevel?.name || '',
    ratePercent: Number(entry.tierLevel?.ratePercent) || 0,
    commissionAmount: Number(entry.commissionEarned?.amountUsd) || 0,
    status: toUiCommissionStatus(entry.status),
    date: entry.createdAt
      ? new Date(entry.createdAt).toISOString().split('T')[0]
      : '',
    customerName: entry.orderAndCustomer?.customerName || '',
    ...(entry.note ? { unqualifiedReason: entry.note } : {}),
  };
}

/**
 * Which homepage sections the backend can actually store.
 *
 * `GET/PATCH /api/storefront` covers the announcement bar, the promotional
 * bar, and the showcase cards. The hero, value proposition, about copy, FAQ,
 * and footer have no endpoint, so they remain shipped/local configuration.
 */
export const HOMEPAGE_BACKED_SECTIONS = {
  announcementBar: true,
  promoBar: true,
  showcaseCards: true,
  hero: false,
  valueProposition: false,
  aboutContent: false,
  faqItems: false,
  footerContent: false,
} as const;

/**
 * Overlays the authoritative storefront configuration onto the local homepage
 * content shape, so the homepage renders database values for everything the
 * backend owns while keeping the sections it cannot store.
 */
export function mergeStorefrontIntoHomepageContent(
  local: HomepageContentConfig,
  storefront: {
    showcaseCards: Array<{
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
    }>;
    banners: {
      topStickyAnnouncementBar: { isActive: boolean; announcementCopy: string };
      promotionalDiscountAlertBar: {
        isActive: boolean;
        promoCopy: string;
        promoCode: string;
      };
    };
  }
): HomepageContentConfig {
  const announcement = storefront.banners?.topStickyAnnouncementBar;
  const promo = storefront.banners?.promotionalDiscountAlertBar;

  // Preserve the local card's presentation-only fields (accent colour, item
  // count) which the backend does not model, while taking all editable
  // content from the server.
  const mergedCards = (storefront.showcaseCards || []).map((card) => {
    const existing = (local.featuredCards || []).find(
      (c) => c.id === card.cardKey || c.id === card.id
    );

    return {
      ...existing,
      id: card.cardKey || card.id,
      title: card.displayTitle,
      categoryKey: card.targetCategoryKey,
      badge: card.highlightBadge,
      tagline: card.tagline,
      ctaText: card.ctaButtonText,
      image: card.showcaseImageUri,
      active: card.isActive && card.displayOnHomepage,
      itemCount: existing?.itemCount ?? 0,
      accentBorder: existing?.accentBorder ?? 'hover:border-[#D30915]',
    } as HomepageContentConfig['featuredCards'][number];
  });

  return {
    ...local,
    announcementText: announcement?.announcementCopy ?? local.announcementText,
    announcementActive: announcement?.isActive ?? local.announcementActive,
    promoBannerText: promo?.promoCopy ?? local.promoBannerText,
    promoBannerCode: promo?.promoCode ?? local.promoBannerCode,
    promoBannerActive: promo?.isActive ?? local.promoBannerActive,
    featuredCards: mergedCards.length ? mergedCards : local.featuredCards,
  };
}

/** Notifies admin and storefront views that server-side data changed. */
function notifyAdminDataChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ils_admin_updated'));
  window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
}

/* Local keys still in use for admin surfaces that have no backend endpoint. */
const ADMIN_ROLE_KEY = 'ils_admin_current_role_v1';
const ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY = 'ils_admin_roles_permissions_v1';
const ADMIN_MEMBERSHIPS_KEY = 'ils_admin_memberships_v1';
const ADMIN_REFUNDS_KEY = 'ils_admin_refunds_v1';
const ADMIN_DISCOUNTS_KEY = 'ils_admin_discounts_v1';
const ADMIN_SETTINGS_KEY = 'ils_admin_settings_v1';
const ADMIN_COLLECTIONS_OVERRIDE_KEY = 'ils_admin_collections_override_v1';
const ADMIN_HOMEPAGE_CONTENT_KEY = 'ils_admin_homepage_content_v1';
const ADMIN_STAFF_OVERRIDE_KEY = 'ils_admin_staff_override_v1';

/**
 * Keys that previously shadowed server-owned data. They are now read from the
 * backend instead, so any leftover values are stale and must not influence the
 * UI. Clearing them on load prevents a browser that used an earlier build from
 * showing old overrides alongside live API data.
 */
const RETIRED_LOCAL_KEYS = [
  'ils_admin_products_override_v1',
  'ils_admin_representatives_v1',
  'ils_admin_commissions_v1',
  'ils_admin_customers_v1',
  'ils_cms_storefront_v1',
  'ilovesurprises_orders_v1',
  'ilovesurprises_commissions_v1',
  'ilovesurprises_affiliate_stats_v1',
  'ilovesurprises_payouts_v1',
  'ilovesurprises_genealogy_tree_v1',
  'ilovesurprises_monthly_qualifications_v1',
];

export function purgeRetiredLocalAdminData(): void {
  if (typeof window === 'undefined') return;
  RETIRED_LOCAL_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable; nothing to clean up.
    }
  });
}

// Run once at module load so a stale cache never reaches the admin views.
purgeRetiredLocalAdminData();

export const ADMIN_ROLES_CONFIG: Record<AdminRole, AdminRoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator',
    badge: 'Full Access',
    description: 'Unrestricted control over commerce, reps, payouts, settings, and permissions.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'representatives',
      'memberships',
      'commerce',
      'commissions',
      'reports',
      'content',
      'settings',
      'permissions',
      'appraisals',
    ],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: true,
  },
  store_manager: {
    id: 'store_manager',
    name: 'Store Manager',
    badge: 'Commerce & Ops',
    description: 'Manages catalog, inventory, order refunds, discount promotions, and sales reports. Restricted from MLM and financial settings.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'commerce',
      'content',
      'reports',
      'appraisals',
      'representatives',
    ],
    canEdit: true,
    canApprovePayouts: false,
    canManageSettings: false,
  },
  affiliate_manager: {
    id: 'affiliate_manager',
    name: 'Affiliate & Rep Director',
    badge: 'Downline & Comms',
    description: 'Manages reps, approvals, memberships, downline tiers, and commission ledgers.',
    allowedTabs: [
      'overview',
      'representatives',
      'memberships',
      'commissions',
      'reports',
      'customers',
    ],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: false,
  },
  support_rep: {
    id: 'support_rep',
    name: 'Customer Support Lead',
    badge: 'Read & Assist',
    description: 'Access to customer orders, lookup reps, memberships, and refunds processing. Read-only permissions.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'commerce',
      'representatives',
      'memberships',
      'appraisals',
      'reports',
    ],
    canEdit: false,
    canApprovePayouts: false,
    canManageSettings: false,
  },
};

const INITIAL_MEMBERSHIPS: MembershipAdminRecord[] = [];

const INITIAL_REFUNDS: AdminRefundRecord[] = [];

const INITIAL_DISCOUNTS: AdminDiscountCode[] = [
  {
    id: 'disc-01',
    code: 'SURPRISE15',
    discountPercent: 15,
    minSpend: 40,
    usageCount: 0,
    maxUsage: 1000,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'disc-02',
    code: 'VIPGOLD',
    discountPercent: 20,
    minSpend: 75,
    usageCount: 0,
    maxUsage: 500,
    expiresAt: '2026-06-30',
    active: true,
  },
  {
    id: 'disc-03',
    code: 'WELCOME10',
    discountPercent: 10,
    minSpend: 25,
    usageCount: 0,
    expiresAt: '2026-12-31',
    active: true,
  },
];

const INITIAL_SETTINGS: AdminSettingsData = {
  referralAttributionDays: 60,
  restrictedUsernames: [
    'admin',
    'administrator',
    'ilovesurprises',
    'official',
    'support',
    'help',
    'ceo',
    'founder',
    'billing',
    'root',
    'payouts',
    'security',
    'mod',
    'staff',
  ],
  starterKits: [
    {
      id: 'kit-pro',
      name: 'Pro Ambassador Starter Kit',
      price: 99.00,
      includedProductsCount: 8,
      active: true,
      description: 'Contains 4 Best-Selling Cash Candles, 2 Bath Bombs, 2 Wax Melts, Scent Sampler Strips, and 100 Catalogs.',
      sampleItems: ['Cash Candles (2x)', 'Diamond Ring Candles (2x)', 'Aroma Samplers (50x)', 'Branded Swag Bag'],
    },
    {
      id: 'kit-standard',
      name: 'Essential Launch Starter Kit',
      price: 49.00,
      includedProductsCount: 4,
      active: true,
      description: 'Ideal starter inventory to host initial home reveal parties and unboxing live streams.',
      sampleItems: ['Cash Candle (1x)', 'Surprise Ring Candle (1x)', 'Bath Bomb Cash (2x)', 'Quickstart Digital Guide'],
    },
  ],
  emailProvider: 'sendgrid',
  emailSenderName: 'ILoveSurprises Customer Experience',
  emailSenderAddress: 'support@ilovesurprises.com',
  emailApiKeyConfigured: true,
  emailTemplates: [
    { id: 'tpl-1', name: 'Order Confirmation & Tracking', subject: 'Your Surprise is on the way! [Order #{{orderId}}]', trigger: 'order_placed', active: true },
    { id: 'tpl-2', name: 'Representative Welcome & Store Link', subject: 'Welcome to the Team! Here is your 20% Rep Store Link', trigger: 'rep_approved', active: true },
    { id: 'tpl-3', name: 'Commission Approved Notice', subject: 'Cha-ching! You just earned ${{amount}} commission', trigger: 'commission_approved', active: true },
    { id: 'tpl-4', name: 'Membership Renewal Receipt', subject: 'Your Representative Membership Renewal Receipt', trigger: 'membership_renewed', active: true },
    { id: 'tpl-5', name: 'Payment Past Due Alert', subject: 'Action Required: Update your billing method to keep rep privileges', trigger: 'payment_failed', active: true },
  ],
  gateways: {
    stripe: { enabled: true, testMode: false, webhookHealthy: true },
    paypal: { enabled: true, sandbox: false, webhookHealthy: true },
    applePay: { enabled: true },
  },
  siteContent: {
    announcementText: '✨ FREE EXPRESS SHIPPING OVER $50 • GUARANTEED REAL SURPRISE INSIDE EVERY ORDER ✨',
    announcementActive: true,
    promoBannerText: 'VIP Reveal Club: Save 15% with code SURPRISE15 at checkout',
    promoBannerActive: true,
    vipPerkText: 'Up to $7,500 Cash & Fine Diamond Jewelry Hidden in Hand-Poured USA Soy Candles',
  },
};

export const adminService = {
  getCurrentRole(): AdminRole {
    if (typeof window === 'undefined') return 'super_admin';
    try {
      const stored = localStorage.getItem(ADMIN_ROLE_KEY);
      if (stored && stored in ADMIN_ROLES_CONFIG) {
        return stored as AdminRole;
      }
      return 'super_admin';
    } catch {
      return 'super_admin';
    }
  },

  setCurrentRole(role: AdminRole): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_ROLE_KEY, role);
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to set admin role', err);
      }
    }
  },

  getRoleDefinitions(): Record<AdminRole, AdminRoleDefinition> {
    if (typeof window === 'undefined') return ADMIN_ROLES_CONFIG;
    try {
      const stored = localStorage.getItem(ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY);
      if (stored) {
        const overrides = JSON.parse(stored);
        return {
          ...ADMIN_ROLES_CONFIG,
          ...overrides,
        };
      }
    } catch {
      // fallback
    }
    return ADMIN_ROLES_CONFIG;
  },

  updateRolePermissions(role: AdminRole, allowedTabs: AdminTab[], canEdit?: boolean): Record<AdminRole, AdminRoleDefinition> {
    if (typeof window !== 'undefined') {
      try {
        const currentDefs = this.getRoleDefinitions();
        const updated: Record<AdminRole, AdminRoleDefinition> = {
          ...currentDefs,
          [role]: {
            ...currentDefs[role],
            allowedTabs,
            canEdit: canEdit !== undefined ? canEdit : currentDefs[role].canEdit,
          },
        };
        localStorage.setItem(ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
        return updated;
      } catch (err) {
        console.error('Failed to save role permissions', err);
      }
    }
    return this.getRoleDefinitions();
  },

  hasTabAccess(tab: AdminTab, role?: AdminRole): boolean {
    const currentRole = role || this.getCurrentRole();
    const config = this.getRoleDefinitions()[currentRole];
    return config ? config.allowedTabs.includes(tab) : false;
  },

  /**
   * Zeroed KPI shape used only as pre-load placeholder state.
   *
   * These are NOT figures: the admin overview must render its loading skeleton
   * until `fetchKPIs()` resolves, and its error state if that fails. No metric
   * is ever derived from browser storage.
   */
  getKPIs(): AdminKPIs {
    return {
      grossRevenue: 0,
      grossRevenueMoM: 0,
      totalOrders: 0,
      totalOrdersMoM: 0,
      totalCustomers: 0,
      totalCustomersMoM: 0,
      activeRepresentatives: 0,
      activeRepresentativesMoM: 0,
      activeMemberships: 0,
      activeMembershipsMoM: 0,
      monthlyRecurringRevenue: 0,
      pendingCommissionLiability: 0,
      totalCommissionsPaid: 0,
      averageOrderValue: 0,
    };
  },

  /**
   * Loads dashboard KPIs from the backend's authoritative aggregation.
   * Errors propagate so the overview can show a retryable error state.
   */
  async fetchKPIs(
    timeframe: '7d' | '30d' | '90d' | 'ytd' = '30d',
    options?: { signal?: AbortSignal }
  ): Promise<AdminKPIs> {
    const [report, central] = await Promise.all([
      analyticsService.fetchReport(timeframe, options),
      // Program-wide commission totals are supplementary; if this call fails
      // the report's timeframe-scoped values are used instead.
      analyticsService.fetchCommissionCentral(options).catch(() => null),
    ]);

    return analyticsService.toAdminKPIs(report, central);
  },

  /**
   * Recent activity feed.
   *
   * The backend exposes no activity/audit endpoint, and the previous
   * implementation synthesised this from locally stored mock orders. Returning
   * an empty list lets the UI show an accurate empty state rather than
   * fabricated store activity.
   */
  getRecentActivity(): AdminActivityItem[] {
    return [];
  },

  /**
   * Synchronous placeholder; representatives come from the backend.
   */
  getRepresentatives(): RepresentativeAdminRecord[] {
    return [];
  },

  /**
   * Loads affiliate/representative accounts from `GET /api/admin/users?role=AFFILIATE`.
   *
   * The user record supplies identity, role, and active state. Sales, team
   * size, rank, and commission totals require affiliate-profile and order
   * endpoints that are not exposed for admin use, so they are reported as
   * unavailable (0) rather than invented.
   */
  async fetchRepresentatives(options?: {
    signal?: AbortSignal;
  }): Promise<RepresentativeAdminRecord[]> {
    const users = await this.fetchUsersByRole('AFFILIATE', options);

    return users.map((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      return {
        id: u.id,
        name: name || u.email.split('@')[0],
        repUsername: '',
        email: u.email,
        phone: '',
        avatar: '',
        sponsorUsername: '',
        sponsorName: '',
        status: (u.isActive ? 'active' : 'suspended') as RepStatus,
        approvalStatus: 'approved' as const,
        currentRank: '',
        membershipStatus: 'active' as const,
        membershipPlan: '',
        joinDate: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-US')
          : '',
        lifetimeSales: 0,
        personalSalesMonth: 0,
        teamSalesMonth: 0,
        teamSize: 0,
        totalCommissionsEarned: 0,
      };
    });
  },

  /**
   * Walks `GET /api/admin/users` for a role, following pagination.
   * Requires an ADMIN token; a 403 propagates as a typed ApiError.
   */
  async fetchUsersByRole(
    role: 'CUSTOMER' | 'AFFILIATE' | 'STAFF' | 'ADMIN',
    options?: { signal?: AbortSignal; search?: string }
  ): Promise<BackendAdminUser[]> {
    const limit = 100;
    const collected: BackendAdminUser[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await apiClient.get<ApiResponse<BackendAdminUserListPayload>>(
        '/api/admin/users',
        {
          role,
          page,
          limit,
          ...(options?.search ? { search: options.search } : {}),
        },
        { signal: options?.signal }
      );
      const payload = unwrap<BackendAdminUserListPayload>(response, '/api/admin/users');

      (payload.users || []).forEach((u) => collected.push(u));

      totalPages = payload.pagination?.totalPages || 1;
      page += 1;
    } while (page <= totalPages && page <= MAX_ADMIN_PRODUCT_PAGES);

    return collected;
  },

  /**
   * Activates or suspends a representative via `PATCH /api/admin/users/:id`
   * (`isActive`). Throws on failure so the UI reflects the server's decision.
   *
   * Note: the backend user record models active/inactive only. There is no
   * 'past_due' state server-side — that is a membership concept and
   * memberships have no endpoint — so 'past_due' is treated as suspended.
   */
  async updateRepresentativeStatus(id: string, status: RepStatus): Promise<boolean> {
    if (!id) return false;

    await apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}`, {
      isActive: status === 'active',
    });

    notifyAdminDataChanged();
    return true;
  },

  /**
   * Approves a representative by granting the AFFILIATE role and activating
   * the account through the backend.
   */
  async approveRepresentative(id: string): Promise<boolean> {
    if (!id) return false;

    await apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      role: 'AFFILIATE',
    });
    await apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}`, {
      isActive: true,
    });

    notifyAdminDataChanged();
    return true;
  },

  /**
   * Rejects a representative application by deactivating the account and
   * returning it to the CUSTOMER role.
   */
  async rejectRepresentative(id: string): Promise<boolean> {
    if (!id) return false;

    await apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      role: 'CUSTOMER',
    });
    await apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}`, {
      isActive: false,
    });

    notifyAdminDataChanged();
    return true;
  },

  /**
   * Changes a user's role via `PATCH /api/admin/users/:id/role`.
   * Accepts only the backend's UserRole enum values.
   */
  async updateUserRole(
    userId: string,
    role: 'CUSTOMER' | 'AFFILIATE' | 'STAFF' | 'ADMIN'
  ): Promise<BackendAdminUser> {
    if (!userId) {
      throw new ApiError('A user id is required to change a role.', 400, 'validation');
    }

    const response = await apiClient.patch<ApiResponse<{ user: BackendAdminUser }>>(
      `/api/admin/users/${encodeURIComponent(userId)}/role`,
      { role }
    );

    const payload = unwrap<{ user: BackendAdminUser }>(
      response,
      `/api/admin/users/${userId}/role`
    );

    notifyAdminDataChanged();
    return payload.user;
  },

  getMemberships(): MembershipAdminRecord[] {
    if (typeof window === 'undefined') return INITIAL_MEMBERSHIPS;
    try {
      const stored = localStorage.getItem(ADMIN_MEMBERSHIPS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(INITIAL_MEMBERSHIPS));
      return INITIAL_MEMBERSHIPS;
    } catch {
      return INITIAL_MEMBERSHIPS;
    }
  },

  updateMembershipStatus(id: string, status: 'active' | 'past_due' | 'suspended' | 'cancelled'): boolean {
    const list = this.getMemberships();
    const target = list.find((m) => m.id === id);
    if (!target) return false;
    target.status = status;
    if (status === 'active') target.paymentStatus = 'paid';
    if (status === 'past_due') target.paymentStatus = 'failed';
    this.saveMemberships(list);
    return true;
  },

  saveMemberships(data: MembershipAdminRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save memberships', err);
      }
    }
  },

  /**
   * Synchronous accessor retained for component initial state. The product
   * catalogue is owned by the backend, so there is nothing to read
   * synchronously: callers must await `fetchCommerceProducts()` and render a
   * loading state until it resolves.
   */
  getCommerceProducts(): AdminProductItem[] {
    return [];
  },

  /**
   * Loads the full admin product catalogue from the backend.
   *
   * `GET /api/products` applies no status filter when none is supplied, so
   * drafts and archived products are included — which is what the admin needs.
   * Pages are walked until the reported total is covered.
   */
  async fetchCommerceProducts(options?: {
    signal?: AbortSignal;
  }): Promise<AdminProductItem[]> {
    const limit = 100;
    const collected: AdminProductItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await apiClient.get<ApiResponse<BackendProductListPayload>>(
        '/api/products',
        { page, limit },
        { signal: options?.signal }
      );
      const payload = unwrap<BackendProductListPayload>(response, '/api/products');

      (payload.products || []).forEach((p) => collected.push(mapBackendProductToAdmin(p)));

      totalPages = payload.pagination?.totalPages || 1;
      page += 1;
    } while (page <= totalPages && page <= MAX_ADMIN_PRODUCT_PAGES);

    return collected;
  },

  /**
   * Creates a product through `POST /api/admin/products`.
   *
   * Errors propagate so the UI only reports success after the server has
   * persisted the record. The created product is returned as mapped from the
   * backend response, not from the submitted form values.
   */
  async createProduct(data: Partial<AdminProductItem>): Promise<AdminProductItem> {
    const name = (data.name || '').trim();
    if (name.length < 2) {
      throw new ApiError('Product name must be at least 2 characters.', 400, 'validation');
    }

    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new ApiError('Product price must be greater than zero.', 400, 'validation');
    }

    const body: Record<string, any> = {
      name,
      price,
      status: toBackendProductStatus(data.status),
      isBestSeller: Boolean(data.isBestSeller),
    };

    if (data.description) body.description = data.description;
    if (data.sku) body.sku = data.sku.trim();
    if (data.stock !== undefined) body.stock = Number(data.stock);
    if (data.lowStockThreshold !== undefined) {
      body.lowStockThreshold = Number(data.lowStockThreshold);
    }
    if (data.originalPrice !== undefined && Number(data.originalPrice) > 0) {
      body.compareAtPrice = Number(data.originalPrice);
    }
    if (data.surpriseType) body.surpriseType = data.surpriseType;

    // The backend validates imageUrl/images with `z.string().url()`, so only
    // absolute URLs are sent; relative asset paths would be rejected with 400.
    const imageUrl = toAbsoluteImageUrl(data.image);
    if (imageUrl) body.imageUrl = imageUrl;

    const galleryUrls = (data.images || [])
      .map(toAbsoluteImageUrl)
      .filter((u): u is string => !!u);
    if (galleryUrls.length) body.images = galleryUrls;

    const response = await apiClient.post<ApiResponse<{ product: BackendProduct } | BackendProduct>>(
      '/api/admin/products',
      body
    );

    const created = extractProduct(response, '/api/admin/products');
    notifyAdminDataChanged();
    return mapBackendProductToAdmin(created);
  },

  /**
   * Updates a product through `PATCH /api/admin/products/:id`.
   * Throws on failure — a rejected update is never reported as saved.
   */
  async updateProduct(id: string, updates: Partial<AdminProductItem>): Promise<boolean> {
    if (!id) return false;

    const body: Record<string, any> = {};

    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.price !== undefined) body.price = Number(updates.price);
    if (updates.stock !== undefined) body.stock = Number(updates.stock);
    if (updates.lowStockThreshold !== undefined) {
      body.lowStockThreshold = Number(updates.lowStockThreshold);
    }
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.sku !== undefined) body.sku = updates.sku;
    if (updates.status !== undefined) body.status = toBackendProductStatus(updates.status);
    if (updates.isBestSeller !== undefined) body.isBestSeller = Boolean(updates.isBestSeller);
    if (updates.originalPrice !== undefined) {
      body.compareAtPrice = Number(updates.originalPrice) > 0
        ? Number(updates.originalPrice)
        : null;
    }
    if (updates.surpriseType !== undefined) body.surpriseType = updates.surpriseType;

    if (updates.image !== undefined) {
      const imageUrl = toAbsoluteImageUrl(updates.image);
      if (!imageUrl) {
        throw new ApiError(
          'Product images must be absolute URLs (for example https://...). Upload the image first, then save the returned URL.',
          400,
          'validation'
        );
      }
      body.imageUrl = imageUrl;
    }

    if (updates.images !== undefined) {
      const galleryUrls = updates.images
        .map(toAbsoluteImageUrl)
        .filter((u): u is string => !!u);
      body.images = galleryUrls;
    }

    if (Object.keys(body).length === 0) return true;

    await apiClient.patch(`/api/admin/products/${encodeURIComponent(id)}`, body);
    notifyAdminDataChanged();
    return true;
  },

  /**
   * Deletes a product through `DELETE /api/admin/products/:id`.
   * Throws on failure so the UI does not show a removal that did not happen.
   */
  async deleteProduct(id: string): Promise<boolean> {
    if (!id) return false;
    await apiClient.delete(`/api/admin/products/${encodeURIComponent(id)}`);
    notifyAdminDataChanged();
    return true;
  },

  /** Flips a product between ACTIVE and DRAFT, reading current state from the API. */
  async toggleProductStatus(id: string): Promise<boolean> {
    if (!id) return false;

    const response = await apiClient.get<ApiResponse<{ product: BackendProduct } | BackendProduct>>(
      `/api/products/${encodeURIComponent(id)}`
    );
    const current = extractProduct(response, `/api/products/${id}`);

    const nextStatus =
      String(current.status || '').toUpperCase() === 'ACTIVE' ? 'draft' : 'active';

    return this.updateProduct(id, { status: nextStatus as AdminProductItem['status'] });
  },

  getCollections(): AdminCollectionItem[] {
    const base: AdminCollectionItem[] = categoriesData.map((c, idx) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c.itemCount,
      featured: !!c.featured,
      orderIndex: idx + 1,
      image: c.image,
      tagline: c.tagline,
    }));

    if (typeof window === 'undefined') return base;

    try {
      const stored = localStorage.getItem(ADMIN_COLLECTIONS_OVERRIDE_KEY);
      if (stored) {
        const overrides: AdminCollectionItem[] = JSON.parse(stored);
        if (Array.isArray(overrides) && overrides.length > 0) {
          return overrides.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
        }
      }
    } catch {
      // ignore
    }

    return base.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
  },

  updateCollectionOrdering(id: string, direction: 'up' | 'down'): AdminCollectionItem[] {
    const list = this.getCollections();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return list;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return list;

    // Swap positions and orderIndexes
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    list.forEach((item, index) => {
      item.orderIndex = index + 1;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update collection order', err);
      }
    }
    return list;
  },

  async assignProductToCollection(productId: string, categoryNameOrId: string): Promise<boolean> {
    const matchedCategory =
      categoriesData.find(
        (c) =>
          c.id === categoryNameOrId ||
          c.name.toLowerCase() === categoryNameOrId.toLowerCase()
      ) || categoriesData[0];

    // Update in local product override
    await this.updateProduct(productId, { category: matchedCategory.name });

    // Local storage persistence

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
    }
    return true;
  },

  async removeProductFromCollection(productId: string): Promise<boolean> {
    const defaultCategory = categoriesData[0];
    return this.assignProductToCollection(productId, defaultCategory.id);
  },

  getProductsByCollection(categoryNameOrId: string): AdminProductItem[] {
    const products = this.getCommerceProducts();
    const catLower = categoryNameOrId.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.category.toLowerCase() === catLower ||
        (catLower.includes('zodiac') && p.name.toLowerCase().includes('zodiac'))
    );
  },

  async createCollection(col: Partial<AdminCollectionItem>): Promise<AdminCollectionItem> {
    const list = this.getCollections();
    const slug =
      col.slug || (col.name || 'new-collection').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = col.id || `cat-${slug}`;

    const newCol: AdminCollectionItem = {
      id,
      name: col.name || 'New Collection',
      slug,
      tagline: col.tagline || 'Curated surprise collection',
      productCount: 0,
      featured: Boolean(col.featured),
      orderIndex: list.length + 1,
      image: col.image || '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
    };

    const updated = [...list, newCol];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to create collection override', err);
      }
    }

    return newCol;
  },

  async updateCollection(id: string, updates: Partial<AdminCollectionItem>): Promise<boolean> {
    const list = this.getCollections();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update collection', err);
      }
    }

    return true;
  },

  async deleteCollection(id: string): Promise<boolean> {
    const list = this.getCollections();
    const filtered = list.filter((c) => c.id !== id);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to delete collection', err);
      }
    }

    return true;
  },

  async toggleCollectionFeatured(id: string): Promise<boolean> {
    const list = this.getCollections();
    const item = list.find((c) => c.id === id);
    if (!item) return false;
    return this.updateCollection(id, { featured: !item.featured });
  },

  /**
   * Store orders.
   *
   * BLOCKED: the backend exposes no order endpoint (the `orders` table exists
   * in Prisma but no route reads it). The previous implementation returned
   * locally stored mock orders, which presented fabricated sales to the admin.
   *
   * This returns an empty list so the Orders view shows an accurate empty
   * state; `ADMIN_FEATURE_AVAILABILITY.orders === false` lets the UI explain
   * that the endpoint is missing rather than implying the store has no sales.
   */
  async getCommerceOrders(): Promise<AdminOrderItem[]> {
    return [];
  },

  /** Synchronous placeholder; customers come from the backend. */
  getCustomers(): AdminCustomerItem[] {
    return [];
  },

  /**
   * Loads customers from `GET /api/admin/users?role=CUSTOMER`.
   *
   * Errors propagate (including 403 for a non-admin token) so the view can
   * show a permission or error state instead of an empty table that reads as
   * "no customers".
   */
  async fetchCustomers(options?: {
    signal?: AbortSignal;
    search?: string;
  }): Promise<AdminCustomerItem[]> {
    const users = await this.fetchUsersByRole('CUSTOMER', options);
    return users.map(mapBackendUserToCustomer);
  },

  getRefunds(): AdminRefundRecord[] {
    if (typeof window === 'undefined') return INITIAL_REFUNDS;
    try {
      const stored = localStorage.getItem(ADMIN_REFUNDS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(INITIAL_REFUNDS));
      return INITIAL_REFUNDS;
    } catch {
      return INITIAL_REFUNDS;
    }
  },

  processRefund(record: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>): AdminRefundRecord {
    const refunds = this.getRefunds();
    const newRecord: AdminRefundRecord = {
      ...record,
      id: `ref-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    const updated = [newRecord, ...refunds];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save refund', err);
      }
    }
    return newRecord;
  },

  getDiscounts(): AdminDiscountCode[] {
    if (typeof window === 'undefined') return INITIAL_DISCOUNTS;
    try {
      const stored = localStorage.getItem(ADMIN_DISCOUNTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(INITIAL_DISCOUNTS));
      return INITIAL_DISCOUNTS;
    } catch {
      return INITIAL_DISCOUNTS;
    }
  },

  createDiscount(discount: Omit<AdminDiscountCode, 'id' | 'usageCount'>): AdminDiscountCode {
    const list = this.getDiscounts();
    const newDisc: AdminDiscountCode = {
      ...discount,
      id: `disc-${Date.now().toString().slice(-4)}`,
      usageCount: 0,
    };
    const updated = [newDisc, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to create discount', err);
      }
    }
    return newDisc;
  },

  /** Synchronous placeholder; the ledger is server-authoritative. */
  getCommissionLedger(): AdminCommissionRecord[] {
    return [];
  },

  /**
   * Loads the admin commission ledger from `GET /api/admin/commission/ledger`.
   *
   * Amounts, tiers, rates, and statuses are all computed by the backend's
   * commission engine; nothing is recalculated here.
   */
  async fetchCommissions(options?: {
    signal?: AbortSignal;
    search?: string;
    status?: string;
    tier?: number;
    page?: number;
    limit?: number;
  }): Promise<AdminCommissionRecord[]> {
    const response = await apiClient.get<ApiResponse<BackendAdminLedgerPayload>>(
      '/api/admin/commission/ledger',
      {
        ...(options?.search ? { search: options.search } : {}),
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.tier !== undefined ? { tier: options.tier } : {}),
        page: options?.page ?? 1,
        limit: options?.limit ?? 100,
      },
      { signal: options?.signal }
    );

    const payload = unwrap<BackendAdminLedgerPayload>(
      response,
      '/api/admin/commission/ledger'
    );

    const entries = payload.items || payload.entries || payload.ledger || [];
    return entries.map(mapBackendLedgerEntry);
  },

  /**
   * Commission status transitions.
   *
   * BLOCKED: the backend exposes no endpoint to approve, hold, or mark a
   * commission ledger entry as paid. `POST /api/commission/process-order/:orderId`
   * and `/refund-order/:orderId` act on an order's commissions as a whole, not
   * on individual ledger rows.
   *
   * Rather than writing a status change to browser storage and showing the
   * admin a state the database never recorded, this reports that the action is
   * unavailable.
   */
  async updateCommissionStatus(
    _id: string,
    _status: CommissionLedgerStatus
  ): Promise<boolean> {
    throw new ApiError(
      'Commission status changes are not available yet: the backend has no endpoint to update an individual ledger entry.',
      501,
      'http',
      { endpoint: '/api/admin/commission/ledger', method: 'PATCH' }
    );
  },

  /**
   * Bulk commission approval.
   *
   * BLOCKED for the same reason as `updateCommissionStatus`.
   */
  async batchApproveCommissions(): Promise<number> {
    throw new ApiError(
      'Bulk commission approval is not available yet: the backend has no endpoint to update ledger entries.',
      501,
      'http',
      { endpoint: '/api/admin/commission/ledger', method: 'PATCH' }
    );
  },

  /**
   * Zeroed report shape used only as pre-load placeholder state. The admin
   * reports view must show its loading skeleton until `fetchReportsData()`
   * resolves. No value here is derived from browser storage.
   */
  getReportsData(timeframe: '7d' | '30d' | '90d' | 'ytd' = '30d'): AdminReportData {
    return {
      timeframe,
      grossSales: 0,
      netSales: 0,
      ordersCount: 0,
      averageOrderValue: 0,
      visitors: 0,
      conversionRate: 0,
      activeRepresentatives: 0,
      membershipMRR: 0,
      commissionLiability: 0,
      totalPayoutsDisbursed: 0,
      salesByDay: [],
      trafficByDay: [],
      tierDistribution: [],
      membershipBreakdown: [],
    };
  },

  /**
   * Loads the analytics report from the backend and maps it onto the existing
   * reports view model. Errors propagate so the view can offer a retry.
   */
  async fetchReportsData(
    timeframe: '7d' | '30d' | '90d' | 'ytd' = '30d',
    options?: { signal?: AbortSignal }
  ): Promise<AdminReportData> {
    const [report, central] = await Promise.all([
      analyticsService.fetchReport(timeframe, options),
      analyticsService.fetchCommissionCentral(options).catch(() => null),
    ]);

    return analyticsService.toAdminReportData(report, central);
  },

  getSettings(): AdminSettingsData {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    try {
      const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AdminSettingsData): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save settings', err);
      }
    }
  },

  // Homepage Content Management
  getHomepageContent(): HomepageContentConfig {
    const DEFAULT_CONTENT: HomepageContentConfig = {
      announcementText: '⚡ FREE SHIPPING ON SURPRISE CANDLE ORDERS OVER $50 + REAL CASH PRIZES IN EVERY CANDLE!',
      announcementActive: true,
      announcementLink: '/shop',
      promoBannerText: 'Use code SURPRISE15 at checkout for 15% OFF your first surprise candle reveal!',
      promoBannerCode: 'SURPRISE15',
      promoBannerActive: true,
      featuredCards: [
        {
          id: 'halloween',
          title: 'Halloween',
          categoryKey: 'Halloween',
          badge: 'Holiday Priority',
          tagline: 'Limited-edition Halloween reveal candles & bath treats with cash and jewelry inside',
          ctaText: 'Shop Halloween Collection',
          image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369',
          itemCount: 83,
          accentBorder: 'hover:border-orange-500',
          active: true,
        },
        {
          id: 'christmas-candles-1',
          title: 'Christmas',
          categoryKey: 'Christmas Candles',
          badge: 'Holiday Priority',
          tagline: 'Magical Christmas reveal candles and seasonal celebration scents with hidden treasures',
          ctaText: 'Shop Christmas Collection',
          image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
          itemCount: 98,
          accentBorder: 'hover:border-red-500',
          active: true,
        },
        {
          id: 'cash-candles',
          title: 'Cash Candles',
          categoryKey: 'Cash Candles',
          badge: 'Win Up To $2,500',
          tagline: 'Real cash prizes ($2 – $2,500) hidden inside every single candle',
          ctaText: 'Shop Cash Candles',
          image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
          itemCount: 495,
          accentBorder: 'hover:border-emerald-400',
          active: true,
        },
        {
          id: 'zodiac-cash-money-candles',
          title: 'Zodiac Cash Candles',
          categoryKey: 'ZODIAC CASH MONEY CANDLES',
          badge: 'Real Cash Inside',
          tagline: 'Astrology horoscope cash candles with real money prizes up to $2,500',
          ctaText: 'Shop Zodiac Cash Candles',
          image: '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
          itemCount: 12,
          accentBorder: 'hover:border-purple-500',
          active: true,
        },
      ],
      hero: {
        desktopBannerImage: '/assets/ilovesurprises/banners/Neww banner.jpeg',
        mobileBannerImage: '/assets/ilovesurprises/banners/mobile-banner.jpg',
        headline: 'ILoveSurprises.com — Discover jewelry, cash, and surprises inside every candle & bath bomb',
        subheadline: 'Handcrafted soy candles and bath treats with authentic real cash and luxury jewelry reveals in every product.',
        benefitTiles: [
          { id: 'hidden-jewelry', title: 'Hidden Jewelry Reveals', subtitle: 'Real jewelry in every product', iconName: 'Gem', actionType: 'shop' },
          { id: 'viral-unboxing', title: 'Viral Unboxing Fun', subtitle: 'Share, surprise, repeat', iconName: 'Gift', actionType: 'shop' },
          { id: 'start-store', title: 'Start Your Store', subtitle: 'Your business. Your way.', iconName: 'Store', actionType: 'consultant' },
          { id: 'earn-5-levels', title: 'Earn From 5 Levels', subtitle: 'Build your team. Grow together.', iconName: 'Users', actionType: 'consultant' },
        ],
      },
      valueProposition: {
        eyebrow: '100% Real Reveal Guarantee',
        title: 'Why Customers Love I Love Surprises',
        description: 'Every single hand-poured candle and artisan bath treat conceals an authentic legal tender cash prize ($2 to $2,500) or genuine fine jewelry appraised up to $7,500.',
        points: [
          'Guaranteed genuine cash prizes sealed in protective gold foil',
          'Solid .925 sterling silver & 14k gold rings with verified appraisal tags',
          'Handcrafted with clean, 100% natural USA soy wax',
          'Fast nationwide dispatch with real-time tracking',
        ],
      },
      aboutContent: {
        badge: 'Our Brand Story & Craftsmanship',
        headline: 'Where Luxury Fragrance Meets the Thrill of Real Surprises',
        storyText: 'Hand-poured 100% natural soy wax candles crafted with artisan care in the USA. Every single candle, bath treat, and wax melt is guaranteed to conceal authentic cash ($2 to $2,500) or luxury fine jewelry (appraised up to $7,500).',
        naturalSoyStat: '100% Natural Soy',
        unboxingsStat: '85,000+ Unboxings',
        realCashStat: '$2 to $2.5K Real Cash',
      },
      faqItems: [
        { id: 'faq-1', question: 'What is I Love Surprises?', answer: 'I Love Surprises offers fun products designed around the excitement of discovering a surprise. Depending on the product, the surprise may include jewelry, cash, or another featured reward.', category: 'About Surprises' },
        { id: 'faq-2', question: 'What kinds of products do you offer?', answer: 'Our assortment includes candles, wax melts, bath products, soaps, candy, chocolates, slimes, greeting cards, jewelry, and other surprise products.', category: 'Products' },
        { id: 'faq-3', question: 'Are the candles soy based?', answer: 'Where specified on the product page, our candle products are made with 100% natural soy wax.', category: 'Products' },
        { id: 'faq-4', question: 'Can I choose my jewelry or ring size?', answer: 'Yes! Jewelry surprise products allow you to select ring sizes from 5 to 10 or preferred jewelry styles right on the product page.', category: 'Jewelry & Sizing' },
        { id: 'faq-5', question: 'How do I check my jewelry appraisal code?', answer: 'Visit our Appraisal Verification portal (/appraise) and enter the authentic verification code printed on your jewelry reveal tag to inspect assessed retail value.', category: 'Jewelry & Sizing' },
        { id: 'faq-6', question: 'Where do you ship and what are rates?', answer: 'We ship nationwide across the United States and selected international regions. Orders over $50 enjoy Free Express Shipping.', category: 'Shipping & Delivery' },
      ],
      footerContent: {
        newsletterTitle: 'Unlock 15% Off Your Next Surprise & Weekly Cash Drop Alerts',
        newsletterSubtitle: 'Join over 85,000+ unboxing fans. Be first to know about new limited scents, rare diamond jewelry drops, and grand cash reveals.',
        copyrightText: '© 2026 ILoveSurprises.com. All rights reserved. Hand-poured with love in the USA.',
        supportEmail: 'support@ilovesurprises.com',
        supportPhone: '1-800-SURPRISE',
        guaranteeText: '256-Bit SSL Encrypted Bank-Grade Checkout',
      },
    };

    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    try {
      const stored = localStorage.getItem(ADMIN_HOMEPAGE_CONTENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasHalloween = parsed.featuredCards?.some((c: any) => c.id === 'halloween');
        const hasChristmas = parsed.featuredCards?.some((c: any) => c.id === 'christmas-candles-1');
        const hasCash = parsed.featuredCards?.some((c: any) => c.id === 'cash-candles');
        const hasZodiac = parsed.featuredCards?.some((c: any) => c.id === 'zodiac-cash-money-candles');
        const hasObsolete = parsed.featuredCards?.some((c: any) => c.id === 'trending-collection');
        if (hasHalloween && hasChristmas && hasCash && hasZodiac && !hasObsolete) {
          return {
            ...DEFAULT_CONTENT,
            ...parsed,
            hero: parsed.hero ? { ...DEFAULT_CONTENT.hero, ...parsed.hero } : DEFAULT_CONTENT.hero,
            valueProposition: parsed.valueProposition ? { ...DEFAULT_CONTENT.valueProposition, ...parsed.valueProposition } : DEFAULT_CONTENT.valueProposition,
            aboutContent: parsed.aboutContent ? { ...DEFAULT_CONTENT.aboutContent, ...parsed.aboutContent } : DEFAULT_CONTENT.aboutContent,
            faqItems: parsed.faqItems && parsed.faqItems.length > 0 ? parsed.faqItems : DEFAULT_CONTENT.faqItems,
            footerContent: parsed.footerContent ? { ...DEFAULT_CONTENT.footerContent, ...parsed.footerContent } : DEFAULT_CONTENT.footerContent,
          };
        }
      }
      localStorage.setItem(ADMIN_HOMEPAGE_CONTENT_KEY, JSON.stringify(DEFAULT_CONTENT));
      return DEFAULT_CONTENT;
    } catch {
      return DEFAULT_CONTENT;
    }
  },

  /**
   * Persists homepage content.
   *
   * Backend-owned fields (announcement bar, promo bar, showcase cards) are
   * written through the admin storefront API and only considered saved once
   * the server confirms. The remaining sections (hero, value proposition,
   * about, FAQ, footer) have no endpoint and stay in browser storage.
   *
   * Throws if an API write fails, so the admin is never told a change was
   * saved when it was not.
   */
  async saveHomepageContent(content: HomepageContentConfig): Promise<void> {
    // 1. Server-owned banners.
    await cmsService.updateBanners({
      topStickyAnnouncementBar: {
        isActive: content.announcementActive,
        announcementCopy: content.announcementText,
      },
      promotionalDiscountAlertBar: {
        isActive: content.promoBannerActive,
        promoCopy: content.promoBannerText,
        ...(content.promoBannerCode ? { promoCode: content.promoBannerCode } : {}),
      },
    });

    // 2. Server-owned showcase cards, addressed by their backend cardKey.
    //    Sequential so a failure reports the specific card that was rejected.
    for (let index = 0; index < (content.featuredCards || []).length; index += 1) {
      const card = content.featuredCards[index];
      if (!card?.id) continue;

      await cmsService.updateShowcaseCard(card.id, {
        displayTitle: card.title,
        highlightBadge: card.badge,
        tagline: card.tagline,
        ctaButtonText: card.ctaText,
        targetCategoryKey: card.categoryKey,
        showcaseImageUri: card.image,
        isActive: card.active !== false,
        displayOnHomepage: card.active !== false,
        sortOrder: index + 1,
      });
    }

    // 3. Local-only sections with no backend endpoint.
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_HOMEPAGE_CONTENT_KEY, JSON.stringify(content));
      } catch (err) {
        console.error('Failed to cache local-only homepage sections', err);
      }
      window.dispatchEvent(new CustomEvent('ils_homepage_content_updated'));
      window.dispatchEvent(new CustomEvent('ils_admin_updated'));
    }
  },

  /**
   * Loads homepage content with `GET /api/storefront` as the authoritative
   * source for banners and showcase cards.
   *
   * Sections the backend cannot store (hero, value proposition, about, FAQ,
   * footer) are taken from local configuration. If the storefront request
   * fails, the error propagates so the caller can retry rather than silently
   * rendering stale banner copy.
   */
  async fetchLiveStorefrontContent(options?: {
    signal?: AbortSignal;
    admin?: boolean;
  }): Promise<HomepageContentConfig> {
    const local = this.getHomepageContent();

    const storefront = options?.admin
      ? await cmsService.getAdminStorefront({ signal: options?.signal })
      : await cmsService.getStorefront({ signal: options?.signal });

    return mergeStorefrontIntoHomepageContent(local, storefront);
  },

  resetHomepageContent(): HomepageContentConfig {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ADMIN_HOMEPAGE_CONTENT_KEY);
      } catch {
        // ignore
      }
    }
    const def = this.getHomepageContent();
    window.dispatchEvent(new CustomEvent('ils_homepage_content_updated'));
    window.dispatchEvent(new CustomEvent('ils_admin_updated'));
    return def;
  },

  // Staff Administration (Super Admin / Manager RBAC)
  async getStaffAdmins(): Promise<AdminStaffUser[]> {
    const defaultStaff: AdminStaffUser[] = [
      {
        id: 'staff-primary-admin',
        email: 'ilovesurprises.admin@gmail.com',
        name: 'Harsha (Founder & Admin)',
        role: 'super_admin',
        avatarUrl: '/assets/ilovesurprises/avatars/founder.png',
        lastActive: 'Just now',
        createdAt: '2026-09-08T11:03:23Z',
      },
      {
        id: 'staff-store-mgr',
        email: 'manager@ilovesurprises-live.com',
        name: 'Store Operations Manager',
        role: 'store_manager',
        avatarUrl: '/assets/ilovesurprises/avatars/manager.png',
        lastActive: '2 hours ago',
        createdAt: '2026-09-09T14:00:00Z',
      },
      {
        id: 'staff-affiliate-dir',
        email: 'affiliates@ilovesurprises-live.com',
        name: 'Affiliate & Rep Director',
        role: 'affiliate_manager',
        avatarUrl: '/assets/ilovesurprises/avatars/affiliate-lead.png',
        lastActive: 'Yesterday',
        createdAt: '2026-09-10T09:30:00Z',
      },
      {
        id: 'staff-support-lead',
        email: 'support@ilovesurprises-live.com',
        name: 'Customer Support Lead',
        role: 'support_rep',
        avatarUrl: '/assets/ilovesurprises/avatars/support.png',
        lastActive: '3 hours ago',
        createdAt: '2026-09-10T12:00:00Z',
      },
    ];

    try {
      // Check stored role overrides
      let overrides: Record<string, AdminRole> = {};
      try {
        const storedOverrides = localStorage.getItem(ADMIN_STAFF_OVERRIDE_KEY);
        if (storedOverrides) overrides = JSON.parse(storedOverrides);
      } catch {
        // ignore
      }

      return defaultStaff.map((p) => {
        let assignedRole: AdminRole = p.role;
        if (overrides[p.id]) {
          assignedRole = overrides[p.id];
        }

        return {
          ...p,
          role: assignedRole,
        };
      });
    } catch {
      return defaultStaff;
    }
  },

  async updateStaffRole(staffId: string, newRole: AdminRole): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        let overrides: Record<string, AdminRole> = {};
        const stored = localStorage.getItem(ADMIN_STAFF_OVERRIDE_KEY);
        if (stored) overrides = JSON.parse(stored);
        overrides[staffId] = newRole;
        localStorage.setItem(ADMIN_STAFF_OVERRIDE_KEY, JSON.stringify(overrides));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update staff role', err);
      }
    }
  },
};
