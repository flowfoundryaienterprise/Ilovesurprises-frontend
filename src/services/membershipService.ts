import { MOCK_MEMBERSHIP_PLANS } from '../data/mockData';

export interface MembershipPlanItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingPeriod: string;
  features: string[];
  discountPercent: number;
  freeShipping: boolean;
  earlyAccess: boolean;
}

export interface UserMembershipStatus {
  hasActiveMembership: boolean;
  membership?: {
    id: string;
    plan: MembershipPlanItem;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    autoRenew: boolean;
  };
}

const MEMBERSHIP_STORAGE_KEY = 'ils_user_membership_v1';

export const membershipService = {
  async getPlans(): Promise<MembershipPlanItem[]> {
    return MOCK_MEMBERSHIP_PLANS;
  },

  async getMyMembership(): Promise<UserMembershipStatus | null> {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return null;
  },

  async subscribe(planId: string): Promise<boolean> {
    const plan = MOCK_MEMBERSHIP_PLANS.find((p) => p.id === planId) || MOCK_MEMBERSHIP_PLANS[0];
    const status: UserMembershipStatus = {
      hasActiveMembership: true,
      membership: {
        id: `mem-${Date.now()}`,
        plan,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
      },
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(status));
        window.dispatchEvent(new CustomEvent('ils_consultant_subscribed'));
      } catch {
        // ignore
      }
    }
    return true;
  },
};
