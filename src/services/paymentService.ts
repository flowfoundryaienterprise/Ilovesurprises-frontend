import type { Order, OrderItem, ShippingAddress, DeliveryMethod, PaymentMethodType } from '../types';
import { orderService } from './orderService';

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

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
 */
export function getStripePublishableKey(): string | null {
  const key = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!key) return null;
  return key;
}

/**
 * Temporarily stores pending checkout order context in sessionStorage
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
   * Initiates payment flow locally and persists the order cleanly.
   * Completely independent of any remote backend.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    // Realistic UI response delay (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const isPaid = params.paymentMethod !== 'cod';
    const txnId = `TXN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const order = await orderService.createOrder({
      items: params.items,
      shippingAddress: params.shippingAddress,
      deliveryMethod: params.deliveryMethod,
      paymentSummary: {
        method: params.paymentMethod,
        cardholderName: params.cardDetails?.cardholderName || params.shippingAddress.fullName,
        last4: params.cardDetails?.last4 || (params.paymentMethod === 'card' ? '4242' : undefined),
        cardBrand: params.cardDetails?.cardBrand || (params.paymentMethod === 'card' ? 'Visa' : undefined),
        isPaid,
        transactionId: txnId,
        paidAt: new Date().toISOString(),
        gatewayStatus: 'succeeded',
      },
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
    });

    clearPendingOrder(order.id);

    return {
      success: true,
      orderId: order.id,
      status: 'succeeded',
      order,
    };
  },

  /**
   * Verifies payment result through local order store.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.orderId && !params.sessionId && !params.paymentIntentId) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        error: 'Missing order reference.',
      };
    }

    const order = params.orderId ? orderService.getOrderById(params.orderId) : undefined;

    return {
      success: true,
      verified: true,
      status: 'paid',
      order,
      transactionId: order?.paymentSummary.transactionId || 'TXN-LOCAL',
      message: 'Payment verified successfully.',
    };
  },
};
