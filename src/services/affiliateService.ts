import { apiClient } from './apiClient';
import type {
  AffiliateStats,
  CommissionRecord,
  PayoutRecord,
  PayoutMethod,
  ReferralMember,
} from '../types';
import { qualificationService } from './qualificationService';

const AFFILIATE_STATS_KEY = 'ilovesurprises_affiliate_stats_v1';
const COMMISSIONS_KEY = 'ilovesurprises_commissions_v1';
const PAYOUTS_KEY = 'ilovesurprises_payouts_v1';
const GENEALOGY_TREE_KEY = 'ilovesurprises_genealogy_tree_v1';

// Empty default genealogy tree (populated by real sponsor downlines)
const DEFAULT_GENEALOGY_TREE: ReferralMember[] = [];

// Empty default commissions ledger (populated by real orders)
const DEFAULT_COMMISSION_RECORDS: CommissionRecord[] = [];

// Empty default payouts history (populated by real payout requests)
const DEFAULT_PAYOUT_RECORDS: PayoutRecord[] = [];

export const affiliateService = {
  /**
   * Retrieves live affiliate stats and balances
   */
  async fetchStats(): Promise<AffiliateStats> {
    const token = apiClient.getAuthToken();
    if (!token) return this.getStats();

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          lifetimeEarnings: number;
          availableBalance: number;
          pendingBalance: number;
          teamSalesVolume: number;
          personalSalesVolume: number;
          totalReferrals: number;
          activeReferrals: number;
          conversionRate: number;
          rank: string;
          directCommissionRate: number;
          referralLink: string;
          referralCode: string;
          profile: {
            repUsername?: string;
          };
        };
      }>('/api/affiliates/dashboard');

      if (response.data) {
        const d = response.data;
        const current = this.getStats();
        const updated: AffiliateStats = {
          ...current,
          totalEarnings: Number(d.lifetimeEarnings) || 0,
          availableBalance: Number(d.availableBalance) || 0,
          pendingCommissions: Number(d.pendingBalance) || 0,
          lifetimeSalesVolume: (Number(d.personalSalesVolume) || 0) + (Number(d.teamSalesVolume) || 0),
          personalSalesVolume: Number(d.personalSalesVolume) || 0,
          teamSalesVolume: Number(d.teamSalesVolume) || 0,
          totalReferrals: Number(d.totalReferrals) || 0,
          activeReferrals: Number(d.activeReferrals) || 0,
          conversionRate: Number(d.conversionRate) || 0,
          currentRank: (d.rank as any) || 'VIP Partner',
          personalCommissionRate: Number(d.directCommissionRate) || 0.20,
          repUsername: d.profile?.repUsername || current.repUsername || '',
          customReferralCode: d.referralCode || current.customReferralCode || '',
          referralLink: d.referralLink || current.referralLink,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
        }
        return updated;
      }
    } catch {
      // fallback
    }
    return this.getStats();
  },

  async fetchCommissions(): Promise<CommissionRecord[]> {
    const token = apiClient.getAuthToken();
    if (!token) return this.getCommissions();

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          commissions: Array<{
            id: string;
            orderId: string;
            amount: number;
            rate: number;
            level: number;
            type: string;
            status: string;
            createdAt: string;
            referredCustomerName?: string;
            orderAmount?: number;
          }>;
        };
      }>('/api/affiliates/commissions');

      if (response.data && Array.isArray(response.data.commissions)) {
        const mapped: CommissionRecord[] = response.data.commissions.map((c) => ({
          id: c.id,
          orderId: c.orderId,
          orderDate: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          customerName: c.referredCustomerName || 'Store Customer',
          productName: 'Surprise Candles & Melts',
          level: (c.level === 0 ? 'direct' : `level_${c.level}`) as any,
          levelLabel: c.level === 0 ? 'Personal Sale (20%)' : `Level ${c.level} Referral (${Number(c.rate) * 100}%)`,
          orderAmount: Number(c.orderAmount) || 50,
          commissionRate: Number(c.rate) || 0.2,
          commissionAmount: Number(c.amount) || 10,
          status: (c.status as any) || 'pending',
        }));

        if (typeof window !== 'undefined') {
          localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(mapped));
          window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
        }
        return mapped;
      }
    } catch {
      // fallback
    }
    return this.getCommissions();
  },

  async fetchPayouts(): Promise<PayoutRecord[]> {
    const token = apiClient.getAuthToken();
    if (!token) return this.getPayouts();

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          payouts: Array<{
            id: string;
            amount: number;
            netAmount?: number;
            method: string;
            destinationAccount: string;
            status: string;
            referenceId?: string;
            createdAt: string;
            processedAt?: string;
          }>;
        };
      }>('/api/affiliates/payouts');

      if (response.data && Array.isArray(response.data.payouts)) {
        const mapped: PayoutRecord[] = response.data.payouts.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          fee: 0,
          netAmount: Number(p.netAmount || p.amount),
          method: (p.method as any) || 'paypal',
          destinationAccount: p.destinationAccount,
          requestedAt: p.createdAt,
          processedAt: p.processedAt,
          status: (p.status as any) || 'processing',
          referenceId: p.referenceId || `REF-${p.id.slice(-6).toUpperCase()}`,
        }));

        if (typeof window !== 'undefined') {
          localStorage.setItem(PAYOUTS_KEY, JSON.stringify(mapped));
          window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
        }
        return mapped;
      }
    } catch {
      // fallback
    }
    return this.getPayouts();
  },

  getStats(): AffiliateStats {
    let base: AffiliateStats;
    if (typeof window === 'undefined') {
      base = this.getDefaultStats();
    } else {
      try {
        const stored = localStorage.getItem(AFFILIATE_STATS_KEY);
        if (stored) {
          base = JSON.parse(stored);
        } else {
          base = this.getDefaultStats();
          localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(base));
        }
      } catch {
        base = this.getDefaultStats();
      }
    }

    // Attach deterministic monthly qualification
    const repUsername = base.repUsername || '';
    if (repUsername) {
      const qual = qualificationService.getCachedQualification(repUsername);
      base.monthlyQualification = qual;
    }

    return base;
  },

  getDefaultStats(): AffiliateStats {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';
    return {
      totalEarnings: 0,
      availableBalance: 0,
      pendingCommissions: 0,
      lifetimeSalesVolume: 0,
      personalSalesVolume: 0,
      teamSalesVolume: 0,
      totalReferrals: 0,
      activeReferrals: 0,
      conversionRate: 0,
      currentRank: 'VIP Partner',
      personalCommissionRate: 0.20,
      repUsername: '',
      customReferralCode: '',
      referralLink: `${origin}/shop`,
    };
  },

  /**
   * Retrieves commission records
   */
  getCommissions(): CommissionRecord[] {
    if (typeof window === 'undefined') return DEFAULT_COMMISSION_RECORDS;
    try {
      const stored = localStorage.getItem(COMMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(DEFAULT_COMMISSION_RECORDS));
      return DEFAULT_COMMISSION_RECORDS;
    } catch {
      return DEFAULT_COMMISSION_RECORDS;
    }
  },

  /**
   * Retrieves payout history
   */
  getPayouts(): PayoutRecord[] {
    if (typeof window === 'undefined') return DEFAULT_PAYOUT_RECORDS;
    try {
      const stored = localStorage.getItem(PAYOUTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(DEFAULT_PAYOUT_RECORDS));
      return DEFAULT_PAYOUT_RECORDS;
    } catch {
      return DEFAULT_PAYOUT_RECORDS;
    }
  },

  /**
   * Retrieves the 5-level referral genealogy tree
   */
  getGenealogyTree(): ReferralMember[] {
    if (typeof window === 'undefined') return DEFAULT_GENEALOGY_TREE;
    try {
      const stored = localStorage.getItem(GENEALOGY_TREE_KEY);
      if (stored) {
        const parsed: ReferralMember[] = JSON.parse(stored);
        const sanitizeNode = (node: ReferralMember): ReferralMember => ({
          ...node,
          avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
          children: node.children ? node.children.map(sanitizeNode) : undefined,
        });
        return parsed.map(sanitizeNode);
      }
      localStorage.setItem(GENEALOGY_TREE_KEY, JSON.stringify(DEFAULT_GENEALOGY_TREE));
      return DEFAULT_GENEALOGY_TREE;
    } catch {
      return DEFAULT_GENEALOGY_TREE;
    }
  },

  /**
   * Flattens the 5-level genealogy tree into a list for searching & filtering
   */
  getAllReferralsFlat(): ReferralMember[] {
    const tree = this.getGenealogyTree();
    const result: ReferralMember[] = [];

    const traverse = (node: ReferralMember) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    tree.forEach(traverse);
    return result;
  },

  /**
   * Submits a payout / withdrawal request
   */
  async requestPayout(params: {
    amount: number;
    method: PayoutMethod;
    destinationAccount: string;
  }): Promise<{ success: boolean; payout?: PayoutRecord; error?: string }> {
    const stats = this.getStats();
    if (params.amount < 25) {
      return { success: false, error: 'Minimum withdrawal threshold is $25.00' };
    }
    if (params.amount > stats.availableBalance) {
      return { success: false, error: `Requested amount exceeds available balance (${stats.availableBalance.toFixed(2)})` };
    }

    let backendPayout: any = null;
    const token = apiClient.getAuthToken();
    if (token) {
      try {
        const response = await apiClient.post<{
          success: boolean;
          data: { payout: any };
        }>('/api/affiliates/payout-request', {
          amount: params.amount,
          method: params.method,
          destinationAccount: params.destinationAccount,
        });
        backendPayout = response.data?.payout;
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to submit withdrawal request to server.' };
      }
    }

    const newPayout: PayoutRecord = {
      id: backendPayout?.id || 'payout-' + Date.now(),
      amount: params.amount,
      fee: 0,
      netAmount: params.amount,
      method: params.method,
      destinationAccount: params.destinationAccount,
      requestedAt: backendPayout?.createdAt || new Date().toISOString(),
      status: (backendPayout?.status as any) || 'processing',
      referenceId: backendPayout?.referenceId || ('REF-' + Math.floor(100000 + Math.random() * 900000)),
    };

    // Update balances
    const updatedStats: AffiliateStats = {
      ...stats,
      availableBalance: Math.max(0, stats.availableBalance - params.amount),
    };

    const payouts = this.getPayouts();
    const updatedPayouts = [newPayout, ...payouts];

    if (typeof window !== 'undefined') {
      localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(updatedStats));
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(updatedPayouts));
      window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
    }

    return { success: true, payout: newPayout };
  },

  /**
   * Updates representative custom username & referral link
   */
  updateRepUsername(newUsername: string): AffiliateStats {
    const cleaned = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const stats = this.getStats();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';

    const updated: AffiliateStats = {
      ...stats,
      repUsername: cleaned,
      referralLink: `${origin}/shop?rep=${cleaned}`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
    }

    return updated;
  },
};
