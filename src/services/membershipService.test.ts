import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { membershipService } from './membershipService';
import { apiClient } from './apiClient';

describe('membershipService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    apiClient.setAuthToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function jsonResponse(data: any, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => data,
      text: async () => JSON.stringify(data),
    } as unknown as Response;
  }

  describe('getPlans', () => {
    it('fetches public membership plans from /api/memberships/plans', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: [
            {
              id: 'plan-1',
              name: 'Monthly Active Plan',
              slug: 'monthly-active',
              price: 19.99,
              interval: 'MONTHLY',
              discountPercent: 0,
              freeShipping: true,
              perks: ['Back office privileges'],
            },
          ],
        })
      );

      const plans = await membershipService.getPlans();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/memberships/plans');
      expect(plans.length).toBe(1);
      expect(plans[0].id).toBe('plan-1');
      expect(plans[0].billingPeriod).toBe('month');
    });

    it('falls back to mock plans if the server request fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network offline'));

      const plans = await membershipService.getPlans();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0]).toHaveProperty('price');
    });
  });

  describe('getPricing', () => {
    it('fetches tier pricing from /api/memberships/pricing', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            monthlyPrice: 24.99,
            sixMonthDiscount: 12,
            twelveMonthDiscount: 20,
          },
        })
      );

      const pricing = await membershipService.getPricing();
      expect(pricing.monthlyPrice).toBe(24.99);
      expect(pricing.sixMonthDiscount).toBe(12);
      expect(pricing.twelveMonthDiscount).toBe(20);
    });
  });

  describe('getMyMembership', () => {
    it('fetches logged-in status from /api/memberships/me when authenticated', async () => {
      apiClient.setAuthToken('user-jwt-123');

      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            hasActiveMembership: true,
            membership: {
              id: 'mem-99',
              plan: {
                id: 'plan-12m',
                name: '12-Month Annual VIP',
                slug: 'annual-vip',
                price: 203.9,
                interval: 'ANNUAL',
                discountPercent: 15,
                freeShipping: true,
                perks: ['VIP Support'],
              },
              status: 'active',
              currentPeriodStart: '2026-01-01T00:00:00.000Z',
              currentPeriodEnd: '2027-01-01T00:00:00.000Z',
              autoRenew: true,
            },
          },
        })
      );

      const status = await membershipService.getMyMembership();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/memberships/me');
      expect(status?.hasActiveMembership).toBe(true);
      expect(status?.membership?.id).toBe('mem-99');
    });

    it('falls back to localStorage if unauthenticated or offline', async () => {
      localStorage.setItem(
        'ils_user_membership_v1',
        JSON.stringify({
          hasActiveMembership: true,
          membership: {
            id: 'local-mem-1',
            status: 'active',
          },
        })
      );

      const status = await membershipService.getMyMembership();
      expect(status?.hasActiveMembership).toBe(true);
      expect(status?.membership?.id).toBe('local-mem-1');
    });
  });

  describe('subscribe', () => {
    it('posts to /api/memberships/subscribe and dispatches ils_consultant_subscribed', async () => {
      apiClient.setAuthToken('token-abc');

      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: { id: 'mem-new' },
        })
      );

      let dispatched = false;
      const handler = () => {
        dispatched = true;
      };
      window.addEventListener('ils_consultant_subscribed', handler);

      const result = await membershipService.subscribe('monthly-active');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalled();
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/memberships/subscribe');
      expect(dispatched).toBe(true);
      expect(localStorage.getItem('ils_consultant_subscribed')).toBe('true');

      window.removeEventListener('ils_consultant_subscribed', handler);
    });
  });
});
