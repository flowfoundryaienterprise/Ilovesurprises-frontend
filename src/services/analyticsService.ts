/**
 * Admin analytics service.
 *
 * Every figure here originates from the backend's authoritative aggregation in
 * `GET /api/admin/reports/analytics` (backend/src/services/analytics.service.ts),
 * which sums only revenue-recognised orders in PostgreSQL. Nothing is computed
 * from browser storage and nothing is synthesised client-side — the mapping
 * below only reshapes server values into the existing admin view models.
 */

import { apiClient, unwrap, type ApiResponse } from './apiClient';
import type { AdminKPIs, AdminReportData } from '../types/admin';

/** Timeframe accepted by the backend. */
export type BackendTimeframe = '7D' | '30D' | '90D' | 'YTD';

/** Timeframe used by the existing admin UI. */
export type UiTimeframe = '7d' | '30d' | '90d' | 'ytd';

/**
 * The admin UI uses lowercase timeframe keys; the backend's Zod schema accepts
 * only uppercase (`z.enum(['7D','30D','90D','YTD'])`) and rejects anything else
 * with a 400. This is the single conversion point.
 */
export function toBackendTimeframe(timeframe: UiTimeframe | string): BackendTimeframe {
  const normalized = String(timeframe || '').trim().toUpperCase();
  switch (normalized) {
    case '7D':
      return '7D';
    case '30D':
      return '30D';
    case '90D':
      return '90D';
    case 'YTD':
      return 'YTD';
    default:
      return '30D';
  }
}

export function toUiTimeframe(timeframe: BackendTimeframe | string): UiTimeframe {
  const normalized = String(timeframe || '').trim().toLowerCase();
  if (normalized === '7d' || normalized === '30d' || normalized === '90d' || normalized === 'ytd') {
    return normalized;
  }
  return '30d';
}

/* ------------------------------------------------------------------ *
 * Backend response shapes (mirrors backend/src/types/analytics.types.ts)
 * ------------------------------------------------------------------ */

export interface KPICard {
  value: number;
  formatted: string;
  subValue?: number | string;
  subFormatted?: string;
  changePercent?: number;
}

export interface RevenueTrajectoryPoint {
  date: string;
  gmv: number;
  ordersCount: number;
  formattedGmv: string;
}

export interface ShopperSessionsPoint {
  date: string;
  sessions: number;
  checkouts: number;
  conversionRate: number;
  formattedConversionRate: string;
}

export interface CommissionTierDistribution {
  level: number;
  name: string;
  ratePercent: number;
  totalAmount: number;
  count: number;
  formattedTotal: string;
}

export interface SubscriptionPlanBreakdownItem {
  planId: string;
  name: string;
  price: number;
  interval: string;
  subscriberCount: number;
  mrr: number;
  formattedMrr: string;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  formattedRevenue: string;
}

export interface PeriodComparisonMetric {
  current: number;
  previous: number;
  changePercent: number;
}

export interface AnalyticsReport {
  timeframe: BackendTimeframe;
  dateRange: { startDate: string; endDate: string };
  kpis: {
    grossSales: KPICard;
    trafficAndConversion: KPICard;
    membershipMrr: KPICard;
    commissionLiability: KPICard;
  };
  revenueTrajectory: {
    points: RevenueTrajectoryPoint[];
    aov: number;
    formattedAov: string;
    totalGmv: number;
  };
  shopperSessionsVsCheckouts: {
    points: ShopperSessionsPoint[];
    avgConversion: number;
    formattedAvgConversion: string;
    totalSessions: number;
    totalCheckouts: number;
  };
  commissionDistributionByTier: {
    tiers: CommissionTierDistribution[];
    totalDistributedUsd: number;
    programCapPercent: number;
  };
  subscriptionPlanBreakdown: {
    plans: SubscriptionPlanBreakdownItem[];
    totalMrr: number;
    totalActiveSubscribers: number;
  };
  tabCounts: {
    salesAndOrders: number;
    customerCohorts: number;
    commissionLedger: number;
    topAffiliates: number;
  };
  /* Additive sections supplied by the backend. */
  orderMetrics?: {
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
    refundedOrders: number;
    totalOrders: number;
    refundedAmount: number;
    formattedRefundedAmount: string;
  };
  customerMetrics?: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  topSellingProducts?: TopSellingProduct[];
  affiliateAttributedSales?: {
    ordersCount: number;
    revenue: number;
    formattedRevenue: string;
    shareOfRevenuePercent: number;
  };
  periodComparison?: {
    previousDateRange: { startDate: string; endDate: string };
    grossSales: PeriodComparisonMetric;
    paidOrders: PeriodComparisonMetric;
    averageOrderValue: PeriodComparisonMetric;
  };
}

export interface CommissionCentralSummary {
  programRules: {
    maxDistributionCapPercent: number;
    payoutSchedule: string;
    activeQualificationRuleThreshold: number;
    qualificationPolicyNote: string;
    policyStatus: string;
  };
  schedule: Array<{
    level: number;
    tierName: string;
    ratePercent: number;
    roleDescription: string;
  }>;
  metrics: {
    totalCommissionsEarned: number;
    pendingLiability: number;
    availableBalance: number;
    disbursedTotal: number;
    totalLedgerEntries: number;
    activeConsultantsCount: number;
  };
}

/* ------------------------------------------------------------------ *
 * Fetchers
 * ------------------------------------------------------------------ */

export const analyticsService = {
  toBackendTimeframe,
  toUiTimeframe,

  /**
   * Fetches the authoritative analytics report. Errors propagate so the UI can
   * show a real error state with a retry rather than zeroed-out metrics that
   * would read as genuine data.
   */
  async fetchReport(
    timeframe: UiTimeframe | BackendTimeframe = '30d',
    options?: { signal?: AbortSignal }
  ): Promise<AnalyticsReport> {
    const response = await apiClient.get<ApiResponse<AnalyticsReport>>(
      '/api/admin/reports/analytics',
      { timeframe: toBackendTimeframe(timeframe) },
      { signal: options?.signal }
    );
    return unwrap<AnalyticsReport>(response, '/api/admin/reports/analytics');
  },

  /** Program-wide commission totals and the published tier schedule. */
  async fetchCommissionCentral(options?: {
    signal?: AbortSignal;
  }): Promise<CommissionCentralSummary> {
    const response = await apiClient.get<ApiResponse<CommissionCentralSummary>>(
      '/api/admin/commission/central',
      undefined,
      { signal: options?.signal }
    );
    return unwrap<CommissionCentralSummary>(
      response,
      '/api/admin/commission/central'
    );
  },

  /**
   * Maps the backend report onto the admin overview KPI view model.
   *
   * `commissionCentral` supplies program-wide commission totals (lifetime),
   * whereas the report's `commissionLiability` is scoped to the timeframe.
   */
  toAdminKPIs(
    report: AnalyticsReport,
    commissionCentral?: CommissionCentralSummary | null
  ): AdminKPIs {
    const comparison = report.periodComparison;
    const orders = report.orderMetrics;
    const customers = report.customerMetrics;

    const ordersCount = orders?.paidOrders ?? comparison?.paidOrders.current ?? 0;

    return {
      grossRevenue: report.kpis.grossSales.value,
      grossRevenueMoM: comparison?.grossSales.changePercent ?? 0,

      totalOrders: ordersCount,
      totalOrdersMoM: comparison?.paidOrders.changePercent ?? 0,

      totalCustomers: customers?.totalCustomers ?? report.tabCounts.customerCohorts,
      // The backend reports new vs returning customers but no period-over-period
      // customer delta, so this is left at 0 rather than estimated.
      totalCustomersMoM: 0,

      activeRepresentatives:
        commissionCentral?.metrics.activeConsultantsCount ??
        report.tabCounts.topAffiliates,
      activeRepresentativesMoM: 0,

      activeMemberships: report.subscriptionPlanBreakdown.totalActiveSubscribers,
      activeMembershipsMoM: 0,

      monthlyRecurringRevenue: report.subscriptionPlanBreakdown.totalMrr,

      pendingCommissionLiability:
        commissionCentral?.metrics.pendingLiability ??
        report.kpis.commissionLiability.value,

      totalCommissionsPaid:
        commissionCentral?.metrics.disbursedTotal ??
        Number(report.kpis.commissionLiability.subValue ?? 0),

      averageOrderValue: report.revenueTrajectory.aov,
    };
  },

  /**
   * Maps the backend report onto the admin reports/analytics view model used by
   * the existing charts, preserving their expected field names and shapes.
   */
  toAdminReportData(
    report: AnalyticsReport,
    commissionCentral?: CommissionCentralSummary | null
  ): AdminReportData {
    const netSales = Number(report.kpis.grossSales.subValue ?? report.kpis.grossSales.value);
    const totalDistributed = report.commissionDistributionByTier.totalDistributedUsd;

    return {
      timeframe: toUiTimeframe(report.timeframe),

      grossSales: report.kpis.grossSales.value,
      netSales,
      ordersCount:
        report.orderMetrics?.paidOrders ?? report.tabCounts.salesAndOrders,
      averageOrderValue: report.revenueTrajectory.aov,

      visitors: report.shopperSessionsVsCheckouts.totalSessions,
      conversionRate: report.shopperSessionsVsCheckouts.avgConversion,

      activeRepresentatives:
        commissionCentral?.metrics.activeConsultantsCount ??
        report.tabCounts.topAffiliates,

      membershipMRR: report.subscriptionPlanBreakdown.totalMrr,

      commissionLiability:
        commissionCentral?.metrics.pendingLiability ??
        report.kpis.commissionLiability.value,

      totalPayoutsDisbursed:
        commissionCentral?.metrics.disbursedTotal ??
        Number(report.kpis.commissionLiability.subValue ?? 0),

      salesByDay: report.revenueTrajectory.points.map((p) => ({
        date: p.date,
        sales: p.gmv,
        orders: p.ordersCount,
      })),

      trafficByDay: report.shopperSessionsVsCheckouts.points.map((p) => ({
        date: p.date,
        visitors: p.sessions,
        orders: p.checkouts,
      })),

      tierDistribution: report.commissionDistributionByTier.tiers.map((t) => ({
        tier: t.name,
        rate: `${t.ratePercent}%`,
        amount: t.totalAmount,
        // Share of distributed commission, computed from server totals only.
        percentage:
          totalDistributed > 0
            ? Number(((t.totalAmount / totalDistributed) * 100).toFixed(1))
            : 0,
      })),

      membershipBreakdown: report.subscriptionPlanBreakdown.plans.map((p) => ({
        plan: p.name,
        count: p.subscriberCount,
        revenue: p.mrr,
      })),
    };
  },
};

/** Formats a USD amount the same way the backend's `formatCurrency` does. */
export function formatUsd(amount: number | null | undefined): string {
  const value = Number(amount || 0);
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
