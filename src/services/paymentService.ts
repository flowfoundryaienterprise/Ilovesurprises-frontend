import { apiClient, ApiError } from './apiClient';
import type { Order, OrderItem, ShippingAddress, DeliveryMethod, PaymentMethodType } from '../types';
import { orderService } from './orderService';

export type PaymentGatewayProvider = 'stripe' | 'paypal' | 'cod';

export type PaymentGatewayStatus =
  | 'succeeded'
  | 'processing'
  | 'requires_action'
  | 'requires_payment_method'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'redirect_required';

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
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentIntentId?: string;
  sessionId?: string;
  paymentMethod?: PaymentMethodType;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  order?: Order;
  transactionId?: string;
  message?: string;
  error?: string;
}

const PENDING_ORDER_KEY_PREFIX = 'ils_pending_payment_';
const LAST_PENDING_ORDER_ID_KEY = 'ils_last_pending_order_id';

/**
 * Returns safe frontend Stripe Publishable Key if configured.
 * Strictly prevents accidental exposure of secret keys.
 */
export function getStripePublishableKey(): string | null {
  const key = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!key) return null;

  if (key.startsWith('sk_') || key.startsWith('rk_')) {
    console.error(
      '[CRITICAL SECURITY WARNING] A secret key was detected in VITE_STRIPE_PUBLISHABLE_KEY. ' +
      'Secret keys must NEVER be exposed in frontend environment variables. Ignoring key.'
    );
    return null;
  }

  return key;
}

/**
 * Temporarily stores pending checkout order context in sessionStorage
 * so that state is preserved across hosted gateway redirects (Stripe Checkout / PayPal).
 */
export function storePendingOrder(orderId: string, data: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PENDING_ORDER_KEY_PREFIX}${orderId}`, JSON.stringify(data));
    sessionStorage.setItem(LAST_PENDING_ORDER_ID_KEY, orderId);
  } catch (err) {
    console.warn('Failed to store pending order in sessionStorage:', err);
  }
}

/**
 * Retrieves pending checkout order context from sessionStorage.
 */
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

/**
 * Removes pending checkout order from sessionStorage.
 */
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
    // Ignore storage errors
  }
}

export const paymentService = {
  getStripePublishableKey,
  storePendingOrder,
  getPendingOrder,
  clearPendingOrder,

  /**
   * Initiates payment flow via the approved backend API.
   * Dispatches to appropriate provider (Stripe, PayPal, or COD).
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    const returnUrl = params.returnUrl || `${window.location.origin}/order-confirmation`;
    const cancelUrl = params.cancelUrl || `${window.location.origin}/payment?payment_status=cancelled`;

    // 1. Cash on Delivery (Doorstep manual payment)
    if (params.paymentMethod === 'cod') {
      try {
        const response = await apiClient.post<{
          success: boolean;
          orderId: string;
          order?: Order;
          message?: string;
        }>('/api/orders/cod', {
          items: params.items,
          shippingAddress: params.shippingAddress,
          deliveryMethod: params.deliveryMethod,
          subtotal: params.subtotal,
          discount: params.discount,
          promoCode: params.promoCode,
          shippingFee: params.shippingFee,
          total: params.total,
          attributedRep: params.attributedRep,
          userId: params.userId,
          isPersonalPurchase: params.isPersonalPurchase,
          repDiscountAmount: params.repDiscountAmount,
          notes: params.notes,
          paymentMethod: 'cod',
        });

        if (response && response.order) {
          orderService.recordBackendVerifiedOrder(response.order);
          return {
            success: true,
            orderId: response.orderId || response.order.id,
            status: 'succeeded',
            order: response.order,
          };
        }

        if (response && response.orderId) {
          return {
            success: true,
            orderId: response.orderId,
            status: 'succeeded',
          };
        }

        throw new ApiError(response?.message || 'Failed to place Cash on Delivery order.', 500);
      } catch (err: any) {
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError(
          err?.message || 'Unable to place Cash on Delivery order. Please try again.',
          0
        );
      }
    }

    // 2. Stripe Gateway (Card, Apple Pay, Google Pay)
    if (
      params.paymentMethod === 'card' ||
      params.paymentMethod === 'apple_pay' ||
      params.paymentMethod === 'google_pay'
    ) {
      try {
        const response = await apiClient.post<{
          success: boolean;
          orderId: string;
          status: PaymentGatewayStatus;
          clientSecret?: string;
          paymentIntentId?: string;
          checkoutUrl?: string;
          order?: Order;
          message?: string;
        }>('/api/payments/create-intent', {
          amount: Math.round(params.total * 100), // In cents for Stripe
          currency: 'usd',
          paymentMethod: params.paymentMethod,
          items: params.items,
          shippingAddress: params.shippingAddress,
          deliveryMethod: params.deliveryMethod,
          subtotal: params.subtotal,
          discount: params.discount,
          promoCode: params.promoCode,
          shippingFee: params.shippingFee,
          total: params.total,
          attributedRep: params.attributedRep,
          userId: params.userId,
          isPersonalPurchase: params.isPersonalPurchase,
          repDiscountAmount: params.repDiscountAmount,
          notes: params.notes,
          cardDetails: params.paymentMethod === 'card' ? params.cardDetails : undefined,
          returnUrl,
          cancelUrl,
        });

        // Store pending order in sessionStorage for redirect flows or callback resumption
        storePendingOrder(response.orderId, {
          orderId: response.orderId,
          params,
          paymentIntentId: response.paymentIntentId,
        });

        // If backend provides hosted checkout URL (Stripe Checkout Session or 3DS verification)
        if (response.checkoutUrl) {
          return {
            success: true,
            orderId: response.orderId,
            status: 'redirect_required',
            checkoutUrl: response.checkoutUrl,
            requiresRedirect: true,
            paymentIntentId: response.paymentIntentId,
          };
        }

        // If payment was completed synchronously by backend
        if (response.status === 'succeeded' && response.order) {
          orderService.recordBackendVerifiedOrder(response.order);
          clearPendingOrder(response.orderId);
          return {
            success: true,
            orderId: response.orderId || response.order.id,
            status: 'succeeded',
            order: response.order,
            paymentIntentId: response.paymentIntentId,
          };
        }

        // If clientSecret was returned for in-page confirmation
        if (response.clientSecret || response.status === 'requires_action') {
          return {
            success: true,
            orderId: response.orderId,
            status: response.status || 'requires_action',
            clientSecret: response.clientSecret,
            paymentIntentId: response.paymentIntentId,
          };
        }

        return {
          success: response.success,
          orderId: response.orderId,
          status: response.status || 'processing',
          paymentIntentId: response.paymentIntentId,
          order: response.order,
        };
      } catch (err: any) {
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError(
          err?.message || 'Payment authorization failed with the gateway. Please verify your payment details.',
          0
        );
      }
    }

    // 3. PayPal Express Gateway
    if (params.paymentMethod === 'paypal') {
      try {
        const response = await apiClient.post<{
          success: boolean;
          orderId: string;
          checkoutUrl?: string;
          status: PaymentGatewayStatus;
          message?: string;
        }>('/api/payments/paypal/create-order', {
          amount: params.total,
          currency: 'USD',
          items: params.items,
          shippingAddress: params.shippingAddress,
          deliveryMethod: params.deliveryMethod,
          total: params.total,
          returnUrl,
          cancelUrl,
        });

        if (response.checkoutUrl) {
          storePendingOrder(response.orderId, {
            orderId: response.orderId,
            params,
          });

          return {
            success: true,
            orderId: response.orderId,
            status: 'redirect_required',
            checkoutUrl: response.checkoutUrl,
            requiresRedirect: true,
          };
        }

        throw new ApiError(response.message || 'Unable to initiate PayPal Express session.', 500);
      } catch (err: any) {
        if (err instanceof ApiError) {
          throw err;
        }
        throw new ApiError(err?.message || 'Failed to initiate PayPal payment.', 0);
      }
    }

    throw new ApiError(`Unsupported payment method: ${params.paymentMethod}`, 400);
  },

  /**
   * Verifies payment result strictly through the supported backend flow.
   * Crucial: Does NOT mark an order as paid based solely on frontend callbacks.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.orderId && !params.sessionId && !params.paymentIntentId) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        error: 'Missing order reference or payment gateway session token for verification.',
      };
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        verified: boolean;
        status: 'paid' | 'pending' | 'failed' | 'cancelled';
        order?: Order;
        transactionId?: string;
        message?: string;
      }>('/api/payments/verify', {
        orderId: params.orderId,
        paymentIntentId: params.paymentIntentId,
        sessionId: params.sessionId,
        paymentMethod: params.paymentMethod,
      });

      if (response.verified && response.order) {
        orderService.recordBackendVerifiedOrder(response.order);
        clearPendingOrder(params.orderId);
        return {
          success: true,
          verified: true,
          status: 'paid',
          order: response.order,
          transactionId: response.transactionId || response.order.paymentSummary.transactionId,
          message: response.message,
        };
      }

      return {
        success: response.success,
        verified: response.verified || false,
        status: response.status || 'pending',
        order: response.order,
        transactionId: response.transactionId,
        message: response.message || 'Payment verification pending gateway confirmation.',
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        return {
          success: false,
          verified: false,
          status: 'failed',
          error: err.message,
          message: err.message,
        };
      }
      return {
        success: false,
        verified: false,
        status: 'failed',
        error: err?.message || 'Network error verifying payment with backend server.',
        message: 'Network error verifying payment with backend server.',
      };
    }
  },
};
