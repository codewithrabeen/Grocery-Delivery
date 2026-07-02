import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, routeParam } from "../utils/api.js";

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    success: true,
    productIds: wishlist.map((item) => item.productId),
    wishlist,
  });
});

export const addWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId: req.user!.id,
        productId,
      },
    },
    update: {},
    create: {
      userId: req.user!.id,
      productId,
    },
  });

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return res.status(201).json({
    success: true,
    message: "Product added to wishlist",
    productIds: wishlist.map((item) => item.productId),
    wishlist,
  });
});

export const deleteWishlistItem = asyncHandler(async (req: Request, res: Response) => {
  const productId = routeParam(req.params.productId);
  await prisma.wishlist.deleteMany({
    where: {
      userId: req.user!.id,
      productId,
    },
  });

  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    success: true,
    message: "Product removed from wishlist",
    productIds: wishlist.map((item) => item.productId),
    wishlist,
  });
});
