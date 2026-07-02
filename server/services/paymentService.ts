import crypto from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { Order } from "../generated/prisma/client.js";
import {
  appendPaymentHistory,
  fulfillPaidOrder,
  markPaymentFailed,
  PAYMENT_STATUS,
} from "./orderFulfillment.js";

type InitiatePaymentInput = {
  order: Order;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  provider: "stripe" | "khalti" | "esewa";
  clientOrigin: string;
  serverOrigin: string;
};

const activeStatuses = ["INITIATED", "PENDING"];

const getActiveTransaction = (orderId: string, provider: string) =>
  prisma.paymentTransaction.findFirst({
    where: {
      orderId,
      provider,
      status: { in: activeStatuses },
      paymentUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

export const providerForPaymentMethod = (paymentMethod: string) => {
  if (paymentMethod === "card" || paymentMethod === "stripe") return "stripe";
  if (paymentMethod === "khalti") return "khalti";
  if (paymentMethod === "esewa") return "esewa";
  return null;
};

export const createPaymentSession = async (input: InitiatePaymentInput) => {
  const existing = await getActiveTransaction(input.order.id, input.provider);

  if (existing?.paymentUrl) {
    return {
      provider: input.provider,
      url: existing.paymentUrl,
      paymentId: existing.id,
      reused: true,
    };
  }

  if (input.provider === "stripe") return createStripeSession(input);
  if (input.provider === "khalti") return createKhaltiSession(input);
  return createEsewaSession(input);
};

const createStripeSession = async ({ order, user, clientOrigin }: InitiatePaymentInput) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    success_url: `${clientOrigin}/payment/success?provider=stripe&orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientOrigin}/payment/failure?provider=stripe&orderId=${order.id}`,
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "npr",
          product_data: {
            name: `Grocery order ${order.orderNumber}`,
          },
          unit_amount: Math.round(order.total * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { orderId: order.id, userId: user.id },
  });

  if (!session.url) {
    throw new Error("Could not create Stripe checkout session");
  }

  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      userId: user.id,
      provider: "stripe",
      paymentMethod: "card",
      amount: order.total,
      status: "INITIATED",
      transactionId: session.id,
      gatewayReference: session.payment_intent?.toString(),
      requestPayload: {
        sessionId: session.id,
        amount: order.total,
      } as any,
      paymentUrl: session.url,
    },
  });

  await markOrderPaymentInitiated(order, transaction.id, {
    provider: "stripe",
    sessionId: session.id,
  });

  return { provider: "stripe", url: session.url, paymentId: transaction.id };
};

const createKhaltiSession = async ({ order, user, clientOrigin }: InitiatePaymentInput) => {
  const secretKey = process.env.KHALTI_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Khalti is not configured");
  }

  const endpoint = process.env.KHALTI_INITIATE_URL || "https://a.khalti.com/api/v2/epayment/initiate/";
  const payload = {
    return_url: `${clientOrigin}/payment/success?provider=khalti&orderId=${order.id}`,
    website_url: clientOrigin,
    amount: Math.round(order.total * 100),
    purchase_order_id: order.id,
    purchase_order_name: `Grocery order ${order.orderNumber}`,
    customer_info: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as any;
  if (!response.ok || !data.payment_url || !data.pidx) {
    throw new Error(data.detail || data.message || "Could not initiate Khalti payment");
  }

  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      userId: user.id,
      provider: "khalti",
      paymentMethod: "khalti",
      amount: order.total,
      status: "INITIATED",
      pidx: data.pidx,
      requestPayload: payload as any,
      verificationResponse: data,
      paymentUrl: data.payment_url,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    },
  });

  await markOrderPaymentInitiated(order, transaction.id, {
    provider: "khalti",
    pidx: data.pidx,
  });

  return { provider: "khalti", url: data.payment_url as string, paymentId: transaction.id };
};

const createEsewaSession = async ({ order, user, clientOrigin, serverOrigin }: InitiatePaymentInput) => {
  const productCode = process.env.ESEWA_PRODUCT_CODE;
  const secret = process.env.ESEWA_SECRET_KEY;

  if (!productCode || !secret) {
    throw new Error("eSewa is not configured");
  }

  const transactionUuid = `${order.id}-${Date.now()}`;
  const amount = order.subtotal.toFixed(2);
  const taxAmount = (order.tax ?? 0).toFixed(2);
  const productServiceCharge = "0";
  const productDeliveryCharge = (order.deliveryFee ?? 0).toFixed(2);
  const totalAmount = order.total.toFixed(2);
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = createEsewaSignature(signatureMessage, secret);

  const payload = {
    amount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: productServiceCharge,
    product_delivery_charge: productDeliveryCharge,
    success_url: `${serverOrigin}/api/payments/esewa/success`,
    failure_url: `${serverOrigin}/api/payments/esewa/failure?orderId=${order.id}&transaction_uuid=${transactionUuid}`,
    signed_field_names: signedFieldNames,
    signature,
  };

  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      userId: user.id,
      provider: "esewa",
      paymentMethod: "esewa",
      amount: order.total,
      status: "INITIATED",
      transactionUuid,
      requestPayload: payload as any,
      paymentUrl: `${serverOrigin}/api/payments/esewa/redirect/${transactionUuid}`,
    },
  });

  await markOrderPaymentInitiated(order, transaction.id, {
    provider: "esewa",
    transactionUuid,
  });

  return {
    provider: "esewa",
    url: `${serverOrigin}/api/payments/esewa/redirect/${transactionUuid}`,
    paymentId: transaction.id,
    payload,
  };
};

const markOrderPaymentInitiated = async (
  order: Order,
  paymentId: string,
  entry: Record<string, unknown>,
) => {
  await prisma.order.update({
    where: { id: order.id },
    data: {
      activePaymentId: paymentId,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentHistory: appendPaymentHistory(order.paymentHistory, {
        status: "INITIATED",
        ...entry,
      }) as any,
    },
  });
};

export const verifyStripePayment = async (orderId: string, sessionId: string, userId?: string) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.orderId !== orderId) {
    throw new Error("Stripe session does not match this order");
  }

  if (session.payment_status !== "paid") {
    await markPaymentFailed(orderId, "Stripe payment has not been completed", {
      provider: "stripe",
      sessionId,
    });
    throw new Error("Payment has not been completed");
  }

  await prisma.paymentTransaction.updateMany({
    where: {
      orderId,
      transactionId: sessionId,
      ...(userId ? { userId } : {}),
    },
    data: {
      status: "COMPLETED",
      verificationResponse: session as any,
      gatewayReference: session.payment_intent?.toString(),
      verifiedAt: new Date(),
    },
  });

  return fulfillPaidOrder(orderId, {
    provider: "stripe",
    sessionId,
    transactionId: session.payment_intent?.toString(),
  });
};

export const lookupKhaltiPayment = async (pidx: string) => {
  const secretKey = process.env.KHALTI_SECRET_KEY;
  if (!secretKey) throw new Error("Khalti is not configured");

  const endpoint = process.env.KHALTI_LOOKUP_URL || "https://a.khalti.com/api/v2/epayment/lookup/";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });

  const data = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Could not verify Khalti payment");
  }

  return data;
};

export const verifyKhaltiPayment = async (orderId: string, pidx: string, userId?: string) => {
  const lookup = await lookupKhaltiPayment(pidx);
  const isCompleted = lookup.status === "Completed";
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      orderId,
      pidx,
      ...(userId ? { userId } : {}),
    },
  });

  if (!transaction) {
    throw new Error("Khalti transaction not found");
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: isCompleted ? "COMPLETED" : lookup.status || "FAILED",
      transactionId: lookup.transaction_id,
      verificationResponse: lookup,
      verifiedAt: isCompleted ? new Date() : undefined,
      failureReason: isCompleted ? null : lookup.status,
    },
  });

  if (!isCompleted) {
    await markPaymentFailed(orderId, `Khalti payment ${lookup.status || "failed"}`, {
      provider: "khalti",
      pidx,
      response: lookup,
    });
    throw new Error(`Khalti payment ${lookup.status || "failed"}`);
  }

  return fulfillPaidOrder(orderId, {
    provider: "khalti",
    pidx,
    transactionId: lookup.transaction_id,
  });
};

export const createEsewaSignature = (message: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(message).digest("base64");

export const decodeEsewaData = (data: string) => {
  const json = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, any>;
};

export const verifyEsewaSignature = (payload: Record<string, any>) => {
  const secret = process.env.ESEWA_SECRET_KEY;
  if (!secret) throw new Error("eSewa is not configured");

  const signedFields = String(payload.signed_field_names || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  const message = signedFields.map((field) => `${field}=${payload[field]}`).join(",");
  const expected = createEsewaSignature(message, secret);
  return expected === payload.signature;
};

export const verifyEsewaPayment = async (transactionUuid: string, data?: string, userId?: string) => {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      transactionUuid,
      provider: "esewa",
      ...(userId ? { userId } : {}),
    },
  });

  if (!transaction) throw new Error("eSewa transaction not found");

  const payload = data ? decodeEsewaData(data) : transaction.verificationResponse;
  const status = String((payload as any)?.status || "").toUpperCase();
  const signatureValid = data ? verifyEsewaSignature(payload as Record<string, any>) : true;

  if (!signatureValid || status !== "COMPLETE") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        verificationResponse: payload as any,
        failureReason: signatureValid ? status || "Failed" : "Invalid signature",
      },
    });

    await markPaymentFailed(transaction.orderId, signatureValid ? "eSewa payment failed" : "Invalid eSewa signature", {
      provider: "esewa",
      transactionUuid,
      response: payload,
    });

    throw new Error(signatureValid ? "eSewa payment failed" : "Invalid eSewa signature");
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: "COMPLETED",
      transactionCode: String((payload as any).transaction_code || ""),
      verificationResponse: payload as any,
      verifiedAt: new Date(),
    },
  });

  return fulfillPaidOrder(transaction.orderId, {
    provider: "esewa",
    transactionUuid,
    transactionCode: (payload as any).transaction_code,
  });
};

export const getEsewaFormPayload = async (transactionUuid: string) => {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { transactionUuid, provider: "esewa" },
  });

  if (!transaction?.requestPayload) {
    throw new Error("eSewa transaction not found");
  }

  return transaction.requestPayload as Record<string, string>;
};

export const getEsewaPaymentUrl = () =>
  process.env.ESEWA_PAYMENT_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
