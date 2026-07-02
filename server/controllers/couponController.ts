import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { calculateCouponDiscount, normalizeCouponCode } from "../services/couponService.js";
import { asyncHandler, routeParam } from "../utils/api.js";

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  const result = await calculateCouponDiscount(code, Number(subtotal), req.user!.id);

  if (result.error) {
    return res.status(400).json({ success: false, message: result.error });
  }

  return res.json({
    success: true,
    coupon: result.coupon,
    discount: result.discount,
  });
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ success: true, coupons });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.create({
    data: {
      ...req.body,
      code: normalizeCouponCode(req.body.code),
      startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    },
  });

  return res.status(201).json({ success: true, message: "Coupon created", coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await prisma.coupon.update({
    where: { id: routeParam(req.params.id) },
    data: {
      ...req.body,
      ...(req.body.code ? { code: normalizeCouponCode(req.body.code) } : {}),
      ...(req.body.startsAt ? { startsAt: new Date(req.body.startsAt) } : {}),
      ...(req.body.expiresAt ? { expiresAt: new Date(req.body.expiresAt) } : {}),
    },
  });

  return res.json({ success: true, message: "Coupon updated", coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.delete({ where: { id: routeParam(req.params.id) } });
  return res.json({ success: true, message: "Coupon deleted" });
});
