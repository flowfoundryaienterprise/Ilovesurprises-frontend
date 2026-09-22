import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { qualificationService } from './qualificationService';
import type { CommissionRecord, CommissionTierLevel, ReferralMember } from '../types';

export interface ProcessOrderCommissionsParams {
  orderId: string;
  orderAmount: number; // Subtotal (eligible product sales amount)
  customerName: string;
  customerEmail?: string;
  userId?: string;
  productName?: string;
  sessionRepUsername?: string;
  isPersonalPurchase?: boolean;
  isMembershipFee?: boolean;
  notes?: string;
}

export interface UplineNode {
  level: CommissionTierLevel;
  tierIndex: number; // 0 for personal, 1-5 for overrides
  repUsername: string;
  name: string;
  repId: string;
  ratePercent: number; // 20, 5, 4, 3, 2, 1
}

// 5-Level Commission Hierarchy Rates
export const COMMISSION_RATES = {
  PERSONAL: 20.0, // 20%
  LEVEL_1: 5.0,   // 5%
  LEVEL_2: 4.0,   // 4%
  LEVEL_3: 3.0,   // 3%
  LEVEL_4: 2.0,   // 2%
  LEVEL_5: 1.0,   // 1%
};

const COMMISSIONS_STORAGE_KEY = 'ilovesurprises_commissions_v1';
const GENEALOGY_TREE_KEY = 'ilovesurprises_genealogy_tree_v1';

export const commissionService = {
  /**
   * Resolves the 5-level sponsor upline for a representative
   */
  resolveUpline(directRepUsername: string): UplineNode[] {
    const cleanDirect = directRepUsername.toLowerCase().trim().replace(/^@/, '');
    const nodes: UplineNode[] = [];

    // 1. Level 0: Direct Representative (Personal 20%)
    const directRep = representativeService.lookupRepresentative(cleanDirect) || {
      id: `rep-${cleanDirect}`,
      name: cleanDirect.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      repUsername: cleanDirect,
      avatar: '/assets/ilovesurprises/Profile/profile image.webp',
      tagline: '',
      rank: 'VIP Partner',
      joinedYear: '2026',
      storeUrl: '',
      favoriteProduct: '',
    };

    if (!representativeService.isRepresentativeSuspended(cleanDirect)) {
      nodes.push({
        level: 'personal',
        tierIndex: 0,
        repUsername: directRep.repUsername,
        name: directRep.name,
        repId: directRep.id,
        ratePercent: COMMISSION_RATES.PERSONAL,
      });
    }

    // 2. Resolve 5-Level Upline Sponsors from Genealogy Map
    const uplineSponsors = this.findSponsorsInGenealogy(cleanDirect);
    const tierRates = [
      COMMISSION_RATES.LEVEL_1,
      COMMISSION_RATES.LEVEL_2,
      COMMISSION_RATES.LEVEL_3,
      COMMISSION_RATES.LEVEL_4,
      COMMISSION_RATES.LEVEL_5,
    ];

    uplineSponsors.slice(0, 5).forEach((sponsor, idx) => {
      if (!representativeService.isRepresentativeSuspended(sponsor.repUsername)) {
        nodes.push({
          level: (idx + 1) as CommissionTierLevel,
          tierIndex: idx + 1,
          repUsername: sponsor.repUsername,
          name: sponsor.name,
          repId: sponsor.id,
          ratePercent: tierRates[idx],
        });
      }
    });

    return nodes;
  },

  /**
   * Traverses genealogy to locate up to 5 parent sponsors
   */
  findSponsorsInGenealogy(targetRepUsername: string): { id: string; name: string; repUsername: string }[] {
    let tree: ReferralMember[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GENEALOGY_TREE_KEY);
        if (stored) tree = JSON.parse(stored);
      } catch {
        // fallback
      }
    }

    if (tree && tree.length > 0) {
      return tree
        .filter((s) => s.repUsername.toLowerCase() !== targetRepUsername.toLowerCase())
        .map((s) => ({ id: s.id, name: s.name, repUsername: s.repUsername }));
    }

    // If no custom tree, use default top leaders hierarchy
    const defaultSponsorChain = [
      { id: 'rep-01', name: 'Emily Watson', repUsername: 'emily_sparkles' },
      { id: 'rep-02', name: 'Jessica Miller', repUsername: 'jess_candles' },
      { id: 'rep-03', name: 'Marcus Sterling', repUsername: 'marcus_vip' },
      { id: 'rep-04', name: 'Rachel Adams', repUsername: 'rachel_cozy' },
      { id: 'rep-05', name: 'Grace Kelly', repUsername: 'grace_reveals' },
    ];

    // Filter out the direct rep from their own upline
    return defaultSponsorChain.filter((s) => s.repUsername.toLowerCase() !== targetRepUsername.toLowerCase());
  },

  /**
   * IDEMPOTENT Commission Processor:
   * 1. Resolves permanent lifetime attribution for customer.
   * 2. Checks if commissions for this orderId already exist (prevents duplicates).
   * 3. Calculates exact 20% personal + 5-tier overrides (up to 35% total).
   * 4. Enforces $125 monthly personal retail sales qualification for team/downline commissions.
   * 5. Persists to local ledger.
   */
  async processOrderCommissions(params: ProcessOrderCommissionsParams): Promise<CommissionRecord[]> {
    const { orderId, orderAmount, customerName, customerEmail, userId, productName, sessionRepUsername } = params;

    if (!orderId || orderAmount <= 0) {
      return [];
    }

    // Rule 1 & Rule 2: Rep Personal Purchases receive a 20% discount upfront,
    // but do NOT generate commission income for that Rep or downline volume.
    if (params.isPersonalPurchase || params.notes?.includes('rep_personal')) {
      return [];
    }

    // Rule 4: $20 Rep Signup / Monthly Fee Excluded
    if (
      params.isMembershipFee ||
      params.productName?.toLowerCase().includes('monthly license') ||
      params.productName?.toLowerCase().includes('consultant license') ||
      params.productName?.toLowerCase().includes('rep signup') ||
      params.notes?.toLowerCase().includes('membership_fee')
    ) {
      return [];
    }

    // Step 1: Idempotency Check
    const existingLocal = this.getStoredCommissions().filter((c) => c.orderId.toLowerCase() === orderId.toLowerCase());
    if (existingLocal.length > 0) {
      return existingLocal;
    }

    // Step 2: Lifetime Attribution Resolution
    const { repUsername: attributedRep } = await attributionService.resolveAttributionForCheckout({
      customerEmail,
      userId,
      currentSessionRep: sessionRepUsername,
    });

    if (!attributedRep) {
      return [];
    }

    // If first attributed purchase, establish permanent lifetime attribution
    if (customerEmail) {
      await attributionService.setPermanentAttribution({
        customerEmail,
        repUsername: attributedRep,
        userId,
        orderId,
      });
    }

    // Step 3: Resolve 5-Level Upline Nodes
    const uplineNodes = this.resolveUpline(attributedRep);
    if (uplineNodes.length === 0) {
      return [];
    }

    // Step 4: Calculate Commissions with 100% precision & Monthly $125 Downline Qualification Check
    const generatedCommissions: CommissionRecord[] = [];
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    for (const node of uplineNodes) {
      const rateDecimal = node.ratePercent / 100;
      const amount = parseFloat((orderAmount * rateDecimal).toFixed(2));

      // Check downline qualification for Levels 1–5
      let isPayable = true;
      let unqualifiedReason: string | undefined = undefined;

      if (node.level !== 'personal') {
        const isQualified = await qualificationService.isRepQualifiedForDownlineCommissions(
          node.repUsername,
          todayDate
        );
        if (!isQualified) {
          isPayable = false;
          unqualifiedReason =
            'Consultant requires at least $125 in qualifying retail customer sales this calendar month to receive team/downline commissions. Personal purchases excluded.';
        }
      }

      const status = isPayable ? 'pending' : 'unqualified';

      const commRecord: CommissionRecord = {
        id: `comm-${orderId}-${node.level}-${Date.now()}`,
        orderId,
        orderDate: todayDate,
        customerName: customerName || 'Valued Customer',
        productName: productName || 'Surprise Cash & Jewelry Candle Order',
        level: node.level,
        levelLabel:
          node.level === 'personal'
            ? `Personal Sale (${node.ratePercent}%)`
            : `Level ${node.level}: ${node.name} (${node.ratePercent}%)`,
        orderAmount,
        commissionRate: rateDecimal,
        commissionAmount: amount,
        status,
        unqualifiedReason,
      };

      generatedCommissions.push(commRecord);
    }

    // Step 5: Persist to Local Ledger
    this.saveCommissionsToStorage(generatedCommissions);

    return generatedCommissions;
  },

  /**
   * Re-evaluates and synchronizes downline commission eligibility for a representative
   */
  async syncMonthlyDownlineCommissions(repUsername: string, calendarMonth?: string): Promise<void> {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    const month = calendarMonth || qualificationService.getCalendarMonth();
    const isQualified = await qualificationService.isRepQualifiedForDownlineCommissions(cleanRep, month);

    const commissions = this.getStoredCommissions();
    let updated = false;

    const modified = commissions.map((c) => {
      if (c.level !== 'personal' && (c.orderDate || '').startsWith(month)) {
        if (isQualified && c.status === 'unqualified') {
          updated = true;
          return { ...c, status: 'pending' as const, unqualifiedReason: undefined };
        } else if (!isQualified && c.status === 'pending') {
          updated = true;
          return {
            ...c,
            status: 'unqualified' as const,
            unqualifiedReason: 'Requires at least $125 in qualifying retail customer sales this calendar month.',
          };
        }
      }
      return c;
    });

    if (updated && typeof window !== 'undefined') {
      try {
        localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(modified));
        window.dispatchEvent(new CustomEvent('ilovesurprises_commissions_updated'));
      } catch {
        // ignore
      }
    }
  },

  /**
   * Helper to retrieve stored commissions from localStorage
   */
  getStoredCommissions(): CommissionRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(COMMISSIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Helper to append commissions to local storage
   */
  saveCommissionsToStorage(newRecords: CommissionRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getStoredCommissions();
      const combined = [...newRecords, ...existing];
      localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent('ilovesurprises_commissions_updated'));
    } catch {
      // ignore
    }
  },
};
