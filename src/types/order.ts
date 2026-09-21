import type { Product } from './index';

export type OrderStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedSurpriseOption?: string;
  selectedRingSize?: number;
  selectedJewelryType?: string;
  selectedSize?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type DeliveryMethodType = 'standard' | 'express';

export interface DeliveryMethod {
  id: DeliveryMethodType;
  name: string;
  subtitle: string;
  price: number;
  estimatedDeliveryDate: string;
  carrierInfo: string;
}

export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'cod';

export interface PaymentSummary {
  method: PaymentMethodType;
  cardholderName?: string;
  last4?: string;
  cardBrand?: string;
  isPaid: boolean;
  transactionId: string;
  paidAt: string;
}

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  paymentSummary: PaymentSummary;
  subtotal: number;
  discount: number;
  promoCode?: string;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  estimatedDeliveryDate: string;
  trackingNumber?: string;
  attributedRep?: {
    name: string;
    repUsername: string;
  };
  notes?: string;
  isPersonalPurchase?: boolean;
  isMembershipFee?: boolean;
  repDiscountAmount?: number;
}

export interface SavedAddress {
  id: string;
  isDefault: boolean;
  label?: string; // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
