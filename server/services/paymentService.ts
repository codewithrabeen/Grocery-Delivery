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
import { ApiError } from "../utils/api.js";

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

const isProduction = process.env.NODE_ENV === "production";

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) => roundMoney(value).toFixed(2);
const toPaisa = (value: number) => Math.round(roundMoney(value) * 100);

const ensureConfigured = (provider: "Khalti" | "eSewa" | "Stripe", missing: string[]) => {
  if (missing.length > 0) {
    throw new ApiError(503, `${provider} is not configured. Set ${missing.join(", ")} in server/.env.`);
  }
};

const readGatewayJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const gatewayErrorMessage = (data: any, fallback: string) => {
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data.error_message === "string") return data.error_message;

  const firstEntry = Object.entries(data).find(([, value]) => Array.isArray(value) && value.length > 0);
  if (firstEntry) return `${firstEntry[0]}: ${(firstEntry[1] as unknown[]).join(", ")}`;

  return fallback;
};

const getKhaltiApiBaseUrl = () => {
  const configured = process.env.KHALTI_API_BASE_URL || process.env.KHALTI_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const useProduction = process.env.KHALTI_ENV === "production" || isProduction;
  return useProduction ? "https://khalti.com/api/v2" : "https://dev.khalti.com/api/v2";
};

const getKhaltiAuthorization = () => {
  const secretKey = process.env.KHALTI_SECRET_KEY?.trim();
  ensureConfigured("Khalti", secretKey ? [] : ["KHALTI_SECRET_KEY"]);

  return /^key\s+/i.test(secretKey!) ? secretKey! : `Key ${secretKey}`;
};

const getKhaltiInitiateUrl = () =>
  process.env.KHALTI_INITIATE_URL || `${getKhaltiApiBaseUrl()}/epayment/initiate/`;

const getKhaltiLookupUrl = () =>
  process.env.KHALTI_LOOKUP_URL || `${getKhaltiApiBaseUrl()}/epayment/lookup/`;

const getEsewaProductCode = () => {
  const productCode = process.env.ESEWA_PRODUCT_CODE?.trim();
  ensureConfigured("eSewa", productCode ? [] : ["ESEWA_PRODUCT_CODE"]);
  return productCode!;
};

const getEsewaSecret = () => {
  const secret = process.env.ESEWA_SECRET_KEY?.trim();
  ensureConfigured("eSewa", secret ? [] : ["ESEWA_SECRET_KEY"]);
  return secret!;
};

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

export const isPaymentProviderConfigured = (provider: "stripe" | "khalti" | "esewa") => {
  if (provider === "stripe") return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  if (provider === "khalti") return Boolean(process.env.KHALTI_SECRET_KEY?.trim());
  return Boolean(process.env.ESEWA_PRODUCT_CODE?.trim() && process.env.ESEWA_SECRET_KEY?.trim());
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
  ensureConfigured("Stripe", process.env.STRIPE_SECRET_KEY ? [] : ["STRIPE_SECRET_KEY"]);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

const createKhaltiSession = async ({ order, user, clientOrigin, serverOrigin }: InitiatePaymentInput) => {
  const endpoint = getKhaltiInitiateUrl();
  const amount = toPaisa(order.total);

  if (amount < 1000) {
    throw new ApiError(400, "Khalti requires a minimum payment amount of NPR 10.");
  }

  const discountedSubtotal = Math.max(0, roundMoney(order.subtotal - (order.discount ?? 0)));
  const tax = roundMoney(order.tax ?? 0);
  const deliveryFee = roundMoney(order.deliveryFee ?? 0);
  const payload = {
    return_url: `${serverOrigin}/api/payments/khalti/callback`,
    website_url: clientOrigin,
    amount,
    purchase_order_id: order.id,
    purchase_order_name: `Grocery order ${order.orderNumber}`,
    customer_info: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
    },
    amount_breakdown: [
      { label: "Items", amount: toPaisa(discountedSubtotal) },
      { label: "Tax", amount: toPaisa(tax) },
      { label: "Delivery", amount: toPaisa(deliveryFee) },
    ].filter((item) => item.amount > 0),
    product_details: [
      {
        identity: order.id,
        name: `Grocery order ${order.orderNumber}`,
        total_price: amount,
        quantity: 1,
        unit_price: amount,
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: getKhaltiAuthorization(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await readGatewayJson(response)) as any;
  if (!response.ok || !data.payment_url || !data.pidx) {
    throw new ApiError(response.ok ? 502 : response.status, gatewayErrorMessage(data, "Could not initiate Khalti payment"));
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
  const productCode = getEsewaProductCode();
  const secret = getEsewaSecret();

  const transactionUuid = `${order.id}-${Date.now()}`;
  const taxAmountValue = roundMoney(order.tax ?? 0);
  const productServiceChargeValue = 0;
  const productDeliveryChargeValue = roundMoney(order.deliveryFee ?? 0);
  const amountValue = Math.max(
    0,
    roundMoney(order.total - taxAmountValue - productServiceChargeValue - productDeliveryChargeValue),
  );
  const totalAmountValue = roundMoney(
    amountValue + taxAmountValue + productServiceChargeValue + productDeliveryChargeValue,
  );
  const amount = formatMoney(amountValue);
  const taxAmount = formatMoney(taxAmountValue);
  const productServiceCharge = formatMoney(productServiceChargeValue);
  const productDeliveryCharge = formatMoney(productDeliveryChargeValue);
  const totalAmount = formatMoney(totalAmountValue);
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
  ensureConfigured("Stripe", process.env.STRIPE_SECRET_KEY ? [] : ["STRIPE_SECRET_KEY"]);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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
  const endpoint = getKhaltiLookupUrl();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: getKhaltiAuthorization(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });

  const data = (await readGatewayJson(response)) as any;
  if (!response.ok && !data.status) {
    throw new ApiError(response.status, gatewayErrorMessage(data, "Could not verify Khalti payment"));
  }

  return data;
};

export const verifyKhaltiPayment = async (orderId: string, pidx: string, userId?: string) => {
  const lookup = await lookupKhaltiPayment(pidx);
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      orderId,
      pidx,
      ...(userId ? { userId } : {}),
    },
  });

  if (!transaction) {
    throw new ApiError(404, "Khalti transaction not found");
  }

  if (String(lookup.pidx || pidx) !== pidx) {
    await markPaymentFailed(orderId, "Khalti payment identifier mismatch", {
      provider: "khalti",
      pidx,
      response: lookup,
    });
    throw new ApiError(400, "Khalti payment identifier mismatch");
  }

  const expectedAmount = toPaisa(transaction.amount);
  const receivedAmount = Number(lookup.total_amount ?? lookup.amount ?? 0);
  if (receivedAmount > 0 && receivedAmount !== expectedAmount) {
    await markPaymentFailed(orderId, "Khalti payment amount mismatch", {
      provider: "khalti",
      pidx,
      expectedAmount,
      receivedAmount,
      response: lookup,
    });
    throw new ApiError(400, "Khalti payment amount mismatch");
  }

  const status = String(lookup.status || "").toLowerCase();
  const isCompleted = status === "completed";
  const isPending = status === "pending" || status === "initiated";

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: isCompleted ? "COMPLETED" : isPending ? "PENDING" : lookup.status || "FAILED",
      transactionId: lookup.transaction_id,
      verificationResponse: lookup,
      verifiedAt: isCompleted ? new Date() : undefined,
      failureReason: isCompleted ? null : lookup.status,
    },
  });

  if (isPending) {
    throw new ApiError(409, "Khalti payment is still pending. Please wait and verify again.");
  }

  if (!isCompleted) {
    await markPaymentFailed(orderId, `Khalti payment ${lookup.status || "failed"}`, {
      provider: "khalti",
      pidx,
      response: lookup,
    });
    throw new ApiError(402, `Khalti payment ${lookup.status || "failed"}`);
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
  const normalizedData = data.replace(/ /g, "+");
  const json = Buffer.from(normalizedData, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, any>;
};

export const verifyEsewaSignature = (payload: Record<string, any>) => {
  const secret = getEsewaSecret();

  const signedFields = String(payload.signed_field_names || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  const message = signedFields.map((field) => `${field}=${payload[field]}`).join(",");
  const expected = createEsewaSignature(message, secret);
  const received = String(payload.signature || "");

  if (!received || expected.length !== received.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

const getEsewaStatusCheckUrl = () => {
  const configured = process.env.ESEWA_STATUS_CHECK_URL || process.env.ESEWA_STATUS_URL;
  if (configured) return configured;

  const useProduction = process.env.ESEWA_ENV === "production" || isProduction;
  return useProduction
    ? "https://esewa.com.np/api/epay/transaction/status/"
    : "https://rc.esewa.com.np/api/epay/transaction/status/";
};

export const lookupEsewaPayment = async (transactionUuid: string, totalAmount: string) => {
  const url = new URL(getEsewaStatusCheckUrl());
  url.searchParams.set("product_code", getEsewaProductCode());
  url.searchParams.set("total_amount", totalAmount);
  url.searchParams.set("transaction_uuid", transactionUuid);

  const response = await fetch(url);
  const data = (await readGatewayJson(response)) as any;

  if (!response.ok) {
    throw new ApiError(response.status, gatewayErrorMessage(data, "Could not verify eSewa payment"));
  }

  return data;
};

export const verifyEsewaPayment = async (transactionUuid: string, data?: string, userId?: string) => {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      transactionUuid,
      provider: "esewa",
      ...(userId ? { userId } : {}),
    },
  });

  if (!transaction) throw new ApiError(404, "eSewa transaction not found");

  if (transaction.status === "COMPLETED" && !data) {
    return prisma.order.findUnique({ where: { id: transaction.orderId } });
  }

  const payload = data ? decodeEsewaData(data) : transaction.verificationResponse;
  const responsePayload = (payload || {}) as Record<string, any>;
  const status = String(responsePayload.status || "").toUpperCase();
  const signatureValid = data ? verifyEsewaSignature(responsePayload) : true;
  const requestPayload = (transaction.requestPayload || {}) as Record<string, any>;
  const expectedProductCode = getEsewaProductCode();
  const expectedTotalAmount = String(requestPayload.total_amount || formatMoney(transaction.amount));
  const receivedProductCode = String(responsePayload.product_code || expectedProductCode);
  const receivedTotalAmount = String(responsePayload.total_amount || expectedTotalAmount);

  if (receivedProductCode !== expectedProductCode || Number(receivedTotalAmount) !== Number(expectedTotalAmount)) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "FAILED",
        verificationResponse: responsePayload as any,
        failureReason: "eSewa payment details mismatch",
      },
    });

    await markPaymentFailed(transaction.orderId, "eSewa payment details mismatch", {
      provider: "esewa",
      transactionUuid,
      response: responsePayload,
    });

    throw new ApiError(400, "eSewa payment details mismatch");
  }

  if (!signatureValid || status !== "COMPLETE") {
    const pending = signatureValid && ["PENDING", "AMBIGUOUS"].includes(status);
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: pending ? "PENDING" : "FAILED",
        verificationResponse: responsePayload as any,
        failureReason: signatureValid ? status || "Failed" : "Invalid signature",
      },
    });

    if (pending) {
      throw new ApiError(409, "eSewa payment is still pending. Please wait and verify again.");
    }

    await markPaymentFailed(transaction.orderId, signatureValid ? "eSewa payment failed" : "Invalid eSewa signature", {
      provider: "esewa",
      transactionUuid,
      response: responsePayload,
    });

    throw new ApiError(402, signatureValid ? "eSewa payment failed" : "Invalid eSewa signature");
  }

  const statusCheck = await lookupEsewaPayment(transactionUuid, expectedTotalAmount);
  const statusCheckStatus = String(statusCheck.status || "").toUpperCase();

  if (statusCheckStatus !== "COMPLETE") {
    const pending = ["PENDING", "AMBIGUOUS"].includes(statusCheckStatus);
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: pending ? "PENDING" : "FAILED",
        verificationResponse: { callback: responsePayload, statusCheck } as any,
        failureReason: statusCheckStatus || "eSewa status check failed",
      },
    });

    if (pending) {
      throw new ApiError(409, "eSewa payment is still pending. Please wait and verify again.");
    }

    await markPaymentFailed(transaction.orderId, "eSewa status check failed", {
      provider: "esewa",
      transactionUuid,
      response: statusCheck,
    });

    throw new ApiError(402, "eSewa status check failed");
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: "COMPLETED",
      transactionCode: String(responsePayload.transaction_code || statusCheck.ref_id || ""),
      verificationResponse: { callback: responsePayload, statusCheck, status: "COMPLETE" } as any,
      verifiedAt: new Date(),
    },
  });

  return fulfillPaidOrder(transaction.orderId, {
    provider: "esewa",
    transactionUuid,
    transactionCode: responsePayload.transaction_code || statusCheck.ref_id,
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
  process.env.ESEWA_PAYMENT_URL ||
  (process.env.ESEWA_ENV === "production" || isProduction
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
