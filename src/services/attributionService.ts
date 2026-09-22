import { representativeService } from './representativeService';

export interface CustomerAttributionRecord {
  customerEmail: string;
  userId?: string;
  repUsername: string;
  repId?: string;
  attributedAt: string;
  firstOrderId?: string;
}

const ATTRIBUTION_REGISTRY_KEY = 'ilovesurprises_lifetime_attributions_v1';

export const attributionService = {
  /**
   * Retrieves all locally cached lifetime attribution records
   */
  getStoredAttributions(): Record<string, CustomerAttributionRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(ATTRIBUTION_REGISTRY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /**
   * Checks if a customer has a permanent lifetime representative attribution
   */
  async getLifetimeAttribution(customerEmailOrUserId: string): Promise<string | null> {
    if (!customerEmailOrUserId) return null;
    const cleanKey = customerEmailOrUserId.toLowerCase().trim();

    // Check persistent client/local registry
    const registry = this.getStoredAttributions();
    if (registry[cleanKey]?.repUsername) {
      const rep = registry[cleanKey].repUsername;
      // Verify representative is not suspended
      if (!representativeService.isRepresentativeSuspended(rep)) {
        return rep;
      }
    }

    return null;
  },

  /**
   * Resolves attribution for an active checkout session
   * Lifetime Attribution Rule:
   * If customer already has a permanent attributed representative -> ALWAYS keep permanent rep!
   * Never overwrite with another rep just because they used another link.
   */
  async resolveAttributionForCheckout(params: {
    customerEmail?: string;
    userId?: string;
    currentSessionRep?: string;
  }): Promise<{ repUsername: string | null; isLifetime: boolean }> {
    const email = params.customerEmail?.toLowerCase().trim();
    const userId = params.userId?.trim();

    // Step 1: Check existing permanent attribution by Email
    if (email) {
      const permanentByEmail = await this.getLifetimeAttribution(email);
      if (permanentByEmail) {
        return { repUsername: permanentByEmail, isLifetime: true };
      }
    }

    // Step 2: Check existing permanent attribution by User ID
    if (userId) {
      const permanentByUserId = await this.getLifetimeAttribution(userId);
      if (permanentByUserId) {
        return { repUsername: permanentByUserId, isLifetime: true };
      }
    }

    // Step 3: If no permanent attribution, check current session referral
    if (params.currentSessionRep) {
      const cleanRep = params.currentSessionRep.toLowerCase().trim().replace(/^@/, '');
      // Verify representative exists and is not suspended
      if (!representativeService.isRepresentativeSuspended(cleanRep)) {
        return { repUsername: cleanRep, isLifetime: false };
      }
    }

    return { repUsername: null, isLifetime: false };
  },

  /**
   * Permanently sets customer -> representative lifetime attribution
   * IDEMPOTENT & IMMUTABLE: Will NOT overwrite existing attribution!
   */
  async setPermanentAttribution(params: {
    customerEmail: string;
    repUsername: string;
    userId?: string;
    orderId?: string;
  }): Promise<{ success: boolean; repUsername: string; wasAlreadyAssigned: boolean }> {
    const cleanEmail = params.customerEmail.toLowerCase().trim();
    const cleanRep = params.repUsername.toLowerCase().trim().replace(/^@/, '');

    if (!cleanEmail || !cleanRep) {
      return { success: false, repUsername: '', wasAlreadyAssigned: false };
    }

    // Rule: Verify representative is active and not suspended
    if (representativeService.isRepresentativeSuspended(cleanRep)) {
      return { success: false, repUsername: '', wasAlreadyAssigned: false };
    }

    // Check if customer already has a permanent attribution
    const existing = await this.getLifetimeAttribution(cleanEmail);
    if (existing) {
      // NEVER overwrite existing lifetime attribution!
      return { success: true, repUsername: existing, wasAlreadyAssigned: true };
    }

    // Establish new lifetime attribution
    const attributionRecord: CustomerAttributionRecord = {
      customerEmail: cleanEmail,
      userId: params.userId,
      repUsername: cleanRep,
      attributedAt: new Date().toISOString(),
      firstOrderId: params.orderId,
    };

    // Save to local persistent registry
    this.saveToLocalRegistry(cleanEmail, cleanRep, attributionRecord);
    if (params.userId) {
      this.saveToLocalRegistry(params.userId, cleanRep, attributionRecord);
    }

    return { success: true, repUsername: cleanRep, wasAlreadyAssigned: false };
  },

  /**
   * Helper to write to local storage registry safely
   */
  saveToLocalRegistry(key: string, repUsername: string, record?: CustomerAttributionRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const registry = this.getStoredAttributions();
      registry[key.toLowerCase().trim()] = record || {
        customerEmail: key,
        repUsername: repUsername.toLowerCase().trim(),
        attributedAt: new Date().toISOString(),
      };
      localStorage.setItem(ATTRIBUTION_REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      // storage quota / disabled
    }
  },
};
