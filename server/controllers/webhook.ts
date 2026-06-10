import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

type OrderItem = {
  productId?: string;
  quantity?: number;
};

const readOrderItems = (items: unknown): OrderItem[] => (Array.isArray(items) ? items : []);

const fulfillPaidOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.isPaid) return;

  const paidOrder = await prisma.order.update({
    where: { id: orderId },
    data: { isPaid: true },
  });

  const orderItems = readOrderItems(paidOrder.items);

  for (const item of orderItems) {
    if (!item.productId || !item.quantity) continue;

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

    await inngest.send({
      name: "inventory/stock.updated",
      data: {
        productId: item.productId,
      },
    });
  }

  await inngest.send({
    name: "order/placed",
    data: { orderId },
  });
};

const deleteUnpaidOrder = async (orderId?: string) => {
  if (!orderId) return;

  await prisma.order.deleteMany({
    where: {
      id: orderId,
      isPaid: false,
    },
  });
};

export const stripeWebhook = async (req: Request, res: Response) => {
  if (!stripe || !endpointSecret) {
    return res.status(400).json({ error: "Webhook endpoint not configured." });
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ error: "Missing Stripe signature." });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown signature error";
    console.log("Webhook signature verification failed.", message);
    return res.sendStatus(400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId && session.payment_status === "paid") {
        await fulfillPaidOrder(orderId);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await deleteUnpaidOrder(session.metadata?.orderId);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const session = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });
      const orderId = session.data[0]?.metadata?.orderId;

      if (orderId) {
        await fulfillPaidOrder(orderId);
      }
      break;
    }

    case "payment_intent.canceled":
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const session = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      await deleteUnpaidOrder(session.data[0]?.metadata?.orderId);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.json({ received: true });
};
