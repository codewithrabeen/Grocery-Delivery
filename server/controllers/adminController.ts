import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, routeParam } from "../utils/api.js";
import { appendStatusHistory, ORDER_STATUS } from "../services/orderFulfillment.js";

export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const paidOrderWhere = {
    OR: [{ isPaid: true }, { paymentMethod: "cash" }],
    NOT: [{ status: { in: ["Cancelled", "Returned", "Refunded"] } }],
  };

  const [
    totalOrders,
    totalUser,
    totalProducts,
    outOfStock,
    lowStock,
    totalPartners,
    recentOrders,
    revenueAggregate,
    weeklyRevenueAggregate,
    monthlyRevenueAggregate,
    topProducts,
  ] = await Promise.all([
    prisma.order.count({ where: paidOrderWhere }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.findMany({
      where: { stock: { lte: Number(process.env.LOW_STOCK_THRESHOLD ?? 10) } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.deliveryPartner.count(),
    prisma.order.findMany({
      where: paidOrderWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        deliveryPartner: { select: { id: true, name: true, phone: true, email: true, vehicleType: true } },
      },
    }),
    prisma.order.aggregate({ where: paidOrderWhere, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { ...paidOrderWhere, createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { ...paidOrderWhere, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      orderBy: [{ soldCount: "desc" }, { reviewCount: "desc" }],
      take: 8,
    }),
  ]);

  const recentMonthlyOrders = await prisma.order.findMany({
    where: {
      ...paidOrderWhere,
      createdAt: { gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) },
    },
    select: { total: true, createdAt: true },
  });

  const monthlySales = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - offset), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const total = recentMonthlyOrders
      .filter((order) => `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}` === key)
      .reduce((sum, order) => sum + order.total, 0);

    return {
      label: date.toLocaleString("en", { month: "short" }),
      total: Math.round(total * 100) / 100,
    };
  });

  return res.json({
    success: true,
    totalOrders,
    totalUser,
    totalProducts,
    outOfStock,
    totalPartners,
    revenue: revenueAggregate._sum.total ?? 0,
    weeklySales: weeklyRevenueAggregate._sum.total ?? 0,
    monthlySalesTotal: monthlyRevenueAggregate._sum.total ?? 0,
    monthlySales,
    recentOrders,
    topSelling: topProducts,
    lowStock,
  });
});

export const getDeliveryPartners = asyncHandler(async (_req: Request, res: Response) => {
  const partners = await prisma.deliveryPartner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, partners });
});

export const createtDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, vehicleType } = req.body;
  const existingPartner = await prisma.deliveryPartner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingPartner) {
    return res.status(400).json({ message: "Delivery partner email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const partner = await prisma.deliveryPartner.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      vehicleType,
    },
  });
  const { password: _password, ...safePartner } = partner;

  return res.status(201).json({
    success: true,
    message: "Delivery partner created",
    partner: safePartner,
  });
});

export const updateDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, vehicleType, isActive, password } = req.body;
  const partnerId = routeParam(req.params.id);
  const data: any = {};

  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (vehicleType !== undefined) data.vehicleType = vehicleType;
  if (isActive !== undefined) data.isActive = isActive;
  if (password) data.password = await bcrypt.hash(password, 10);

  const partner = await prisma.deliveryPartner.update({
    where: { id: partnerId },
    data,
  });
  const { password: _password, ...safePartner } = partner;

  return res.json({ success: true, message: "Delivery partner updated", partner: safePartner });
});

export const deleteDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
  await prisma.deliveryPartner.delete({ where: { id: routeParam(req.params.id) } });
  return res.json({ success: true, message: "Delivery partner deleted" });
});

export const assignDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
  const { partnerId } = req.body;
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!partner || partner.isActive === false) {
    return res.status(404).json({ message: "Active delivery partner not found" });
  }

  if (["Cancelled", "Delivered", "Returned", "Refunded"].includes(order.status)) {
    return res.status(400).json({ message: `Cannot assign partner to ${order.status} order` });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const status =
    order.status === ORDER_STATUS.CONFIRMED || order.status === "Placed"
      ? ORDER_STATUS.ASSIGNED
      : order.status;

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      deliveryPartnerId: partner.id,
      deliveryOtp: otp,
      status,
      statusHistory: appendStatusHistory(order.statusHistory, status, `Assigned to ${partner.name}`) as any,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      deliveryPartner: { select: { id: true, name: true, phone: true, email: true, vehicleType: true } },
    },
  });

  return res.json({ success: true, message: "Delivery partner assigned", order: updatedOrder });
});
