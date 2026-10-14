import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  paymentService,
  CHECKOUT_BACKEND_AVAILABLE,
  getCheckoutAvailability,
} from './paymentService';
import { orderService } from './orderService';
import { commissionService } from './commissionService';

/**
 * These tests pin the rules that matter most: no fabricated payment, no
 * fabricated order, and no client-side commission generation.
 */
describe('checkout and payments', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const minimalParams = {
    paymentMethod: 'card' as never,
    items: [],
    shippingAddress: { fullName: 'Test Person' } as never,
    deliveryMethod: { id: 'standard' } as never,
    subtotal: 100,
    discount: 0,
    shippingFee: 0,
    total: 100,
  };

  describe('availability', () => {
    it('reports checkout as unavailable while the backend has no payment endpoints', () => {
      expect(CHECKOUT_BACKEND_AVAILABLE).toBe(false);

      const availability = getCheckoutAvailability();
      expect(availability.available).toBe(false);
      expect(availability.missing.length).toBeGreaterThan(0);
      expect(availability.missing.join(' ')).toMatch(/payment/i);
    });
  });

  describe('initiatePayment', () => {
    it('never reports a successful payment', async () => {
      const result = await paymentService.initiatePayment(minimalParams);

      expect(result.success).toBe(false);
      expect(result.status).not.toBe('succeeded');
      expect(result.status).toBe('unavailable');
      expect(result.configurationRequired).toBe(true);
      expect(result.order).toBeUndefined();
    });

    it('creates no order and makes no network call', async () => {
      await paymentService.initiatePayment(minimalParams);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(localStorage.getItem('ilovesurprises_orders_v1')).toBeNull();
    });

    it('does not invent a transaction id or card details', async () => {
      const result = await paymentService.initiatePayment(minimalParams);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toMatch(/TXN-/);
      expect(serialized).not.toContain('4242');
      expect(serialized).not.toContain('Visa');
    });

    it('collapses concurrent submissions into one attempt', async () => {
      const [a, b] = await Promise.all([
        paymentService.initiatePayment(minimalParams),
        paymentService.initiatePayment(minimalParams),
      ]);

      expect(a).toEqual(b);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('reports unknown rather than paid when there is no endpoint', async () => {
      const result = await paymentService.verifyPayment({ orderId: 'ILS-123-US' });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('unknown');
      expect(result.status).not.toBe('paid');
    });

    it('rejects a verification with no order reference', async () => {
      const result = await paymentService.verifyPayment({ orderId: '' });
      expect(result.verified).toBe(false);
      expect(result.status).toBe('unknown');
    });

    it('never treats an arbitrary reference as proof of payment', async () => {
      const result = await paymentService.verifyPayment({
        orderId: 'anything-at-all',
        sessionId: 'cs_fake_session',
      });
      expect(result.status).not.toBe('paid');
      expect(result.verified).toBe(false);
    });
  });

  describe('pending checkout context', () => {
    it('persists only harmless references, never amounts or outcomes', () => {
      paymentService.storePendingOrder('ILS-1', {
        paymentIntentId: 'pi_1',
        sessionId: 'cs_1',
        provider: 'stripe',
        // These must not be stored even if a caller passes them.
        total: 199.99,
        isPaid: true,
        cardNumber: '4111111111111111',
      });

      const stored = paymentService.getPendingOrder('ILS-1');
      expect(stored).toMatchObject({
        orderId: 'ILS-1',
        paymentIntentId: 'pi_1',
        sessionId: 'cs_1',
        provider: 'stripe',
      });
      expect(stored).not.toHaveProperty('total');
      expect(stored).not.toHaveProperty('isPaid');
      expect(stored).not.toHaveProperty('cardNumber');
    });

    it('clears pending context', () => {
      paymentService.storePendingOrder('ILS-2', { provider: 'stripe' });
      paymentService.clearPendingOrder('ILS-2');
      expect(paymentService.getPendingOrder('ILS-2')).toBeNull();
    });
  });

  describe('orders', () => {
    it('returns no orders instead of mock orders', async () => {
      expect(orderService.getOrders()).toEqual([]);
      expect(await orderService.fetchOrders()).toEqual([]);
      expect(orderService.getOrderById('ILS-749201-US')).toBeUndefined();
    });

    it('does not seed localStorage with mock orders on read', async () => {
      orderService.getOrders();
      await orderService.fetchOrders();
      expect(localStorage.getItem('ilovesurprises_orders_v1')).toBeNull();
    });

    it('refuses to create an order locally', async () => {
      await expect(orderService.createOrder()).rejects.toThrow(
        /no order endpoint/i
      );
      expect(localStorage.getItem('ilovesurprises_orders_v1')).toBeNull();
    });

    it('refuses to change an order status locally', async () => {
      await expect(
        orderService.updateOrderStatus('ILS-1', 'delivered' as never)
      ).rejects.toThrow(/no order endpoint/i);
    });
  });

  describe('commissions', () => {
    it('exposes the approved schedule without any calculation entry point', () => {
      expect(commissionService.COMMISSION_RATES.personal).toBe(0.2);
      expect(commissionService.COMMISSION_TIERS).toHaveLength(6);
      expect(commissionService.MAX_DISTRIBUTION_CAP_PERCENT).toBe(35);

      // The client-side payout engine is gone.
      expect((commissionService as any).processOrderCommissions).toBeUndefined();
      expect((commissionService as any).resolveUpline).toBeUndefined();
      expect((commissionService as any).saveCommissionsToStorage).toBeUndefined();
    });

    it('matches the backend tier rates exactly', () => {
      const rates = commissionService.COMMISSION_TIERS.map((t) => t.ratePercent);
      expect(rates).toEqual([20, 5, 4, 3, 2, 1]);
    });

    it('writes no commission records to storage', () => {
      commissionService.commissionTierLabel(1);
      expect(localStorage.getItem('ilovesurprises_commissions_v1')).toBeNull();
    });
  });
});
