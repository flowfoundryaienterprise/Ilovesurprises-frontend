import { apiClient } from './apiClient';

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

export const membershipService = {
  async getPlans(): Promise<MembershipPlanItem[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { plans: MembershipPlanItem[] };
      }>('/api/memberships/plans', { skipAuth: true });
      return response.data?.plans || [];
    } catch {
      return [];
    }
  },

  async getMyMembership(): Promise<UserMembershipStatus | null> {
    const token = apiClient.getAuthToken();
    if (!token) return null;
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: UserMembershipStatus;
      }>('/api/memberships/my');
      return response.data;
    } catch {
      return null;
    }
  },

  async subscribe(planId: string): Promise<boolean> {
    try {
      await apiClient.post('/api/memberships/subscribe', { planId });
      return true;
    } catch (err: any) {
      throw err;
    }
  },
};
