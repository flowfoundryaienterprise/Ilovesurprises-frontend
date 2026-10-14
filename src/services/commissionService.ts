/**
 * Commission reference data.
 *
 * ## Commission calculation is server-side only
 *
 * This module previously computed the 5-level MLM payout chain in the browser
 * and wrote the resulting ledger entries to
 * `localStorage['ilovesurprises_commissions_v1']`. It was invoked from
 * `orderService.createOrder()`, so a locally simulated checkout minted
 * commission records that no database ever recorded.
 *
 * That is removed. The backend's commission engine
 * (`ilovesurprises-backend/src/services/commission.service.ts`) is the only
 * authority: it runs against confirmed orders, enforces the distribution cap
 * and self-referral rules, and writes `commission_ledger` rows. The frontend
 * reads those through `affiliateService` (`/api/affiliates/me/ledger`) and
 * `adminService` (`/api/admin/commission/ledger`).
 *
 * What remains here is the published rate schedule, used for labels and
 * explanatory copy only. No amount displayed anywhere is derived from it.
 */

/**
 * The approved commission schedule, mirroring the backend's `TIER_CONFIG`.
 * Level 0 is the selling representative's own commission.
 */
export const COMMISSION_RATES = {
  personal: 0.2,
  level1: 0.05,
  level2: 0.04,
  level3: 0.03,
  level4: 0.02,
  level5: 0.01,
} as const;

/** Maximum share of an order that can be distributed across all tiers. */
export const MAX_DISTRIBUTION_CAP_PERCENT = 35;

export interface CommissionTier {
  level: number;
  name: string;
  ratePercent: number;
  roleDescription: string;
}

/** The published tier schedule, for rendering the commission structure. */
export const COMMISSION_TIERS: CommissionTier[] = [
  { level: 0, name: 'Direct Sale', ratePercent: 20, roleDescription: 'Selling Representative' },
  { level: 1, name: 'Tier 1 Sponsor', ratePercent: 5, roleDescription: 'Level 1 Downline' },
  { level: 2, name: 'Tier 2 Leader', ratePercent: 4, roleDescription: 'Level 2 Downline' },
  { level: 3, name: 'Tier 3 Partner', ratePercent: 3, roleDescription: 'Level 3 Downline' },
  { level: 4, name: 'Tier 4 Network', ratePercent: 2, roleDescription: 'Level 4 Downline' },
  { level: 5, name: 'Tier 5 Infinity', ratePercent: 1, roleDescription: 'Level 5 Downline' },
];

/** Human-readable label for a tier level. */
export function commissionTierLabel(level: number | 'personal'): string {
  const numeric = level === 'personal' ? 0 : level;
  const tier = COMMISSION_TIERS.find((t) => t.level === numeric);
  return tier ? `${tier.name} (${tier.ratePercent}%)` : `Level ${numeric}`;
}

export const commissionService = {
  COMMISSION_RATES,
  COMMISSION_TIERS,
  MAX_DISTRIBUTION_CAP_PERCENT,
  commissionTierLabel,
};
