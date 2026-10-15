/**
 * Payment and checkout service.
 *
 * Card payments use Stripe Checkout (hosted): the backend creates a PENDING
 * order priced from its own database and returns a Stripe-hosted payment URL.
 * Card numbers never touch this app or our server. Apple Pay and Google Pay
 * are offered on the same Stripe page.
 *
 * Backend routes:
 *   POST /api/payments/checkout                 — create order (+ Stripe session)
 *   GET  /api/payments/orders/:orderId/status   — authoritative payment status
 *   POST /api/payments/webhook                  — Stripe confirmation (server-only)
 *
 * The amounts sent from the checkout page are display values only; the server
 * recomputes every total. An order is only shown as paid when the backend says
 * so — a redirect to the success page is not proof of payment.
 */

import type {
  Order,
  OrderItem,
  ShippingAddress,
  DeliveryMethod,
  PaymentMethodType,
} from '../types';
import { apiClient, ApiError, getStoredAuthToken, unwrap, type ApiResponse } from './apiClient';

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
  /** True only when the backend confirmed the order is paid. */
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

/** The backend exposes the checkout and payment endpoints. */
export const CHECKOUT_BACKEND_AVAILABLE = true;

/** Shown by the checkout UI when checkout cannot run. */
export const CHECKOUT_UNAVAILABLE_MESSAGE =
  'Online checkout is temporarily unavailable. No order was placed and you have not been charged.';

/**
 * Public Stripe publishable key, if configured. Not required for hosted
 * Stripe Checkout, which is opened by URL from the backend.
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
 * Describes whether checkout can run. Whether Stripe itself is configured is
 * reported by the backend when an order is submitted.
 */
export function getCheckoutAvailability(): {
  available: boolean;
  reason?: string;
  missing: string[];
} {
  if (!CHECKOUT_BACKEND_AVAILABLE) {
    return {
      available: false,
      reason: CHECKOUT_UNAVAILABLE_MESSAGE,
      missing: ['Backend order and payment endpoints'],
    };
  }
  return { available: true, missing: [] };
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

interface CheckoutResponse {
  order: Order | null;
  orderId?: string;
  checkoutUrl: string | null;
  sessionId?: string;
}

interface PaymentStatusResponse {
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  order?: Order;
  transactionId?: string;
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
   * Starts a real checkout. Card, Apple Pay and Google Pay return a Stripe
   * Checkout URL to redirect to; cash on delivery returns the created order.
   *
   * Concurrent calls share one promise so a double click cannot submit twice.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    if (inFlightCheckout) return inFlightCheckout;

    inFlightCheckout = (async (): Promise<PaymentInitiationResult> => {
      if (!getStoredAuthToken()) {
        return {
          success: false,
          orderId: '',
          status: 'failed',
          error: 'Please sign in to place your order.',
          message: 'Please sign in to place your order.',
        };
      }

      // Only identifiers and quantities are sent; the server prices the order.
      const response = await apiClient.post<ApiResponse<CheckoutResponse>>('/api/payments/checkout', {
        paymentMethod: params.paymentMethod,
        items: params.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedRingSize: item.selectedRingSize != null ? String(item.selectedRingSize) : undefined,
          selectedSurpriseOption: item.selectedSurpriseOption,
        })),
        shippingAddress: params.shippingAddress,
        deliveryMethodId: params.deliveryMethod.id,
        promoCode: params.isPersonalPurchase ? undefined : params.promoCode,
        repUsername: params.attributedRep?.repUsername,
        notes: params.notes,
      });
      const data = unwrap<CheckoutResponse>(response, '/api/payments/checkout');

      if (data.checkoutUrl && data.orderId) {
        storePendingOrder(data.orderId, { sessionId: data.sessionId, provider: 'stripe' });
        return {
          success: true,
          orderId: data.orderId,
          status: 'redirect_required',
          requiresRedirect: true,
          checkoutUrl: data.checkoutUrl,
        };
      }

      if (data.order) {
        // Cash on delivery: the order is placed, payment is collected later.
        return { success: true, orderId: data.order.id, status: 'succeeded', order: data.order };
      }

      return {
        success: false,
        orderId: '',
        status: 'failed',
        error: 'The server did not return a payment session. You have not been charged.',
      };
    })();

    try {
      return await inFlightCheckout;
    } finally {
      inFlightCheckout = null;
    }
  },

  /**
   * Asks the backend for the authoritative payment status. When no status can
   * be obtained this reports `unknown` and `verified: false` — never `paid`.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.orderId) {
      return {
        success: false,
        verified: false,
        status: 'unknown',
        error: 'Missing order reference, so the payment status cannot be checked.',
      };
    }

    try {
      const response = await apiClient.get<ApiResponse<PaymentStatusResponse>>(
        `/api/payments/orders/${encodeURIComponent(params.orderId)}/status`
      );
      const data = unwrap<PaymentStatusResponse>(response, '/api/payments/orders/:id/status');

      return {
        success: true,
        verified: data.status === 'paid',
        status: data.status,
        order: data.order,
        transactionId: data.transactionId,
        message:
          data.status === 'failed'
            ? 'Your payment did not complete. You have not been charged.'
            : undefined,
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
