import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

type OrderItem = {
  productId?: string;
  quantity?: number;
};

export const readOrderItems = (items: unknown): OrderItem[] => (Array.isArray(items) ? items : []);

export const reduceStock = async (orderItems: { productId: string; quantity: number }[]) => {
  for (const item of orderItems) {
    await prisma.product.update({
      where: {
        id: item.productId,
      },
      data: {
        stock: {
          decrement: item.quantity,
        },
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
      data: {
        productId: item.productId,
      },
    });
  }

  await inngest.send({
    name: "order/placed",
    data: {
      orderId,
    },
  });
};

export const fulfillPaidOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return null;
  if (order.isPaid) return order;

  const paymentUpdate = await prisma.order.updateMany({
    where: {
      id: orderId,
      isPaid: false,
    },
    data: { isPaid: true },
  });

  const paidOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!paidOrder || paymentUpdate.count === 0) return paidOrder;

  const orderItems = readOrderItems(paidOrder.items)
    .filter((item): item is { productId: string; quantity: number } =>
      Boolean(item.productId && item.quantity),
    );

  await reduceStock(orderItems);
  await sendOrderEvents(orderId, orderItems);

  return paidOrder;
};

export const deleteUnpaidOrder = async (orderId?: string) => {
  if (!orderId) return;

  await prisma.order.deleteMany({
    where: {
      id: orderId,
      isPaid: false,
    },
  });
};
