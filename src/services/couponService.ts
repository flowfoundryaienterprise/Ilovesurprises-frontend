import { apiClient } from './apiClient';

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
  async validateCoupon(code: string, orderAmount: number): Promise<CouponValidationResult> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: {
          valid: boolean;
          discountAmount: number;
          finalAmount: number;
          coupon: {
            code: string;
            discountType: 'percentage' | 'fixed';
            discountValue: number;
          };
        };
        message?: string;
      }>('/api/coupons/validate', {
        code: code.trim().toUpperCase(),
        orderAmount,
      });

      if (response.data && response.data.valid) {
        const discountPercent =
          response.data.coupon.discountType === 'percentage'
            ? response.data.coupon.discountValue
            : Math.round((response.data.discountAmount / orderAmount) * 100);

        return {
          valid: true,
          discountPercent,
          discountAmount: response.data.discountAmount,
          finalAmount: response.data.finalAmount,
          coupon: response.data.coupon,
        };
      }

      return {
        valid: false,
        message: response.message || 'Invalid coupon code.',
      };
    } catch (err: any) {
      return {
        valid: false,
        message: err?.message || 'Invalid or expired coupon code.',
      };
    }
  },
};
