import { Request, Response } from "express";
import Stripe from "stripe";
import { deleteUnpaidOrder, fulfillPaidOrder } from "../services/orderFulfillment.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
