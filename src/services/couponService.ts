import { MOCK_COUPONS } from '../data/mockData';

export interface CouponValidationResult {
  valid: boolean;
  discountPercent?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
  coupon?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
}

export const couponService = {
  /**
   * Validates promotional coupon codes locally.
   */
  async validateCoupon(code: string, orderAmount: number): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      return {
        valid: false,
        message: 'Please enter a coupon code.',
      };
    }

    const matched = MOCK_COUPONS[cleanCode];

    if (!matched) {
      return {
        valid: false,
        message: 'Invalid or expired coupon code.',
      };
    }

    if (matched.minOrderAmount && orderAmount < matched.minOrderAmount) {
      return {
        valid: false,
        message: `This coupon requires a minimum purchase of $${matched.minOrderAmount.toFixed(2)}.`,
      };
    }

    let discountAmount = 0;
    let discountPercent = 0;

    if (matched.discountType === 'percentage') {
      discountPercent = matched.discountValue;
      discountAmount = Number(((orderAmount * matched.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(orderAmount, matched.discountValue);
      discountPercent = orderAmount > 0 ? Math.round((discountAmount / orderAmount) * 100) : 0;
    }

    const finalAmount = Math.max(0, Number((orderAmount - discountAmount).toFixed(2)));

    return {
      valid: true,
      discountPercent,
      discountAmount,
      finalAmount,
      coupon: {
        code: matched.code,
        discountType: matched.discountType,
        discountValue: matched.discountValue,
      },
    };
  },
};
