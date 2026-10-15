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
    items: [{ product: { id: 'prod-1', price: 999 }, quantity: 2, unitPrice: 999, totalPrice: 1998 }] as never,
    shippingAddress: { fullName: 'Test Person' } as never,
    deliveryMethod: { id: 'standard' } as never,
    subtotal: 100,
    discount: 0,
    shippingFee: 0,
    total: 100,
  };

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const signIn = () => localStorage.setItem('ilovesurprises_jwt_token', 'test-token');

  describe('availability', () => {
    it('reports checkout as available now that the backend has payment endpoints', () => {
      expect(CHECKOUT_BACKEND_AVAILABLE).toBe(true);
      expect(getCheckoutAvailability().available).toBe(true);
    });
  });

  describe('initiatePayment', () => {
    it('asks a signed-out customer to sign in without calling the server', async () => {
      const result = await paymentService.initiatePayment(minimalParams);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/sign in/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sends only ids and quantities, never prices', async () => {
      signIn();
      fetchMock.mockResolvedValue(
        jsonResponse({ status: 'success', data: { order: null, orderId: 'o1', checkoutUrl: 'https://checkout.stripe.com/x', sessionId: 'cs_1' } })
      );

      await paymentService.initiatePayment(minimalParams);

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('/api/payments/checkout');
      const body = JSON.parse(init.body);
      expect(body.items).toEqual([{ productId: 'prod-1', quantity: 2 }]);
      expect(JSON.stringify(body)).not.toMatch(/"(price|total|subtotal|unitPrice)"/);
    });

    it('returns the Stripe redirect without reporting success as paid', async () => {
      signIn();
      fetchMock.mockResolvedValue(
        jsonResponse({ status: 'success', data: { order: null, orderId: 'o1', checkoutUrl: 'https://checkout.stripe.com/x', sessionId: 'cs_1' } })
      );

      const result = await paymentService.initiatePayment(minimalParams);

      expect(result.requiresRedirect).toBe(true);
      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/x');
      expect(result.status).not.toBe('succeeded');
      expect(result.order).toBeUndefined();
    });

    it('collapses concurrent submissions into one attempt', async () => {
      signIn();
      fetchMock.mockImplementation(async () =>
        jsonResponse({ status: 'success', data: { order: null, orderId: 'o1', checkoutUrl: 'https://checkout.stripe.com/x' } })
      );

      const [a, b] = await Promise.all([
        paymentService.initiatePayment(minimalParams),
        paymentService.initiatePayment(minimalParams),
      ]);

      expect(a).toEqual(b);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyPayment', () => {
    it('reports paid only when the backend says paid', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { status: 'paid', order: { id: 'o1' } } }));
      const result = await paymentService.verifyPayment({ orderId: 'o1' });

      expect(result.verified).toBe(true);
      expect(result.status).toBe('paid');
    });

    it('does not verify a pending payment', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { status: 'pending', order: { id: 'o1' } } }));
      const result = await paymentService.verifyPayment({ orderId: 'o1', sessionId: 'cs_1' });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('pending');
    });

    it('reports unknown rather than paid when the server cannot be reached', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const result = await paymentService.verifyPayment({ orderId: 'o1' });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('unknown');
    });

    it('rejects a verification with no order reference', async () => {
      const result = await paymentService.verifyPayment({ orderId: '' });
      expect(result.verified).toBe(false);
      expect(result.status).toBe('unknown');
      expect(fetchMock).not.toHaveBeenCalled();
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
