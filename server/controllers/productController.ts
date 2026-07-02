import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { asyncHandler, routeParam } from "../utils/api.js";

const withDiscount = (product: any) => {
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const price = Number(product.price || 0);
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  return { ...product, discount };
};

const buildProductWhere = (query: Request["query"]): Prisma.ProductWhereInput => {
  const { category, search, minPrice, maxPrice, minRating, availability, featured } = query as any;
  const where: Prisma.ProductWhereInput = {};

  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: Number(minPrice) } : {}),
      ...(maxPrice !== undefined ? { lte: Number(maxPrice) } : {}),
    };
  }
  if (minRating !== undefined) where.rating = { gte: Number(minRating) };
  if (availability === "in-stock") where.stock = { gt: 0 };
  if (availability === "out-of-stock") where.stock = { lte: 0 };
  if (featured !== undefined) where.isFeatured = Boolean(featured);

  return where;
};

const buildProductOrder = (sort?: string): Prisma.ProductOrderByWithRelationInput[] => {
  if (sort === "price-low") return [{ price: "asc" }];
  if (sort === "price-high") return [{ price: "desc" }];
  if (sort === "rating") return [{ rating: "desc" }, { reviewCount: "desc" }];
  if (sort === "newest") return [{ createdAt: "desc" }];
  if (sort === "best-selling") return [{ soldCount: "desc" }, { reviewCount: "desc" }];
  if (sort === "featured") return [{ isFeatured: "desc" }, { createdAt: "desc" }];
  return [{ reviewCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }];
};

export const getFlashDeals = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 }, originalPrice: { gt: 0 } },
    orderBy: [{ originalPrice: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  return res.json({ success: true, products: products.map(withDiscount) });
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 48);
  const skip = (page - 1) * limit;
  const where = buildProductWhere(req.query);
  const orderBy = buildProductOrder(req.query.sort as string | undefined);

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  return res.json({
    success: true,
    products: products.map(withDiscount),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = routeParam(req.params.id);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ success: true, product: withDiscount(product) });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.create({ data: req.body });
  return res.status(201).json({ success: true, message: "Product created successfully", product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.update({
    where: { id: routeParam(req.params.id) },
    data: req.body,
  });

  return res.json({ success: true, message: "Product updated successfully", product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await prisma.product.delete({ where: { id: routeParam(req.params.id) } });
  return res.json({ success: true, message: "Product deleted successfully" });
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const productId = routeParam(req.params.id);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const products = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      category: product.category,
      stock: { gt: 0 },
    },
    orderBy: buildProductOrder("popular"),
    take: 8,
  });

  return res.json({ success: true, products: products.map(withDiscount) });
});

export const getFrequentlyBoughtTogether = asyncHandler(async (req: Request, res: Response) => {
  const productId = routeParam(req.params.id);
  const orders = await prisma.order.findMany({
    select: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = new Map<string, number>();
  for (const order of orders) {
    if (!Array.isArray(order.items)) continue;
    const items = order.items as any[];
    if (!items.some((item) => item.productId === productId)) continue;

    for (const item of items) {
      if (!item.productId || item.productId === productId) continue;
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + Number(item.quantity ?? 1));
    }
  }

  const ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 8);
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids }, stock: { gt: 0 } } })
    : await prisma.product.findMany({ where: { id: { not: productId }, stock: { gt: 0 } }, take: 8 });

  return res.json({ success: true, products: products.map(withDiscount) });
});

export const getTrendingProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: [{ soldCount: "desc" }, { reviewCount: "desc" }, { rating: "desc" }],
    take: 12,
  });

  return res.json({ success: true, products: products.map(withDiscount) });
});

export const getNewArrivals = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return res.json({ success: true, products: products.map(withDiscount) });
});

export const getPopularProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: buildProductOrder("popular"),
    take: 12,
  });

  return res.json({ success: true, products: products.map(withDiscount) });
});
