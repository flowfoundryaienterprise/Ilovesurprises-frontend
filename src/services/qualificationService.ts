import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import type { MonthlyQualificationRecord } from '../types';

/**
 * Monthly Personal Volume Qualification Service
 * Enforces the Founder Requirement:
 * "Surprise Consultants must generate at least $125 in qualifying retail customer sales
 * each calendar month to receive team/downline commissions. Personal purchases made by
 * the Consultant do not count toward the $125 retail sales requirement."
 */

export const QUALIFICATION_THRESHOLD = 125.00;
const QUALIFICATION_REGISTRY_KEY = 'ilovesurprises_monthly_qualifications_v1';
const ORDERS_STORAGE_KEY = 'ilovesurprises_orders_v1';

export const qualificationService = {
  /**
   * Returns standard "YYYY-MM" calendar month string
   */
  getCalendarMonth(dateInput?: Date | string | null): string {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  /**
   * Calculates calendar month start and end dates (UTC)
   */
  getMonthBoundaries(calendarMonth: string): { startIso: string; endIso: string } {
    const [yearStr, monthStr] = calendarMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Day 0 of next month is the last day of current month
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  },

  /**
   * Retrieves stored qualifications from persistent registry
   */
  getStoredRegistry(): Record<string, MonthlyQualificationRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(QUALIFICATION_REGISTRY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /**
   * Generates compound registry key: "repUsername:YYYY-MM"
   */
  getCompoundKey(repUsername: string, calendarMonth: string): string {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    return `${cleanRep}:${calendarMonth}`;
  },

  /**
   * Checks if an order was placed by the representative themselves (Personal Purchase)
   * Personal purchases are strictly excluded from the $125 retail sales requirement.
   */
  isPersonalPurchase(order: any, repUsername: string): boolean {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    const directRep = representativeService.lookupRepresentative(cleanRep);

    // 1. Check explicit flags
    if (
      order.isPersonalPurchase === true ||
      order.is_personal_order === true ||
      order.orderType === 'rep_personal' ||
      order.order_type === 'rep_personal'
    ) {
      return true;
    }

    // 2. Check notes
    const notes = (order.notes || '').toLowerCase();
    if (notes.includes('personal_purchase') || notes.includes('rep_personal_order') || notes.includes('rep_personal')) {
      return true;
    }

    // 3. Match purchaser representative username
    const purchaserRep = (order.purchaserRepUsername || order.purchaser_rep_username || '').toLowerCase().trim().replace(/^@/, '');
    if (purchaserRep && purchaserRep === cleanRep) {
      return true;
    }

    // 4. Match customer email against consultant email
    const orderEmail = (
      order.shippingAddress?.email ||
      order.customerEmail ||
      order.customer_email ||
      order.email ||
      ''
    ).toLowerCase().trim();

    if (directRep) {
      const repEmails = [
        `${cleanRep}@ilovesurprises.com`,
        `${cleanRep}@scentlovers.com`,
        `${cleanRep}@sparkles.com`,
        (directRep as any).email?.toLowerCase().trim(),
      ].filter(Boolean);
      if (repEmails.some((e) => orderEmail === e)) return true;
    }

    // 5. Match userId if available
    if (order.userId && directRep && (order.userId === directRep.id || order.user_id === directRep.id)) {
      return true;
    }

    return false;
  },

  /**
   * Checks if an order represents a $20 Rep signup fee or monthly license fee.
   * Rule 4: $20 signup/monthly fees never count toward retail sales volume or $125 qualification.
   */
  isMembershipFeeOrder(order: any): boolean {
    if (order.isMembershipFee === true || order.is_membership_fee === true) return true;
    if (order.order_type === 'membership' || order.orderType === 'membership') return true;

    const notes = (order.notes || '').toLowerCase();
    if (
      notes.includes('membership_fee') ||
      notes.includes('rep_license') ||
      notes.includes('signup_fee') ||
      notes.includes('$20 rep fee')
    ) {
      return true;
    }

    const prodName = (
      order.productName ||
      order.primaryProductName ||
      order.items?.[0]?.product?.name ||
      ''
    ).toLowerCase();

    if (
      prodName.includes('monthly license') ||
      prodName.includes('consultant license') ||
      prodName.includes('rep signup fee') ||
      prodName.includes('membership plan')
    ) {
      return true;
    }

    return false;
  },

  /**
   * Checks whether an order is attributed to the target representative
   */
  isOrderAttributedToRep(order: any, repUsername: string): boolean {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');

    // Check attributed_rep_id or repUsername
    const attributedId = (order.attributed_rep_id || '').toLowerCase();
    if (attributedId === cleanRep || attributedId === `rep-${cleanRep}`) return true;

    // Check shipping address note
    const shippingRep = (
      order.shippingAddress?.attributed_rep ||
      order.shipping_address?.attributed_rep ||
      ''
    ).toLowerCase().trim();
    if (shippingRep === cleanRep) return true;

    // Check notes
    const notes = (order.notes || '').toLowerCase();
    if (notes.includes(`rep:${cleanRep}`)) return true;

    // Check lifetime customer attribution
    const orderEmail = (
      order.customerEmail ||
      order.customer_email ||
      order.shippingAddress?.email ||
      order.shipping_address?.email ||
      ''
    ).toLowerCase().trim();

    if (orderEmail) {
      const localLifetime = attributionService.getStoredAttributions();
      if (localLifetime[orderEmail]?.repUsername?.toLowerCase() === cleanRep) {
        return true;
      }
    }

    return false;
  },

  /**
   * Reads all accessible orders across local storage
   */
  async getAllOrders(): Promise<any[]> {
    const ordersMap = new Map<string, any>();

    // 1. Local storage orders
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((o) => {
              if (o && o.id) ordersMap.set(o.id, o);
            });
          }
        }
      } catch {
        // ignore
      }
    }

    return Array.from(ordersMap.values());
  },

  /**
   * Deterministically calculates monthly qualifying retail customer sales for a representative
   */
  async calculateMonthlyQualification(
    repUsername: string,
    calendarMonth?: string
  ): Promise<MonthlyQualificationRecord> {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    const month = calendarMonth || this.getCalendarMonth();
    const { startIso, endIso } = this.getMonthBoundaries(month);

    const allOrders = await this.getAllOrders();

    let qualifyingRetailSales = 0;
    let personalPurchasesExcluded = 0;
    let customerOrderCount = 0;
    let personalOrderCount = 0;

    const eligibleStatuses = new Set([
      'paid',
      'completed',
      'processing',
      'delivered',
      'shipped',
      'pending',
    ]);

    for (const order of allOrders) {
      // Check status eligibility (ignore cancelled/refunded/returned/failed)
      const rawStatus = (order.status || '').toLowerCase();
      if (!eligibleStatuses.has(rawStatus)) {
        continue;
      }

      // Check date within target calendar month
      const orderDateIso = order.created_at || order.createdAt || order.orderDate || '';
      if (!orderDateIso) continue;

      const orderTimestamp = new Date(orderDateIso).getTime();
      const startTimestamp = new Date(startIso).getTime();
      const endTimestamp = new Date(endIso).getTime();

      if (isNaN(orderTimestamp) || orderTimestamp < startTimestamp || orderTimestamp > endTimestamp) {
        continue;
      }

      // Check attribution to this representative
      if (!this.isOrderAttributedToRep(order, cleanRep)) {
        continue;
      }

      const orderSubtotal = Number(order.subtotal) || 0;
      if (orderSubtotal <= 0) continue;

      // Rule 4: Exclude $20 Rep signup/monthly fees from retail sales volume and $125 qualification
      if (this.isMembershipFeeOrder(order)) {
        continue;
      }

      // Check if personal purchase vs customer purchase
      if (this.isPersonalPurchase(order, cleanRep)) {
        personalPurchasesExcluded += orderSubtotal;
        personalOrderCount += 1;
      } else {
        qualifyingRetailSales += orderSubtotal;
        customerOrderCount += 1;
      }
    }

    qualifyingRetailSales = parseFloat(qualifyingRetailSales.toFixed(2));
    personalPurchasesExcluded = parseFloat(personalPurchasesExcluded.toFixed(2));

    const isQualified = qualifyingRetailSales >= QUALIFICATION_THRESHOLD;

    const record: MonthlyQualificationRecord = {
      repUsername: cleanRep,
      repId: `rep-${cleanRep}`,
      calendarMonth: month,
      qualifyingRetailSales,
      qualificationThreshold: QUALIFICATION_THRESHOLD,
      isQualified,
      personalPurchasesExcluded,
      customerOrderCount,
      personalOrderCount,
      updatedAt: new Date().toISOString(),
    };

    // Save to persistent registry
    this.saveQualificationRecord(record);

    return record;
  },

  /**
   * Synchronously gets cached or quick qualification record for rendering
   */
  getCachedQualification(repUsername: string, calendarMonth?: string): MonthlyQualificationRecord {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    const month = calendarMonth || this.getCalendarMonth();
    const key = this.getCompoundKey(cleanRep, month);

    const registry = this.getStoredRegistry();
    if (registry[key]) {
      return registry[key];
    }

    // Default uncalculated fresh month record
    return {
      repUsername: cleanRep,
      repId: `rep-${cleanRep}`,
      calendarMonth: month,
      qualifyingRetailSales: 0.00,
      qualificationThreshold: QUALIFICATION_THRESHOLD,
      isQualified: false,
      personalPurchasesExcluded: 0.00,
      customerOrderCount: 0,
      personalOrderCount: 0,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Persists a qualification record to local registry and fires update event
   */
  saveQualificationRecord(record: MonthlyQualificationRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const registry = this.getStoredRegistry();
      const key = this.getCompoundKey(record.repUsername, record.calendarMonth);
      registry[key] = record;
      localStorage.setItem(QUALIFICATION_REGISTRY_KEY, JSON.stringify(registry));
      window.dispatchEvent(new CustomEvent('ilovesurprises_qualification_updated', { detail: record }));
    } catch {
      // ignore
    }
  },

  /**
   * Fast qualification check for downline commissions enforcement
   */
  async isRepQualifiedForDownlineCommissions(repUsername: string, dateOrMonth?: string): Promise<boolean> {
    const cleanRep = repUsername.toLowerCase().trim().replace(/^@/, '');
    let month = dateOrMonth;
    if (!month || month.length > 7) {
      month = this.getCalendarMonth(dateOrMonth);
    }

    const qualification = await this.calculateMonthlyQualification(cleanRep, month);
    return qualification.isQualified;
  },
};
