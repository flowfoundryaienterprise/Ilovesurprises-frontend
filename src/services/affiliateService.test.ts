import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  affiliateService,
  mapLedgerEntry,
  mapGenealogyNode,
  mapDashboardToStats,
  COMMISSION_TIER_SCHEDULE,
  type BackendAffiliateDashboard,
  type BackendGenealogyNode,
} from './affiliateService';
import { setStoredAuthToken } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const dashboardPayload: BackendAffiliateDashboard = {
  profile: {
    id: 'aff_1',
    userId: 'usr_1',
    username: 'jamie',
    referralCode: 'JAMIE10',
    slug: null,
    sponsorId: null,
    status: 'active',
    isActive: true,
    payoutStatus: 'eligible',
    lifetimeEarnings: 742.5,
    currentBalance: 310.25,
    pendingBalance: 120,
    commissionRate: 0.2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  metrics: {
    lifetimeEarnings: 742.5,
    pendingBalance: 120,
    availableBalance: 310.25,
    totalOrdersReferred: 18,
    directReferralOrders: 11,
  },
  recentCommissions: [],
};

describe('affiliateService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setStoredAuthToken('tok');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('commission schedule', () => {
    it('matches the backend TIER_CONFIG rates', () => {
      expect(COMMISSION_TIER_SCHEDULE.map((t) => t.ratePercent)).toEqual([
        20, 5, 4, 3, 2, 1,
      ]);
    });

    it('covers the selling rep plus five downline levels', () => {
      expect(COMMISSION_TIER_SCHEDULE.map((t) => t.level)).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('mapDashboardToStats', () => {
    it('uses backend balances verbatim', () => {
      const stats = mapDashboardToStats(dashboardPayload, 7, 4);

      expect(stats.totalEarnings).toBe(742.5);
      expect(stats.availableBalance).toBe(310.25);
      expect(stats.pendingCommissions).toBe(120);
      expect(stats.totalReferrals).toBe(7);
      expect(stats.activeReferrals).toBe(4);
      expect(stats.repUsername).toBe('jamie');
      expect(stats.customReferralCode).toBe('JAMIE10');
    });

    it('reports unexposed sales volume as zero rather than estimating it', () => {
      const stats = mapDashboardToStats(dashboardPayload);
      expect(stats.lifetimeSalesVolume).toBe(0);
      expect(stats.personalSalesVolume).toBe(0);
      expect(stats.teamSalesVolume).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });
  });

  describe('mapLedgerEntry', () => {
    it('uses the server-calculated commission amount, never recomputing it', () => {
      // Deliberately inconsistent: rate x base would be 5.00, but the server
      // said 4.17 (e.g. after a cap). The server value must win.
      const record = mapLedgerEntry({
        id: 'led_1',
        orderId: 'ord_1',
        orderNumber: 'ILS-1001',
        level: 1,
        rate: 0.05,
        commissionableBaseUsd: 100,
        amountUsd: 4.17,
        status: 'PENDING',
        ruleVersion: 'v1',
        parentLedgerId: null,
        note: null,
        createdAt: '2026-03-02T10:00:00.000Z',
        availableAt: '2026-04-01T00:00:00.000Z',
      });

      expect(record.commissionAmount).toBe(4.17);
      expect(record.orderAmount).toBe(100);
      expect(record.commissionRate).toBe(0.05);
      expect(record.orderId).toBe('ILS-1001');
      expect(record.levelLabel).toBe('Tier 1 Sponsor (5%)');
    });

    it('maps level 0 to the selling representative tier', () => {
      const record = mapLedgerEntry({
        id: 'led_2',
        orderId: 'ord_2',
        level: 0,
        rate: 0.2,
        commissionableBaseUsd: 50,
        amountUsd: 10,
        status: 'AVAILABLE',
        ruleVersion: 'v1',
        parentLedgerId: null,
        note: null,
        createdAt: '2026-03-02T10:00:00.000Z',
        availableAt: '2026-03-02T10:00:00.000Z',
      });

      expect(record.level).toBe('personal');
      expect(record.levelLabel).toBe('Direct Sale (20%)');
      expect(record.status).toBe('approved');
    });

    it('maps every backend status, handling uppercase values', () => {
      const build = (status: string) =>
        mapLedgerEntry({
          id: 's',
          orderId: 'o',
          level: 1,
          rate: 0.05,
          commissionableBaseUsd: 10,
          amountUsd: 0.5,
          status,
          ruleVersion: 'v1',
          parentLedgerId: null,
          note: null,
          createdAt: '2026-03-02T10:00:00.000Z',
          availableAt: '2026-03-02T10:00:00.000Z',
        }).status;

      expect(build('PENDING')).toBe('pending');
      expect(build('AVAILABLE')).toBe('approved');
      expect(build('PAID')).toBe('paid');
      expect(build('REVERSED')).toBe('reversed');
      expect(build('VOID')).toBe('reversed');
      expect(build('HOLD')).toBe('unqualified');
    });

    it('leaves customer and product blank rather than inventing them', () => {
      const record = mapLedgerEntry({
        id: 'led_3',
        orderId: 'ord_3',
        level: 2,
        rate: 0.04,
        commissionableBaseUsd: 25,
        amountUsd: 1,
        status: 'pending',
        ruleVersion: 'v1',
        parentLedgerId: null,
        note: null,
        createdAt: '2026-03-02T10:00:00.000Z',
        availableAt: '2026-03-02T10:00:00.000Z',
      });

      expect(record.customerName).toBe('');
      expect(record.productName).toBe('');
    });
  });

  describe('mapGenealogyNode', () => {
    const tree: BackendGenealogyNode = {
      affiliateId: 'aff_2',
      username: 'riley',
      referralCode: 'RILEY7',
      level: 1,
      isActive: true,
      payoutStatus: 'eligible',
      createdAt: '2026-02-01T00:00:00.000Z',
      children: [
        {
          affiliateId: 'aff_3',
          username: 'sam',
          referralCode: 'SAM3',
          level: 2,
          isActive: false,
          payoutStatus: 'hold',
          createdAt: '2026-02-10T00:00:00.000Z',
        },
      ],
    };

    it('maps identity and status from the backend', () => {
      const member = mapGenealogyNode(tree);
      expect(member.id).toBe('aff_2');
      expect(member.repUsername).toBe('riley');
      expect(member.level).toBe(1);
      expect(member.status).toBe('active');
      expect(member.children).toHaveLength(1);
      expect(member.children?.[0].status).toBe('inactive');
    });

    it('does not invent per-member sales or earnings', () => {
      const member = mapGenealogyNode(tree);
      expect(member.personalSales).toBe(0);
      expect(member.teamSales).toBe(0);
      expect(member.commissionGenerated).toBe(0);
      // Downline emails are not exposed by the backend.
      expect(member.email).toBe('');
    });

    it('counts real descendants rather than guessing team size', () => {
      expect(mapGenealogyNode(tree).totalTeamMembers).toBe(1);
      expect(mapGenealogyNode(tree.children![0]).totalTeamMembers).toBe(0);
    });
  });

  describe('fetchGenealogy', () => {
    it('returns an accurate empty tree for an affiliate with no referrals', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'success', data: { genealogy: [] } })
      );

      await expect(affiliateService.fetchGenealogy()).resolves.toEqual([]);
    });

    it('calls the real genealogy endpoint', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'success', data: { genealogy: [] } })
      );

      await affiliateService.fetchGenealogy();
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        '/api/affiliates/me/genealogy'
      );
    });
  });

  describe('enrollment state', () => {
    it('treats a 404 as "not enrolled" rather than an error', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'error', message: 'Affiliate profile not found' }, 404)
      );

      const err = await affiliateService.fetchDashboard().catch((e) => e);
      expect(affiliateService.isNotEnrolled(err)).toBe(true);
    });

    it('does not treat a 500 as "not enrolled"', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'error' }, 500));
      const err = await affiliateService.fetchDashboard().catch((e) => e);
      expect(affiliateService.isNotEnrolled(err)).toBe(false);
    });
  });

  describe('referral resolution', () => {
    it('resolves a handle through the backend so the attribution cookie is set', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: {
            affiliate: {
              id: 'aff_1',
              username: 'jamie',
              referralCode: 'JAMIE10',
              status: 'active',
            },
          },
        })
      );

      const affiliate = await affiliateService.resolveReferral('jamie');

      expect(affiliate?.username).toBe('jamie');
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        '/api/affiliates/resolve/jamie'
      );
      // Credentials must be included for the HTTP-only cookie to be stored.
      expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
    });

    it('returns null for an unknown handle instead of throwing', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'error', message: 'not found' }, 404)
      );

      await expect(affiliateService.resolveReferral('nobody')).resolves.toBeNull();
    });

    it('ignores an empty handle without calling the API', async () => {
      await expect(affiliateService.resolveReferral('  ')).resolves.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('unsupported operations', () => {
    it('reports payouts as unavailable instead of inventing history', async () => {
      await expect(affiliateService.fetchPayouts()).resolves.toEqual([]);
    });

    it('refuses to fake a withdrawal', async () => {
      await expect(affiliateService.requestPayout()).rejects.toThrow(
        /no payout endpoint/i
      );
    });

    it('refuses to fake a handle change', async () => {
      await expect(affiliateService.updateRepUsername()).rejects.toThrow(
        /no affiliate profile update endpoint/i
      );
    });
  });

  describe('no local storage of earnings', () => {
    it('writes no affiliate figures to localStorage', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (String(url).includes('genealogy')) {
          return jsonResponse({ status: 'success', data: { genealogy: [] } });
        }
        return jsonResponse({ status: 'success', data: dashboardPayload });
      });

      await affiliateService.fetchStats();

      expect(localStorage.getItem('ilovesurprises_affiliate_stats_v1')).toBeNull();
      expect(localStorage.getItem('ilovesurprises_commissions_v1')).toBeNull();
      expect(localStorage.getItem('ilovesurprises_genealogy_tree_v1')).toBeNull();
      expect(localStorage.getItem('ilovesurprises_payouts_v1')).toBeNull();
    });
  });
});
