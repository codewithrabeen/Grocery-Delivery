import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, routeParam } from "../utils/api.js";

const findPurchasedOrder = async (userId: string, productId: string, orderId?: string) => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      ...(orderId ? { id: orderId } : {}),
      status: { in: ["Delivered", "Confirmed", "Packed", "Out For Delivery", "Out for Delivery"] },
    },
    select: { id: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.find(
    (order) =>
      Array.isArray(order.items) &&
      (order.items as any[]).some((item) => item.productId === productId),
  );
};

const refreshProductRating = async (productId: string) => {
  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      reviewCount: aggregate._count.rating,
    },
  });
};

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const productId = routeParam(req.params.productId);
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { productId, orderId, rating, comment } = req.body;
  const purchasedOrder = await findPurchasedOrder(req.user!.id, productId, orderId);

  if (!purchasedOrder) {
    return res.status(403).json({ message: "You can review only products you purchased" });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId_orderId: {
        userId: req.user!.id,
        productId,
        orderId: purchasedOrder.id,
      },
    },
    update: { rating, comment },
    create: {
      userId: req.user!.id,
      productId,
      orderId: purchasedOrder.id,
      rating,
      comment,
    },
  });

  await refreshProductRating(productId);
  return res.status(201).json({ success: true, message: "Review saved", review });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewId = routeParam(req.params.id);
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: req.user!.id },
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  const updatedReview = await prisma.review.update({
    where: { id: review.id },
    data: {
      rating: req.body.rating,
      comment: req.body.comment,
    },
  });

  await refreshProductRating(review.productId);
  return res.json({ success: true, message: "Review updated", review: updatedReview });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewId = routeParam(req.params.id);
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: req.user!.id },
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  await prisma.review.delete({ where: { id: review.id } });
  await refreshProductRating(review.productId);

  return res.json({ success: true, message: "Review deleted" });
});
