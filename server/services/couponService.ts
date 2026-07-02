import { prisma } from "../config/prisma.js";

export const normalizeCouponCode = (code?: string) => code?.trim().toUpperCase() || "";

export const calculateCouponDiscount = async (
  code: string | undefined,
  subtotal: number,
  userId: string,
) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return { coupon: null, discount: 0 };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
  if (!coupon || !coupon.isActive) {
    return { coupon: null, discount: 0, error: "Coupon is invalid" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { coupon: null, discount: 0, error: "Coupon is not active yet" };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { coupon: null, discount: 0, error: "Coupon has expired" };
  }

  if (subtotal < coupon.minimumOrder) {
    return {
      coupon: null,
      discount: 0,
      error: `Minimum order amount for this coupon is ${coupon.minimumOrder}`,
    };
  }

  if (coupon.usageLimit) {
    const totalUsage = await prisma.couponRedemption.count({ where: { couponId: coupon.id } });
    if (totalUsage >= coupon.usageLimit) {
      return { coupon: null, discount: 0, error: "Coupon usage limit reached" };
    }
  }

  const userUsage = await prisma.couponRedemption.count({
    where: {
      couponId: coupon.id,
      userId,
    },
  });

  if (userUsage >= coupon.perUserLimit) {
    return { coupon: null, discount: 0, error: "You have already used this coupon" };
  }

  const rawDiscount =
    coupon.discountType === "PERCENTAGE"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  const cappedDiscount = coupon.maximumDiscount
    ? Math.min(rawDiscount, coupon.maximumDiscount)
    : rawDiscount;
  const discount = Math.min(subtotal, Math.round(cappedDiscount * 100) / 100);

  return { coupon, discount };
};
