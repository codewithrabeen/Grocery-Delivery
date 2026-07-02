import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import { Prisma } from "../generated/prisma/client.js";
import { readJsonArray } from "../utils/api.js";
import { sendOrderNotification } from "./notificationService.js";

export type OrderItem = {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
};

export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_FAILED: "Payment Failed",
  REFUNDED: "Refunded",
  ASSIGNED: "Assigned",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  COD_PENDING: "COD_PENDING",
  REFUNDED: "REFUNDED",
} as const;

export const readOrderItems = (items: unknown): OrderItem[] => (Array.isArray(items) ? items : []);

const timestampForStatus = (status: string) => {
  if (status === ORDER_STATUS.CONFIRMED) return { confirmedAt: new Date() };
  if (status === ORDER_STATUS.PACKED) return { packedAt: new Date() };
  if (status === ORDER_STATUS.OUT_FOR_DELIVERY || status === "Out for Delivery") {
    return { outForDeliveryAt: new Date() };
  }
  if (status === ORDER_STATUS.DELIVERED) return { deliveredAt: new Date() };
  if (status === ORDER_STATUS.CANCELLED) return { cancelledAt: new Date() };
  if (status === ORDER_STATUS.RETURNED) return { returnedAt: new Date() };
  if (status === ORDER_STATUS.REFUNDED) return { refundedAt: new Date() };
  return {};
};

export const appendStatusHistory = (
  currentHistory: Prisma.JsonValue | null | undefined,
  status: string,
  note?: string,
) => [
  ...readJsonArray(currentHistory),
  {
    status,
    note: note || `Order ${status.toLowerCase()}`,
    timestamp: new Date().toISOString(),
  },
];

export const appendPaymentHistory = (
  currentHistory: Prisma.JsonValue | null | undefined,
  entry: Record<string, unknown>,
) => [
  ...readJsonArray(currentHistory),
  {
    ...entry,
    timestamp: new Date().toISOString(),
  },
];

export const reduceStock = async (orderItems: { productId: string; quantity: number }[]) => {
  for (const item of orderItems) {
    const result = await prisma.product.updateMany({
      where: {
        id: item.productId,
        stock: { gte: item.quantity },
      },
      data: {
        stock: { decrement: item.quantity },
        soldCount: { increment: item.quantity },
      },
    });

    if (result.count === 0) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
  }
};

export const restoreStock = async (orderItems: { productId: string; quantity: number }[]) => {
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        soldCount: { decrement: item.quantity },
      },
    });
  }
};

export const sendOrderEvents = async (
  orderId: string,
  orderItems: { productId: string; quantity: number }[],
) => {
  for (const item of orderItems) {
    await inngest.send({
      name: "inventory/stock.updated",
      data: { productId: item.productId },
    });
  }

  await inngest.send({
    name: "order/placed",
    data: { orderId },
  });
};

export const orderItemsForStock = (items: unknown) =>
  readOrderItems(items).filter((item): item is { productId: string; quantity: number } =>
    Boolean(item.productId && Number(item.quantity) > 0),
  );

export const markOrderStockReduced = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.isStockReduced) return order;

  const orderItems = orderItemsForStock(order.items);
  await reduceStock(orderItems);

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { isStockReduced: true },
  });

  void sendOrderEvents(order.id, orderItems).catch((error) => {
    console.error(`Failed to dispatch order events for ${order.id}:`, error);
  });
  return updatedOrder;
};

export const restoreOrderStockIfNeeded = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.isStockReduced) return order;

  await restoreStock(orderItemsForStock(order.items));

  return prisma.order.update({
    where: { id: order.id },
    data: { isStockReduced: false },
  });
};

export const buildReceipt = (order: {
  id: string;
  orderNumber?: string | null;
  subtotal: number;
  deliveryFee?: number | null;
  tax?: number | null;
  discount?: number | null;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}) => ({
  orderId: order.id,
  orderNumber: order.orderNumber,
  subtotal: order.subtotal,
  deliveryFee: order.deliveryFee ?? 0,
  tax: order.tax ?? 0,
  discount: order.discount ?? 0,
  total: order.total,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  issuedAt: new Date().toISOString(),
});

export const fulfillPaidOrder = async (
  orderId: string,
  paymentEntry: Record<string, unknown> = {},
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (!order.isStockReduced) {
    await markOrderStockReduced(orderId);
  }

  const latestOrder = await prisma.order.findUnique({ where: { id: orderId } });
  if (!latestOrder) return null;

  const status = latestOrder.status === ORDER_STATUS.DELIVERED ? latestOrder.status : ORDER_STATUS.CONFIRMED;
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      isPaid: true,
      paymentStatus: PAYMENT_STATUS.PAID,
      status,
      statusHistory: appendStatusHistory(latestOrder.statusHistory, status, "Payment confirmed") as any,
      paymentHistory: appendPaymentHistory(latestOrder.paymentHistory, {
        status: PAYMENT_STATUS.PAID,
        ...paymentEntry,
      }) as any,
      receipt: buildReceipt({ ...latestOrder, paymentStatus: PAYMENT_STATUS.PAID }) as any,
      ...timestampForStatus(status),
    },
  });

  void sendOrderNotification(orderId, "payment_success");
  return updatedOrder;
};

export const markPaymentFailed = async (
  orderId: string | undefined,
  reason = "Payment failed",
  paymentEntry: Record<string, unknown> = {},
) => {
  if (!orderId) return null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PAYMENT_STATUS.FAILED,
      status: ORDER_STATUS.PAYMENT_FAILED,
      paymentFailureReason: reason,
      activePaymentId: null,
      retryCount: { increment: 1 },
      statusHistory: appendStatusHistory(order.statusHistory, ORDER_STATUS.PAYMENT_FAILED, reason) as any,
      paymentHistory: appendPaymentHistory(order.paymentHistory, {
        status: PAYMENT_STATUS.FAILED,
        reason,
        ...paymentEntry,
      }) as any,
    },
  });

  await restoreOrderStockIfNeeded(order.id);
  void sendOrderNotification(order.id, "payment_failed", reason);
  return updatedOrder;
};

export const deleteUnpaidOrder = async (orderId?: string) => {
  return markPaymentFailed(orderId, "Payment session expired");
};

export const cancelOrder = async (orderId: string, note = "Order cancelled") => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  await restoreOrderStockIfNeeded(order.id);

  const cancelledOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUS.CANCELLED,
      statusHistory: appendStatusHistory(order.statusHistory, ORDER_STATUS.CANCELLED, note) as any,
      ...timestampForStatus(ORDER_STATUS.CANCELLED),
    },
  });

  void sendOrderNotification(order.id, "order_cancelled", note);
  return cancelledOrder;
};
