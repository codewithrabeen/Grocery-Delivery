import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { calculateCouponDiscount } from "../services/couponService.js";
import {
  appendStatusHistory,
  cancelOrder,
  markOrderStockReduced,
  ORDER_STATUS,
  PAYMENT_STATUS,
  restoreOrderStockIfNeeded,
} from "../services/orderFulfillment.js";
import {
  createPaymentSession,
  isPaymentProviderConfigured,
  providerForPaymentMethod,
  verifyStripePayment,
} from "../services/paymentService.js";
import { sendOrderNotification } from "../services/notificationService.js";
import { asyncHandler, routeParam } from "../utils/api.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const getClientOrigin = (req: Request) =>
  typeof req.headers.origin === "string" ? req.headers.origin : CLIENT_URL;

const getServerOrigin = (req: Request) =>
  process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;

const normalizePaymentMethod = (paymentMethod: string) =>
  paymentMethod === "stripe" ? "card" : paymentMethod;

const includeOrderRelations = {
  deliveryPartner: {
    select: {
      id: true,
      name: true,
      phone: true,
      avatar: true,
      vehicleType: true,
    },
  },
} as const;

const validateOrderItems = (items: any[]) => {
  const normalized = items.map((item) => ({
    productId:
      typeof item.productId === "string"
        ? item.productId.trim()
        : typeof item.id === "string"
          ? item.id.trim()
          : typeof item.product === "string"
            ? item.product.trim()
            : "",
    quantity: Number(item.quantity),
    clientPrice: item.price !== undefined ? Number(item.price) : undefined,
  }));

  const invalidItems = normalized.filter(
    (item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0,
  );

  return { normalized, invalidItems };
};

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { items, shippingAddress, paymentMethod, deliveryWindow, couponCode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const { normalized, invalidItems } = validateOrderItems(items);
  if (invalidItems.length > 0) {
    return res.status(400).json({
      message: "Invalid cart items. Each item needs a valid productId and quantity greater than 0.",
      invalidItems,
    });
  }

  const productIds = [...new Set(normalized.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const missingProductIds = productIds.filter((productId) => !productMap.has(productId));

  if (missingProductIds.length > 0) {
    return res.status(404).json({
      message: "Some products in your cart are no longer available",
      missingProductIds,
    });
  }

  for (const item of normalized) {
    const product = productMap.get(item.productId)!;

    if ((product.stock ?? 0) < item.quantity) {
      return res.status(400).json({
        message: `Insufficient stock for ${product.name}`,
        productId: product.id,
        availableStock: product.stock ?? 0,
      });
    }

    if (item.clientPrice !== undefined && Math.abs(item.clientPrice - product.price) > 0.01) {
      return res.status(409).json({
        message: `Price changed for ${product.name}. Please refresh your cart.`,
        productId: product.id,
        currentPrice: product.price,
      });
    }
  }

  const orderItems = normalized.map((item) => {
    const product = productMap.get(item.productId)!;

    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
    };
  });

  const subtotal = Math.round(
    orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
  ) / 100;
  const couponResult = await calculateCouponDiscount(couponCode, subtotal, req.user!.id);

  if (couponResult.error) {
    return res.status(400).json({ message: couponResult.error });
  }

  const discount = couponResult.discount;
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const deliveryFee = subtotal === 0 || taxableSubtotal >= 1500 ? 0 : 99;
  const tax = Math.round(taxableSubtotal * 0.13);
  const total = Math.round((taxableSubtotal + deliveryFee + tax) * 100) / 100;
  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
  const provider = providerForPaymentMethod(normalizedPaymentMethod);
  const isOnlinePayment = Boolean(provider);

  if (provider && !isPaymentProviderConfigured(provider)) {
    const label = provider === "stripe" ? "Card payment" : provider === "khalti" ? "Khalti" : "eSewa";
    return res.status(400).json({
      success: false,
      message: `${label} is not available right now. Please choose Cash on Delivery or another payment method.`,
    });
  }

  const orderStatus = isOnlinePayment ? ORDER_STATUS.PAYMENT_PENDING : ORDER_STATUS.CONFIRMED;
  const paymentStatus = isOnlinePayment ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.COD_PENDING;

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      items: orderItems as any,
      shippingAddress: shippingAddress as any,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus,
      subtotal,
      deliveryFee,
      tax,
      discount,
      total,
      status: orderStatus,
      statusHistory: [
        {
          status: orderStatus,
          note: isOnlinePayment ? "Waiting for payment confirmation" : "Cash on delivery order confirmed",
          timestamp: new Date().toISOString(),
        },
      ] as any,
      paymentHistory: [
        {
          status: paymentStatus,
          provider: provider ?? "cod",
          timestamp: new Date().toISOString(),
        },
      ] as any,
      couponId: couponResult.coupon?.id,
      couponCode: couponResult.coupon?.code,
      deliveryWindow,
      receipt: {
        subtotal,
        deliveryFee,
        tax,
        discount,
        total,
        issuedAt: new Date().toISOString(),
      } as any,
      confirmedAt: isOnlinePayment ? undefined : new Date(),
    },
    include: includeOrderRelations,
  });

  if (!isOnlinePayment) {
    await markOrderStockReduced(order.id);
    const confirmedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: includeOrderRelations,
    });
    void sendOrderNotification(order.id, "order_placed");
    return res.status(201).json({ success: true, order: confirmedOrder });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !provider) {
      return res.status(404).json({ message: "User not found" });
    }

    const payment = await createPaymentSession({
      order,
      user,
      provider,
      clientOrigin: getClientOrigin(req),
      serverOrigin: getServerOrigin(req),
    });

    return res.status(201).json({
      success: true,
      url: payment.url,
      orderId: order.id,
      paymentId: payment.paymentId,
      provider: payment.provider,
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.PAYMENT_FAILED,
        paymentStatus: PAYMENT_STATUS.FAILED,
        paymentFailureReason: error instanceof Error ? error.message : "Payment initiation failed",
        statusHistory: appendStatusHistory(order.statusHistory, ORDER_STATUS.PAYMENT_FAILED, "Payment initiation failed") as any,
      },
    });
    throw error;
  }
});

export const confirmStripePayment = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ message: "Stripe session id is required" });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.id },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const paidOrder = await verifyStripePayment(orderId, sessionId, req.user!.id);
  const loadedOrder = await prisma.order.findUnique({
    where: { id: paidOrder?.id ?? orderId },
    include: includeOrderRelations,
  });

  return res.json({ success: true, order: loadedOrder });
});

export const retryOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: req.user!.id,
      isPaid: false,
      paymentMethod: { in: ["card", "khalti", "esewa"] },
    },
  });

  if (!order) {
    return res.status(404).json({ message: "Retryable order not found" });
  }

  const provider = providerForPaymentMethod(order.paymentMethod);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!provider || !user) {
    return res.status(400).json({ message: "Payment method cannot be retried" });
  }

  const payment = await createPaymentSession({
    order,
    user,
    provider,
    clientOrigin: getClientOrigin(req),
    serverOrigin: getServerOrigin(req),
  });

  return res.json({
    success: true,
    url: payment.url,
    orderId: order.id,
    paymentId: payment.paymentId,
    provider: payment.provider,
  });
});

export const getUserOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = { userId: req.user!.id };

  if (status && status !== "all") {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: includeOrderRelations,
    orderBy: { createdAt: "desc" },
  });

  return res.json(orders);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: req.user!.id,
    },
    include: includeOrderRelations,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (status === ORDER_STATUS.CANCELLED) {
    const cancelledOrder = await cancelOrder(order.id, note || "Order cancelled by admin");
    return res.json({ success: true, order: cancelledOrder });
  }

  if ([ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED].includes(status)) {
    await restoreOrderStockIfNeeded(order.id);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status,
      paymentStatus: status === ORDER_STATUS.REFUNDED ? PAYMENT_STATUS.REFUNDED : order.paymentStatus,
      statusHistory: appendStatusHistory(order.statusHistory, status, note) as any,
      ...(status === ORDER_STATUS.REFUNDED ? { refundedAt: new Date() } : {}),
      ...(status === ORDER_STATUS.RETURNED ? { returnedAt: new Date() } : {}),
      ...(status === ORDER_STATUS.PACKED ? { packedAt: new Date() } : {}),
      ...(status === ORDER_STATUS.OUT_FOR_DELIVERY || status === "Out for Delivery"
        ? { outForDeliveryAt: new Date() }
        : {}),
      ...(status === ORDER_STATUS.DELIVERED ? { deliveredAt: new Date() } : {}),
    },
    include: includeOrderRelations,
  });

  if (status === ORDER_STATUS.OUT_FOR_DELIVERY || status === "Out for Delivery") {
    void sendOrderNotification(order.id, "order_shipped");
  } else if (status === ORDER_STATUS.DELIVERED) {
    void sendOrderNotification(order.id, "order_delivered");
  } else if (status === ORDER_STATUS.CANCELLED) {
    void sendOrderNotification(order.id, "order_cancelled", note);
  }

  return res.json({ success: true, order: updatedOrder });
});

export const getAllOrders = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      ...includeOrderRelations,
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(orders);
});

export const getOrderLocation = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: req.user!.id,
    },
    select: {
      liveLocation: true,
      status: true,
      estimatedDeliveryAt: true,
    },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({
    liveLocation: order.liveLocation,
    status: order.status,
    estimatedDeliveryAt: order.estimatedDeliveryAt,
  });
});

export const getOrderReceipt = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.id },
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({
    success: true,
    receipt: order.receipt,
    order,
  });
});
