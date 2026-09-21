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
    // Simulate brief latency (450ms)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const stats = this.getStats();
    if (params.amount < 25) {
      return { success: false, error: 'Minimum withdrawal threshold is $25.00' };
    }
    if (params.amount > stats.availableBalance) {
      return { success: false, error: `Requested amount exceeds available balance ($${stats.availableBalance.toFixed(2)})` };
    }

    const newPayout: PayoutRecord = {
      id: 'payout-' + Date.now(),
      amount: params.amount,
      fee: 0,
      netAmount: params.amount,
      method: params.method,
      destinationAccount: params.destinationAccount,
      requestedAt: new Date().toISOString(),
      status: 'processing',
      referenceId: 'REF-' + Math.floor(100000 + Math.random() * 900000),
    };

    // Update balances
    const updatedStats: AffiliateStats = {
      ...stats,
      availableBalance: stats.availableBalance - params.amount,
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
