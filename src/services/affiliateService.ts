/**
 * Affiliate / MLM service.
 *
 * All earnings, balances, commission entries, and downline structure come from
 * the backend:
 *   GET /api/affiliates/me           → profile + balances + recent commissions
 *   GET /api/affiliates/me/ledger    → paginated commission ledger
 *   GET /api/affiliates/me/genealogy → downline tree, up to 5 levels
 *   GET /api/affiliates/resolve/:username → referral attribution
 *   POST /api/affiliates/register    → affiliate enrollment
 *
 * Commission amounts and rates are computed by the backend's commission engine
 * against confirmed orders. Nothing here recalculates them, and no downline
 * member, earning, or commission entry is ever synthesised locally.
 */

import type {
  AffiliateStats,
  CommissionRecord,
  CommissionTierLevel,
  PayoutRecord,
  ReferralMember,
} from '../types';
import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';

/**
 * The approved commission schedule, mirroring the backend's `TIER_CONFIG`
 * (backend/src/services/analytics.service.ts). Used for labelling only — every
 * displayed amount comes from the server.
 */
export const COMMISSION_TIER_SCHEDULE = [
  { level: 0, name: 'Direct Sale', ratePercent: 20.0, roleDescription: 'Selling Representative' },
  { level: 1, name: 'Tier 1 Sponsor', ratePercent: 5.0, roleDescription: 'Level 1 Downline' },
  { level: 2, name: 'Tier 2 Leader', ratePercent: 4.0, roleDescription: 'Level 2 Downline' },
  { level: 3, name: 'Tier 3 Partner', ratePercent: 3.0, roleDescription: 'Level 3 Downline' },
  { level: 4, name: 'Tier 4 Network', ratePercent: 2.0, roleDescription: 'Level 4 Downline' },
  { level: 5, name: 'Tier 5 Infinity', ratePercent: 1.0, roleDescription: 'Level 5 Downline' },
] as const;

/* ------------------------------------------------------------------ *
 * Backend shapes
 * ------------------------------------------------------------------ */

export interface BackendAffiliateProfile {
  id: string;
  userId: string;
  username: string | null;
  referralCode: string;
  slug: string | null;
  sponsorId: string | null;
  status: string;
  isActive: boolean;
  payoutStatus: string;
  lifetimeEarnings: number;
  currentBalance: number;
  pendingBalance: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
  sponsor?: {
    id: string;
    username: string | null;
    referralCode: string;
  } | null;
}

export interface BackendAffiliateDashboard {
  profile: BackendAffiliateProfile;
  metrics: {
    lifetimeEarnings: number;
    pendingBalance: number;
    availableBalance: number;
    totalOrdersReferred: number;
    directReferralOrders: number;
  };
  recentCommissions: Array<{
    id: string;
    orderId: string;
    level: number;
    rate: number;
    amountUsd: number;
    status: string;
    createdAt: string;
    availableAt: string;
  }>;
}

export interface BackendLedgerEntry {
  id: string;
  orderId: string;
  orderNumber?: string;
  level: number;
  rate: number;
  commissionableBaseUsd: number;
  amountUsd: number;
  status: string;
  ruleVersion: string;
  parentLedgerId: string | null;
  note: string | null;
  createdAt: string;
  availableAt: string;
}

export interface BackendLedgerPage {
  entries: BackendLedgerEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BackendGenealogyNode {
  affiliateId: string;
  username: string;
  referralCode: string;
  level: number;
  isActive: boolean;
  payoutStatus: string;
  createdAt: string;
  children?: BackendGenealogyNode[];
}

/** Ledger statuses the backend accepts as a filter. */
export type LedgerStatusFilter =
  | 'pending'
  | 'available'
  | 'paid'
  | 'hold'
  | 'void'
  | 'reversed';

/* ------------------------------------------------------------------ *
 * Mapping helpers
 * ------------------------------------------------------------------ */

/** Maps a backend ledger status onto the frontend commission status union. */
function toCommissionStatus(status: string): CommissionRecord['status'] {
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

function tierLabelFor(level: number, ratePercent: number): string {
  const tier = COMMISSION_TIER_SCHEDULE.find((t) => t.level === level);
  if (tier) return `${tier.name} (${tier.ratePercent}%)`;
  return `Level ${level} (${ratePercent}%)`;
}

/**
 * Maps a server-calculated ledger entry onto the commission history row.
 *
 * Customer and product names are not part of the ledger response, so they are
 * left blank rather than guessed; the order number identifies the sale.
 */
export function mapLedgerEntry(entry: BackendLedgerEntry): CommissionRecord {
  const ratePercent = Number(entry.rate) * 100;

  return {
    id: entry.id,
    orderId: entry.orderNumber || entry.orderId,
    orderDate: entry.createdAt
      ? new Date(entry.createdAt).toISOString().split('T')[0]
      : '',
    customerName: '',
    productName: '',
    level: (entry.level === 0 ? 'personal' : entry.level) as CommissionTierLevel,
    levelLabel: tierLabelFor(entry.level, ratePercent),
    orderAmount: Number(entry.commissionableBaseUsd) || 0,
    commissionRate: Number(entry.rate) || 0,
    commissionAmount: Number(entry.amountUsd) || 0,
    status: toCommissionStatus(entry.status),
    ...(entry.status?.toLowerCase() === 'paid' && entry.availableAt
      ? { payoutDate: new Date(entry.availableAt).toISOString().split('T')[0] }
      : {}),
    ...(entry.note ? { unqualifiedReason: entry.note } : {}),
  };
}

/**
 * Maps a backend genealogy node onto the downline member view model.
 *
 * The genealogy response carries identity and status only. Personal sales,
 * team sales, team size, and generated commission are not exposed per member,
 * so they are reported as unavailable (0) rather than fabricated.
 */
export function mapGenealogyNode(node: BackendGenealogyNode): ReferralMember {
  const children = (node.children || []).map(mapGenealogyNode);

  return {
    id: node.affiliateId,
    name: node.username || node.referralCode,
    // Downline email addresses are deliberately not exposed by the backend.
    email: '',
    repUsername: node.username || node.referralCode,
    level: Math.min(Math.max(node.level, 1), 5) as ReferralMember['level'],
    rank: 'VIP Partner',
    joinDate: node.createdAt
      ? new Date(node.createdAt).toISOString().split('T')[0]
      : '',
    status: node.isActive ? 'active' : 'inactive',
    personalSales: 0,
    teamSales: 0,
    totalTeamMembers: countDescendants(node),
    commissionGenerated: 0,
    ...(children.length ? { children } : {}),
  };
}

function countDescendants(node: BackendGenealogyNode): number {
  if (!node.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + countDescendants(child),
    0
  );
}

/** Builds the public referral link for a username or referral code. */
export function buildReferralLink(handle: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://ilovesurprises.com';
  return `${origin}/${handle}`;
}

/**
 * Maps the backend dashboard payload onto the affiliate stats view model.
 *
 * Totals come straight from the affiliate profile and commission ledger.
 * Sales volume, rank progression, and conversion rate require order-level
 * affiliate reporting that the backend does not expose, so they are reported
 * as unavailable rather than estimated.
 */
export function mapDashboardToStats(
  dashboard: BackendAffiliateDashboard,
  downlineCount = 0,
  activeDownlineCount = 0
): AffiliateStats {
  const profile = dashboard.profile;
  const handle = profile.username || profile.referralCode;

  return {
    totalEarnings: Number(dashboard.metrics.lifetimeEarnings) || 0,
    availableBalance: Number(dashboard.metrics.availableBalance) || 0,
    pendingCommissions: Number(dashboard.metrics.pendingBalance) || 0,

    // Not exposed per-affiliate by the backend.
    lifetimeSalesVolume: 0,
    personalSalesVolume: 0,
    teamSalesVolume: 0,

    totalReferrals: downlineCount,
    activeReferrals: activeDownlineCount,
    conversionRate: 0,

    currentRank: 'VIP Partner',
    personalCommissionRate: Number(profile.commissionRate) || 0.2,
    repUsername: handle,
    customReferralCode: profile.referralCode,
    referralLink: buildReferralLink(handle),
  };
}

function flattenGenealogy(nodes: ReferralMember[]): ReferralMember[] {
  const flat: ReferralMember[] = [];
  const walk = (list: ReferralMember[]) => {
    list.forEach((member) => {
      flat.push(member);
      if (member.children?.length) walk(member.children);
    });
  };
  walk(nodes);
  return flat;
}

/* ------------------------------------------------------------------ *
 * Service
 * ------------------------------------------------------------------ */

export const affiliateService = {
  COMMISSION_TIER_SCHEDULE,
  buildReferralLink,

  /**
   * True when the signed-in user has no affiliate profile (backend 404).
   * Lets the UI show an enrollment prompt instead of an error.
   */
  isNotEnrolled(err: unknown): boolean {
    return err instanceof ApiError && err.statusCode === 404;
  },

  /** Raw dashboard payload from `GET /api/affiliates/me`. */
  async fetchDashboard(options?: {
    signal?: AbortSignal;
  }): Promise<BackendAffiliateDashboard> {
    const response = await apiClient.get<ApiResponse<BackendAffiliateDashboard>>(
      '/api/affiliates/me',
      undefined,
      { signal: options?.signal }
    );
    return unwrap<BackendAffiliateDashboard>(response, '/api/affiliates/me');
  },

  /**
   * Affiliate stats for the dashboard header.
   *
   * The downline tree is fetched alongside so referral counts are real; if
   * that call fails the counts stay at zero rather than being invented.
   */
  async fetchStats(options?: { signal?: AbortSignal }): Promise<AffiliateStats> {
    const dashboard = await this.fetchDashboard(options);

    let downline: ReferralMember[] = [];
    try {
      downline = await this.fetchGenealogy(options);
    } catch {
      downline = [];
    }

    const flat = flattenGenealogy(downline);
    const activeCount = flat.filter((m) => m.status === 'active').length;

    return mapDashboardToStats(dashboard, flat.length, activeCount);
  },

  /**
   * Commission ledger page from `GET /api/affiliates/me/ledger`.
   */
  async fetchLedgerPage(options?: {
    page?: number;
    limit?: number;
    status?: LedgerStatusFilter;
    signal?: AbortSignal;
  }): Promise<{ records: CommissionRecord[]; pagination: BackendLedgerPage['pagination'] }> {
    const response = await apiClient.get<ApiResponse<BackendLedgerPage>>(
      '/api/affiliates/me/ledger',
      {
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        ...(options?.status ? { status: options.status } : {}),
      },
      { signal: options?.signal }
    );

    const payload = unwrap<BackendLedgerPage>(response, '/api/affiliates/me/ledger');

    return {
      records: (payload.entries || []).map(mapLedgerEntry),
      pagination:
        payload.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /** Convenience wrapper returning just the first page of commission rows. */
  async fetchCommissions(options?: {
    signal?: AbortSignal;
    limit?: number;
  }): Promise<CommissionRecord[]> {
    const { records } = await this.fetchLedgerPage({
      limit: options?.limit ?? 100,
      signal: options?.signal,
    });
    return records;
  },

  /** Downline tree (up to 5 levels) from `GET /api/affiliates/me/genealogy`. */
  async fetchGenealogy(options?: {
    signal?: AbortSignal;
  }): Promise<ReferralMember[]> {
    const response = await apiClient.get<
      ApiResponse<{ genealogy: BackendGenealogyNode[] }>
    >('/api/affiliates/me/genealogy', undefined, { signal: options?.signal });

    const payload = unwrap<{ genealogy: BackendGenealogyNode[] }>(
      response,
      '/api/affiliates/me/genealogy'
    );

    return (payload.genealogy || []).map(mapGenealogyNode);
  },

  /** Flattened downline list, for roster and team tables. */
  async fetchAllReferralsFlat(options?: {
    signal?: AbortSignal;
  }): Promise<ReferralMember[]> {
    return flattenGenealogy(await this.fetchGenealogy(options));
  },

  /**
   * Resolves a referral handle via `GET /api/affiliates/resolve/:username`.
   *
   * This is also what records the referral visit server-side and sets the
   * backend's 30-day `ils_affiliate_id` HTTP-only attribution cookie, so
   * attribution survives cart, authentication, and checkout per the backend
   * contract. Returns null when the handle does not exist.
   */
  async resolveReferral(
    username: string,
    options?: { landingPage?: string; signal?: AbortSignal }
  ): Promise<{
    id: string;
    username: string | null;
    referralCode: string;
    status: string;
  } | null> {
    const handle = (username || '').trim();
    if (!handle) return null;

    try {
      const response = await apiClient.get<
        ApiResponse<{
          affiliate: {
            id: string;
            username: string | null;
            referralCode: string;
            status: string;
          };
        }>
      >(
        `/api/affiliates/resolve/${encodeURIComponent(handle)}`,
        options?.landingPage ? { landingPage: options.landingPage } : undefined,
        {
          signal: options?.signal,
          // The attribution cookie must be accepted and returned.
          credentials: 'include',
        }
      );

      const payload = unwrap<{
        affiliate: {
          id: string;
          username: string | null;
          referralCode: string;
          status: string;
        };
      }>(response, `/api/affiliates/resolve/${handle}`);

      return payload.affiliate || null;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) return null;
      throw err;
    }
  },

  /**
   * Enrolls the signed-in user as an affiliate via
   * `POST /api/affiliates/register`.
   */
  async registerAffiliate(params: {
    username: string;
    sponsorCodeOrId?: string;
    payoutMethod?: string;
    payoutDetails?: Record<string, any>;
  }): Promise<BackendAffiliateProfile> {
    const response = await apiClient.post<
      ApiResponse<{ affiliate: BackendAffiliateProfile }>
    >('/api/affiliates/register', {
      username: params.username.trim(),
      ...(params.sponsorCodeOrId ? { sponsorCodeOrId: params.sponsorCodeOrId } : {}),
      ...(params.payoutMethod ? { payoutMethod: params.payoutMethod } : {}),
      ...(params.payoutDetails ? { payoutDetails: params.payoutDetails } : {}),
    });

    const payload = unwrap<{ affiliate: BackendAffiliateProfile }>(
      response,
      '/api/affiliates/register'
    );
    return payload.affiliate;
  },

  /**
   * Payout history.
   *
   * BLOCKED: the `payout_requests` table exists in the database, but the
   * backend exposes no payout endpoint. An empty list lets the payouts panel
   * show an accurate empty state; no payout record is ever invented.
   */
  async fetchPayouts(): Promise<PayoutRecord[]> {
    return [];
  },

  /**
   * Payout requests (withdrawals).
   *
   * BLOCKED for the same reason: there is no endpoint to submit one, so this
   * reports unavailability instead of showing a withdrawal that never happened.
   */
  async requestPayout(): Promise<never> {
    throw new ApiError(
      'Withdrawals are not available yet: the backend has no payout endpoint.',
      501,
      'http',
      { endpoint: '/api/affiliates/me/payouts', method: 'POST' }
    );
  },

  /**
   * Changing a referral handle.
   *
   * BLOCKED: the backend sets the affiliate username at registration and
   * exposes no update route for it.
   */
  async updateRepUsername(): Promise<never> {
    throw new ApiError(
      'Changing your referral handle is not available yet: the backend has no affiliate profile update endpoint.',
      501,
      'http',
      { endpoint: '/api/affiliates/me', method: 'PATCH' }
    );
  },
};
