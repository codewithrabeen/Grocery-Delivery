import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { markPaymentFailed } from "../services/orderFulfillment.js";
import {
  decodeEsewaData,
  getEsewaFormPayload,
  getEsewaPaymentUrl,
  isPaymentProviderConfigured,
  verifyEsewaPayment,
  verifyKhaltiPayment,
  verifyStripePayment,
} from "../services/paymentService.js";
import { ApiError, asyncHandler, routeParam } from "../utils/api.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const redirectToClient = (res: Response, path: string, params: Record<string, string | undefined>) => {
  const url = new URL(path, CLIENT_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return res.redirect(url.toString());
};

export const getPaymentMethods = asyncHandler(async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    methods: [
      {
        id: "cash",
        enabled: true,
      },
      {
        id: "stripe",
        enabled: isPaymentProviderConfigured("stripe"),
        reason: isPaymentProviderConfigured("stripe") ? undefined : "Card payment is not configured.",
      },
      {
        id: "esewa",
        enabled: isPaymentProviderConfigured("esewa"),
        reason: isPaymentProviderConfigured("esewa") ? undefined : "eSewa is not configured.",
      },
      {
        id: "khalti",
        enabled: isPaymentProviderConfigured("khalti"),
        reason: isPaymentProviderConfigured("khalti") ? undefined : "Khalti is not configured on this server.",
      },
    ],
  });
});

export const verifyStripe = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, sessionId } = req.body;

  if (!orderId || !sessionId) {
    return res.status(400).json({ message: "orderId and sessionId are required" });
  }

  const order = await verifyStripePayment(orderId, sessionId, req.user?.id);
  return res.json({ success: true, order });
});

export const verifyKhalti = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, pidx } = req.body;

  if (!orderId || !pidx) {
    return res.status(400).json({ message: "orderId and pidx are required" });
  }

  const order = await verifyKhaltiPayment(orderId, pidx, req.user?.id);
  return res.json({ success: true, order });
});

export const khaltiCallback = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.query.purchase_order_id || req.query.orderId || "");
  const pidx = String(req.query.pidx || "");

  try {
    if (!orderId || !pidx) {
      throw new ApiError(400, "Khalti returned without an order id or pidx");
    }

    const order = await verifyKhaltiPayment(orderId, pidx);
    return redirectToClient(res, "/payment/success", {
      provider: "khalti",
      orderId: order?.id,
      pidx,
      verified: "1",
    });
  } catch (error) {
    if (!(error instanceof ApiError && error.statusCode === 409) && (!pidx || !orderId)) {
      await markPaymentFailed(orderId, error instanceof Error ? error.message : "Khalti payment failed", {
        provider: "khalti",
        pidx,
        query: req.query,
      });
    }

    return redirectToClient(res, "/payment/failure", {
      provider: "khalti",
      orderId,
      reason: error instanceof Error ? error.message : "Payment failed",
    });
  }
});

export const esewaRedirect = asyncHandler(async (req: Request, res: Response) => {
  const payload = await getEsewaFormPayload(routeParam(req.params.transactionUuid));
  const paymentUrl = getEsewaPaymentUrl();
  const inputs = Object.entries(payload)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}" />`,
    )
    .join("");

  return res
    .status(200)
    .type("html")
    .send(`<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Redirecting to eSewa</title></head>
  <body>
    <form id="esewa-payment-form" method="POST" action="${paymentUrl}">
      ${inputs}
      <noscript><button type="submit">Continue to eSewa</button></noscript>
    </form>
    <script>document.getElementById("esewa-payment-form").submit();</script>
  </body>
</html>`);
});

export const esewaSuccess = asyncHandler(async (req: Request, res: Response) => {
  const data = String(req.body.data || req.query.data || "");

  try {
    if (!data) throw new Error("Missing eSewa response data");
    const decoded = decodeEsewaData(data);
    const transactionUuid = String(decoded.transaction_uuid || "");
    const order = await verifyEsewaPayment(transactionUuid, data);

    return redirectToClient(res, "/payment/success", {
      provider: "esewa",
      orderId: order?.id,
      transaction_uuid: transactionUuid,
      verified: "1",
    });
  } catch (error) {
    return redirectToClient(res, "/payment/failure", {
      provider: "esewa",
      reason: error instanceof Error ? error.message : "Payment failed",
    });
  }
});

export const esewaFailure = asyncHandler(async (req: Request, res: Response) => {
  const orderId = String(req.query.orderId || req.body.orderId || "");
  const transactionUuid = String(req.query.transaction_uuid || req.body.transaction_uuid || "");

  await markPaymentFailed(orderId, "eSewa payment failed or cancelled", {
    provider: "esewa",
    transactionUuid,
    query: req.query,
  });

  return redirectToClient(res, "/payment/failure", {
    provider: "esewa",
    orderId,
    transaction_uuid: transactionUuid,
  });
});

export const verifyEsewa = asyncHandler(async (req: Request, res: Response) => {
  const { transactionUuid, data } = req.body;

  if (!transactionUuid) {
    return res.status(400).json({ message: "transactionUuid is required" });
  }

  const order = await verifyEsewaPayment(transactionUuid, data, req.user?.id);
  return res.json({ success: true, order });
});

export const getPaymentTransactions = asyncHandler(async (req: Request, res: Response) => {
  const where = req.user?.isAdmin ? {} : { userId: req.user!.id };
  const transactions = await prisma.paymentTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({ success: true, transactions });
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
