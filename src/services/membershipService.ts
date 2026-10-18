import { apiClient, unwrap, type ApiResponse } from './apiClient';
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

export interface MembershipPricingInfo {
  monthlyPrice: number;
  sixMonthDiscount: number;
  twelveMonthDiscount: number;
}

const MEMBERSHIP_STORAGE_KEY = 'ils_user_membership_v1';

export const membershipService = {
  /**
   * Retrieves active membership plans from `GET /api/memberships/plans`.
   * Falls back gracefully to default catalog if offline.
   */
  async getPlans(): Promise<MembershipPlanItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/memberships/plans');
      const data = unwrap<any>(response, '/api/memberships/plans');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price || 0),
          billingPeriod:
            p.billingPeriod ||
            (p.interval === 'MONTHLY'
              ? 'month'
              : p.interval === 'ANNUAL'
              ? 'year'
              : '6 months'),
          features: p.features || p.perks || [],
          discountPercent: Number(p.discountPercent || 0),
          freeShipping: Boolean(p.freeShipping),
          earlyAccess: Boolean(p.earlyAccess ?? true),
        }));
      }
    } catch {
      // fallback
    }
    return MOCK_MEMBERSHIP_PLANS;
  },

  /**
   * Retrieves public pricing tier configuration from `GET /api/memberships/pricing`.
   */
  async getPricing(): Promise<MembershipPricingInfo> {
    try {
      const response = await apiClient.get<ApiResponse<MembershipPricingInfo>>(
        '/api/memberships/pricing'
      );
      return unwrap<MembershipPricingInfo>(response, '/api/memberships/pricing');
    } catch {
      return {
        monthlyPrice: 19.99,
        sixMonthDiscount: 10,
        twelveMonthDiscount: 15,
      };
    }
  },

  /**
   * Retrieves logged-in user's active membership status from `GET /api/memberships/me`.
   */
  async getMyMembership(): Promise<UserMembershipStatus | null> {
    if (typeof window === 'undefined') return null;

    const token = apiClient.getAuthToken();
    if (token) {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/api/memberships/me');
        const data = unwrap<any>(response, '/api/memberships/me');
        if (data && typeof data === 'object') {
          const status: UserMembershipStatus = {
            hasActiveMembership: Boolean(data.hasActiveMembership),
            ...(data.membership && {
              membership: {
                id: data.membership.id,
                plan: {
                  id: data.membership.plan?.id || 'standard',
                  name: data.membership.plan?.name || 'Standard Plan',
                  slug: data.membership.plan?.slug || 'standard',
                  price: Number(data.membership.plan?.price || 0),
                  billingPeriod:
                    data.membership.plan?.billingPeriod ||
                    (data.membership.plan?.interval === 'MONTHLY' ? 'month' : 'year'),
                  features: data.membership.plan?.features || data.membership.plan?.perks || [],
                  discountPercent: Number(data.membership.plan?.discountPercent || 0),
                  freeShipping: Boolean(data.membership.plan?.freeShipping),
                  earlyAccess: Boolean(data.membership.plan?.earlyAccess ?? true),
                },
                status: data.membership.status,
                currentPeriodStart: data.membership.currentPeriodStart,
                currentPeriodEnd: data.membership.currentPeriodEnd,
                autoRenew: Boolean(data.membership.autoRenew),
              },
            }),
          };
          localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(status));
          return status;
        }
      } catch {
        // fallback to storage
      }
    }

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

  /**
   * Subscribes authenticated user to a plan via `POST /api/memberships/subscribe`.
   */
  async subscribe(planId: string): Promise<boolean> {
    const token = apiClient.getAuthToken();
    if (token) {
      try {
        await apiClient.post('/api/memberships/subscribe', { planId });
      } catch (err) {
        console.warn('Backend subscribe failed, falling back to local simulation:', err);
      }
    }

    const plans = await this.getPlans();
    const plan = plans.find((p) => p.id === planId || p.slug === planId) || plans[0];
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
        localStorage.setItem('ils_consultant_subscribed', 'true');
        window.dispatchEvent(new CustomEvent('ils_consultant_subscribed'));
      } catch {
        // ignore
      }
    }
    return true;
  },
};

