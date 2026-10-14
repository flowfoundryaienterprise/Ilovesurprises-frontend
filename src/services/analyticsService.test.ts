import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  analyticsService,
  toBackendTimeframe,
  toUiTimeframe,
  formatUsd,
  type AnalyticsReport,
} from './analyticsService';
import { setStoredAuthToken } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const report: AnalyticsReport = {
  timeframe: '30D',
  dateRange: { startDate: '2026-09-14', endDate: '2026-10-14' },
  kpis: {
    grossSales: {
      value: 12450.75,
      formatted: '$12,450.75',
      subValue: 11980.5,
      subFormatted: 'Net Sales: $11,980.50',
    },
    trafficAndConversion: {
      value: 3.4,
      formatted: '3%',
      subValue: 8210,
      subFormatted: 'From 8210 unique web sessions',
    },
    membershipMrr: {
      value: 1899.05,
      formatted: '$1,899.05',
      subValue: 95,
      subFormatted: 'Across 95 active subscribers',
    },
    commissionLiability: {
      value: 2210.4,
      formatted: '$2,210.40',
      subValue: 5400.1,
      subFormatted: '$5,400.10 already disbursed',
    },
  },
  revenueTrajectory: {
    points: [
      { date: '2026-10-13', gmv: 400, ordersCount: 4, formattedGmv: '$400.00' },
      { date: '2026-10-14', gmv: 650, ordersCount: 6, formattedGmv: '$650.00' },
    ],
    aov: 86.46,
    formattedAov: 'AOV: $86.46',
    totalGmv: 12450.75,
  },
  shopperSessionsVsCheckouts: {
    points: [
      {
        date: '2026-10-13',
        sessions: 400,
        checkouts: 12,
        conversionRate: 3,
        formattedConversionRate: '3.0%',
      },
    ],
    avgConversion: 3.4,
    formattedAvgConversion: '3% Avg Conversion',
    totalSessions: 8210,
    totalCheckouts: 279,
  },
  commissionDistributionByTier: {
    tiers: [
      {
        level: 0,
        name: 'Direct Sale (20%)',
        ratePercent: 20,
        totalAmount: 1500,
        count: 30,
        formattedTotal: '$1,500.00',
      },
      {
        level: 1,
        name: 'Tier 1 Sponsor (5%)',
        ratePercent: 5,
        totalAmount: 500,
        count: 20,
        formattedTotal: '$500.00',
      },
    ],
    totalDistributedUsd: 2000,
    programCapPercent: 35,
  },
  subscriptionPlanBreakdown: {
    plans: [
      {
        planId: 'p1',
        name: 'Monthly Rep',
        price: 19.99,
        interval: 'monthly',
        subscriberCount: 95,
        mrr: 1899.05,
        formattedMrr: '$1,899.05',
      },
    ],
    totalMrr: 1899.05,
    totalActiveSubscribers: 95,
  },
  tabCounts: {
    salesAndOrders: 144,
    customerCohorts: 512,
    commissionLedger: 50,
    topAffiliates: 23,
  },
  orderMetrics: {
    paidOrders: 144,
    pendingOrders: 9,
    failedOrders: 3,
    refundedOrders: 2,
    totalOrders: 158,
    refundedAmount: 180,
    formattedRefundedAmount: '$180.00',
  },
  customerMetrics: {
    totalCustomers: 512,
    newCustomers: 61,
    returningCustomers: 451,
  },
  periodComparison: {
    previousDateRange: { startDate: '2026-08-15', endDate: '2026-09-14' },
    grossSales: { current: 12450.75, previous: 10000, changePercent: 24.51 },
    paidOrders: { current: 144, previous: 120, changePercent: 20 },
    averageOrderValue: { current: 86.46, previous: 83.33, changePercent: 3.76 },
  },
};

describe('analyticsService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setStoredAuthToken('admin-tok');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('timeframe conversion', () => {
    it('upper-cases the UI timeframe for the backend enum', () => {
      expect(toBackendTimeframe('7d')).toBe('7D');
      expect(toBackendTimeframe('30d')).toBe('30D');
      expect(toBackendTimeframe('90d')).toBe('90D');
      expect(toBackendTimeframe('ytd')).toBe('YTD');
    });

    it('falls back to a valid enum value for unexpected input', () => {
      // The backend rejects anything outside 7D|30D|90D|YTD with a 400.
      expect(toBackendTimeframe('all-time')).toBe('30D');
      expect(toBackendTimeframe('')).toBe('30D');
    });

    it('lower-cases a backend timeframe for the UI', () => {
      expect(toUiTimeframe('30D')).toBe('30d');
      expect(toUiTimeframe('YTD')).toBe('ytd');
    });

    it('sends the uppercase timeframe on the wire', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'success', data: report })
      );

      await analyticsService.fetchReport('30d');

      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).toContain('/api/admin/reports/analytics');
      expect(url).toContain('timeframe=30D');
      expect(url).not.toContain('timeframe=30d');
    });
  });

  describe('toAdminKPIs', () => {
    it('takes every financial figure from the backend', () => {
      const kpis = analyticsService.toAdminKPIs(report);

      expect(kpis.grossRevenue).toBe(12450.75);
      expect(kpis.averageOrderValue).toBe(86.46);
      expect(kpis.totalOrders).toBe(144);
      expect(kpis.totalCustomers).toBe(512);
      expect(kpis.monthlyRecurringRevenue).toBe(1899.05);
      expect(kpis.activeMemberships).toBe(95);
      expect(kpis.pendingCommissionLiability).toBe(2210.4);
      expect(kpis.totalCommissionsPaid).toBe(5400.1);
    });

    it('uses the backend growth comparison rather than computing one', () => {
      const kpis = analyticsService.toAdminKPIs(report);
      expect(kpis.grossRevenueMoM).toBe(24.51);
      expect(kpis.totalOrdersMoM).toBe(20);
    });

    it('prefers program-wide commission totals when available', () => {
      const kpis = analyticsService.toAdminKPIs(report, {
        programRules: {
          maxDistributionCapPercent: 35,
          payoutSchedule: 'monthly',
          activeQualificationRuleThreshold: 0,
          qualificationPolicyNote: '',
          policyStatus: 'active',
        },
        schedule: [],
        metrics: {
          totalCommissionsEarned: 9000,
          pendingLiability: 3333.33,
          availableBalance: 100,
          disbursedTotal: 7777.77,
          totalLedgerEntries: 400,
          activeConsultantsCount: 42,
        },
      });

      expect(kpis.pendingCommissionLiability).toBe(3333.33);
      expect(kpis.totalCommissionsPaid).toBe(7777.77);
      expect(kpis.activeRepresentatives).toBe(42);
    });
  });

  describe('toAdminReportData', () => {
    it('maps chart series from the backend points', () => {
      const data = analyticsService.toAdminReportData(report);

      expect(data.salesByDay).toEqual([
        { date: '2026-10-13', sales: 400, orders: 4 },
        { date: '2026-10-14', sales: 650, orders: 6 },
      ]);
      expect(data.trafficByDay).toEqual([
        { date: '2026-10-13', visitors: 400, orders: 12 },
      ]);
    });

    it('maps headline financials and the UI timeframe', () => {
      const data = analyticsService.toAdminReportData(report);

      expect(data.timeframe).toBe('30d');
      expect(data.grossSales).toBe(12450.75);
      expect(data.netSales).toBe(11980.5);
      expect(data.ordersCount).toBe(144);
      expect(data.averageOrderValue).toBe(86.46);
      expect(data.visitors).toBe(8210);
      expect(data.conversionRate).toBe(3.4);
      expect(data.membershipMRR).toBe(1899.05);
    });

    it('derives tier shares only from server totals', () => {
      const data = analyticsService.toAdminReportData(report);

      expect(data.tierDistribution).toEqual([
        { tier: 'Direct Sale (20%)', rate: '20%', amount: 1500, percentage: 75 },
        { tier: 'Tier 1 Sponsor (5%)', rate: '5%', amount: 500, percentage: 25 },
      ]);
    });

    it('avoids dividing by zero when nothing has been distributed', () => {
      const empty: AnalyticsReport = {
        ...report,
        commissionDistributionByTier: {
          tiers: [
            {
              level: 0,
              name: 'Direct Sale (20%)',
              ratePercent: 20,
              totalAmount: 0,
              count: 0,
              formattedTotal: '$0.00',
            },
          ],
          totalDistributedUsd: 0,
          programCapPercent: 35,
        },
      };

      expect(analyticsService.toAdminReportData(empty).tierDistribution[0].percentage).toBe(0);
    });

    it('maps the membership breakdown', () => {
      const data = analyticsService.toAdminReportData(report);
      expect(data.membershipBreakdown).toEqual([
        { plan: 'Monthly Rep', count: 95, revenue: 1899.05 },
      ]);
    });
  });

  describe('error propagation', () => {
    it('propagates a 403 so the UI can show a permission state', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse(
          { status: 'error', message: 'Forbidden: Insufficient permissions' },
          403
        )
      );

      await expect(analyticsService.fetchReport('30d')).rejects.toMatchObject({
        kind: 'forbidden',
      });
    });

    it('propagates a network failure rather than returning zeroed metrics', async () => {
      fetchMock.mockImplementation(() => {
        throw new TypeError('Failed to fetch');
      });

      await expect(analyticsService.fetchReport('7d')).rejects.toMatchObject({
        kind: 'network',
      });
    });
  });

  describe('currency formatting', () => {
    it('formats USD with two decimals', () => {
      expect(formatUsd(1234.5)).toBe('$1,234.50');
      expect(formatUsd(0)).toBe('$0.00');
      expect(formatUsd(null)).toBe('$0.00');
    });
  });
});
