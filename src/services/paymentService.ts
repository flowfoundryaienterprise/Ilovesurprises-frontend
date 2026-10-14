/**
 * Payment and checkout service.
 *
 * ## Current status: checkout submission is DISABLED
 *
 * The backend exposes no order or payment endpoints. Verified against
 * `ilovesurprises-backend/src/routes/*.ts`, the complete API surface contains
 * no route for:
 *   - creating an order (the `orders` table exists in Prisma, but nothing reads
 *     or writes it over HTTP)
 *   - initializing a payment intent or hosted checkout session
 *   - verifying a payment's status
 *   - receiving a provider webhook
 *
 * Without those, there is no way to create a pending order, hand off to a
 * payment provider, or confirm that money was actually captured.
 *
 * The previous implementation simulated all of it: `initiatePayment` waited
 * 300ms, set `isPaid` from the selected payment method, invented a transaction
 * ID and card details, and wrote a "paid" order to localStorage, while
 * `verifyPayment` returned `{ verified: true, status: 'paid' }` unconditionally.
 * That produced fake sales records and fake MLM commissions.
 *
 * All of that is removed. `initiatePayment` now reports an unavailable
 * configuration, and `verifyPayment` only ever reports what the backend
 * confirms — which, with no endpoint, is "unknown", never "paid".
 *
 * When the backend gains these endpoints, implement them at the marked
 * integration points below; the checkout UI already handles the states.
 */

import type {
  Order,
  OrderItem,
  ShippingAddress,
  DeliveryMethod,
  PaymentMethodType,
} from '../types';
import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';

/** Re-exported for existing callers (Checkout.tsx) that catch on this type. */
export { ApiError };

export type PaymentGatewayProvider = 'stripe' | 'paypal' | 'cod';

export type PaymentGatewayStatus =
  | 'succeeded'
  | 'processing'
  | 'requires_action'
  | 'requires_payment_method'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'redirect_required'
  /** The backend has no payment integration configured. */
  | 'unavailable';

export interface CardPaymentDetails {
  cardholderName: string;
  last4?: string;
  cardBrand?: string;
  expMonth?: number;
  expYear?: number;
}

export interface InitiatePaymentParams {
  paymentMethod: PaymentMethodType;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  discount: number;
  promoCode?: string;
  shippingFee: number;
  total: number;
  attributedRep?: {
    name: string;
    repUsername: string;
  };
  userId?: string;
  isPersonalPurchase?: boolean;
  repDiscountAmount?: number;
  notes?: string;
  cardDetails?: CardPaymentDetails;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  orderId: string;
  status: PaymentGatewayStatus;
  checkoutUrl?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  order?: Order;
  requiresRedirect?: boolean;
  message?: string;
  error?: string;
  /** True when checkout cannot run because the backend is not configured. */
  configurationRequired?: boolean;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentIntentId?: string;
  sessionId?: string;
  paymentMethod?: PaymentMethodType;
}

export interface PaymentVerificationResult {
  success: boolean;
  /** True only when the backend confirmed the payment status. */
  verified: boolean;
  /**
   * `unknown` means the status could not be established. It is never collapsed
   * to 'paid': a redirect to a success page is not proof of payment.
   */
  status: 'paid' | 'pending' | 'failed' | 'cancelled' | 'unknown';
  order?: Order;
  transactionId?: string;
  message?: string;
  error?: string;
}

const PENDING_ORDER_KEY_PREFIX = 'ils_pending_payment_';
const LAST_PENDING_ORDER_ID_KEY = 'ils_last_pending_order_id';

/**
 * Whether the backend exposes the checkout/payment endpoints this service
 * needs. Flip to true only when they exist and are deployed.
 *
 * Required routes:
 *   POST /api/orders                  — create a pending order, server totals
 *   POST /api/payments/intent         — initialize the provider
 *   GET  /api/payments/:id/status     — authoritative payment status
 *   POST /api/payments/webhook        — provider confirmation
 */
export const CHECKOUT_BACKEND_AVAILABLE = false;

/** Operator-facing explanation shown by the checkout UI when disabled. */
export const CHECKOUT_UNAVAILABLE_MESSAGE =
  'Online checkout is temporarily unavailable. Payments are not configured on the server yet, so no order can be placed or charged right now.';

/**
 * Public Stripe publishable key, if configured.
 *
 * Only publishable client configuration belongs in a `VITE_*` variable —
 * everything in one is embedded in the shipped bundle. Secret keys must never
 * appear here.
 */
export function getStripePublishableKey(): string | null {
  const key = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  return key || null;
}

/** Public PayPal client ID, if configured. */
export function getPayPalClientId(): string | null {
  const id = (import.meta.env.VITE_PAYPAL_CLIENT_ID || '').trim();
  return id || null;
}

/**
 * Describes why checkout is unavailable, for display and diagnostics.
 */
export function getCheckoutAvailability(): {
  available: boolean;
  reason?: string;
  missing: string[];
} {
  const missing: string[] = [];

  if (!CHECKOUT_BACKEND_AVAILABLE) {
    missing.push(
      'Backend order and payment endpoints (POST /api/orders, POST /api/payments/intent, GET /api/payments/:id/status)'
    );
  }
  if (!getStripePublishableKey() && !getPayPalClientId()) {
    missing.push('A public payment provider key (VITE_STRIPE_PUBLISHABLE_KEY or VITE_PAYPAL_CLIENT_ID)');
  }

  if (missing.length === 0) return { available: true, missing };

  return {
    available: false,
    reason: CHECKOUT_UNAVAILABLE_MESSAGE,
    missing,
  };
}

/**
 * Stores harmless, temporary checkout context in sessionStorage so a return
 * from a provider redirect can be matched to its order.
 *
 * Only non-authoritative references belong here (order id, provider session
 * id). No payment outcome, price, or card data is persisted — the backend is
 * the only authority on all of those.
 */
export function storePendingOrder(orderId: string, data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    const safe = {
      orderId,
      paymentIntentId: data.paymentIntentId,
      sessionId: data.sessionId,
      provider: data.provider,
      startedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`${PENDING_ORDER_KEY_PREFIX}${orderId}`, JSON.stringify(safe));
    sessionStorage.setItem(LAST_PENDING_ORDER_ID_KEY, orderId);
  } catch (err) {
    console.warn('Failed to store pending checkout context:', err);
  }
}

export function getPendingOrder(orderId?: string): Record<string, any> | null {
  if (typeof window === 'undefined') return null;
  try {
    const targetId = orderId || sessionStorage.getItem(LAST_PENDING_ORDER_ID_KEY);
    if (!targetId) return null;
    const raw = sessionStorage.getItem(`${PENDING_ORDER_KEY_PREFIX}${targetId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder(orderId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const targetId = orderId || sessionStorage.getItem(LAST_PENDING_ORDER_ID_KEY);
    if (targetId) {
      sessionStorage.removeItem(`${PENDING_ORDER_KEY_PREFIX}${targetId}`);
    }
    if (!orderId || orderId === sessionStorage.getItem(LAST_PENDING_ORDER_ID_KEY)) {
      sessionStorage.removeItem(LAST_PENDING_ORDER_ID_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

/** Guards against a double-submitted checkout within one page session. */
let inFlightCheckout: Promise<PaymentInitiationResult> | null = null;

export const paymentService = {
  getStripePublishableKey,
  getPayPalClientId,
  getCheckoutAvailability,
  storePendingOrder,
  getPendingOrder,
  clearPendingOrder,

  get isCheckoutAvailable() {
    return getCheckoutAvailability().available;
  },

  /**
   * Starts a real checkout.
   *
   * While the backend has no order/payment endpoints this returns an
   * unavailable configuration result and performs no network call, no local
   * write, and no order creation. It never reports a payment as successful.
   *
   * Concurrent calls share one promise so a double click cannot submit twice.
   */
  async initiatePayment(
    // Retained so the call sites and the integration points below stay intact;
    // nothing is read from it while checkout is disabled.
    _params: InitiatePaymentParams
  ): Promise<PaymentInitiationResult> {
    if (inFlightCheckout) return inFlightCheckout;

    inFlightCheckout = (async (): Promise<PaymentInitiationResult> => {
      const availability = getCheckoutAvailability();

      if (!availability.available) {
        return {
          success: false,
          orderId: '',
          status: 'unavailable',
          configurationRequired: true,
          error: availability.reason || CHECKOUT_UNAVAILABLE_MESSAGE,
          message: availability.missing.join('; '),
        };
      }

      /* ---------------------------------------------------------------- *
       * Integration point — enable once the backend endpoints exist.
       *
       * 1. Create a PENDING order; the server computes every total from its
       *    own prices. Client-supplied amounts are inputs to validate, never
       *    the source of truth:
       *
       *      const created = unwrap(await apiClient.post('/api/orders', {
       *        items: _params.items.map((i) => ({
       *          productId: i.product.id,
       *          variantId: i.variantId,
       *          quantity: i.quantity,
       *        })),
       *        shippingAddress: _params.shippingAddress,
       *        deliveryMethodId: _params.deliveryMethod.id,
       *        promoCode: _params.promoCode,
       *        paymentMethod: _params.paymentMethod,
       *      }));
       *
       * 2. Initialize the provider and hand off to its hosted checkout or
       *    approved element. Raw card details are never collected into
       *    application state.
       *
       * 3. Persist only the order id and provider session reference via
       *    storePendingOrder(), then redirect.
       *
       * 4. On return, call verifyPayment() and render only the backend's
       *    confirmed status.
       * ---------------------------------------------------------------- */

      return {
        success: false,
        orderId: '',
        status: 'unavailable',
        configurationRequired: true,
        error: CHECKOUT_UNAVAILABLE_MESSAGE,
      };
    })();

    try {
      return await inFlightCheckout;
    } finally {
      inFlightCheckout = null;
    }
  },

  /**
   * Asks the backend for the authoritative payment status.
   *
   * The backend's verified status is the only authority. A redirect to a
   * success page is not proof of payment, so when no status can be obtained
   * this reports `unknown` and `verified: false` — never `paid`.
   */
  async verifyPayment(
    params: VerifyPaymentParams
  ): Promise<PaymentVerificationResult> {
    if (!params.orderId && !params.sessionId && !params.paymentIntentId) {
      return {
        success: false,
        verified: false,
        status: 'unknown',
        error: 'Missing order reference, so the payment status cannot be checked.',
      };
    }

    if (!CHECKOUT_BACKEND_AVAILABLE) {
      return {
        success: false,
        verified: false,
        status: 'unknown',
        error:
          'Payment status cannot be verified: the server has no payment verification endpoint.',
      };
    }

    /* Integration point — once available:
     *   GET /api/payments/:id/status  →  { status, order, transactionId }
     * Map the backend status verbatim; do not infer success from navigation. */
    try {
      const response = await apiClient.get<
        ApiResponse<{
          status: 'paid' | 'pending' | 'failed' | 'cancelled';
          order?: Order;
          transactionId?: string;
        }>
      >(`/api/payments/${encodeURIComponent(params.orderId)}/status`);

      const data = unwrap<{
        status: 'paid' | 'pending' | 'failed' | 'cancelled';
        order?: Order;
        transactionId?: string;
      }>(response, '/api/payments/:id/status');

      return {
        success: true,
        verified: true,
        status: data.status,
        order: data.order,
        transactionId: data.transactionId,
      };
    } catch (err) {
      return {
        success: false,
        verified: false,
        status: 'unknown',
        error:
          err instanceof ApiError
            ? err.displayMessage
            : 'The payment status could not be verified.',
      };
    }
  },
};
