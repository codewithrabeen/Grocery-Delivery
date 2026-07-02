import api from "../config/api";

export type CouponValidation = {
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  discount: number;
};

export const couponService = {
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
    const { data } = await api.post<CouponValidation>("/coupons/validate", {
      code,
      subtotal,
    });

    return {
      coupon: data.coupon ?? null,
      discount: Number(data.discount ?? 0),
    };
  },
};
