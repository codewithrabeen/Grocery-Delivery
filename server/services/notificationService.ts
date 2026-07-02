import sendEmail from "../config/nodemailer.js";
import { prisma } from "../config/prisma.js";

type NotificationKind =
  | "order_placed"
  | "payment_success"
  | "payment_failed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

const subjects: Record<NotificationKind, string> = {
  order_placed: "Your grocery order has been placed",
  payment_success: "Payment confirmed for your grocery order",
  payment_failed: "Payment needs attention",
  order_shipped: "Your order is out for delivery",
  order_delivered: "Your grocery order was delivered",
  order_cancelled: "Your grocery order was cancelled",
};

export const sendOrderNotification = async (
  orderId: string,
  kind: NotificationKind,
  note?: string,
) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    if (!order?.user.email) return;
    if (!process.env.SENDER_EMAIL || !(process.env.SMTP_USER || process.env.SMPT_USER)) {
      console.log(`Notification skipped (${kind}): SMTP is not configured`);
      return;
    }

    await sendEmail({
      to: order.user.email,
      subject: subjects[kind],
      body: buildOrderEmail(order, kind, note),
    });
  } catch (error) {
    console.error(`Failed to send ${kind} notification for order ${orderId}:`, error);
  }
};

const buildOrderEmail = (order: any, kind: NotificationKind, note?: string) => {
  const title = subjects[kind];
  const status = order.status;
  const total = Math.round(order.total).toLocaleString("en-NP");
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 0), 0)
    : 0;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background:#15803d;color:white;padding:22px 26px;">
        <h1 style="font-size:20px;margin:0;">${title}</h1>
      </div>
      <div style="padding:24px 26px;color:#27272a;">
        <p style="margin:0 0 16px;">Hi ${order.user.name},</p>
        <p style="margin:0 0 18px;">Order <strong>${order.orderNumber || order.id}</strong> is currently <strong>${status}</strong>.</p>
        ${note ? `<p style="margin:0 0 18px;color:#52525b;">${note}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-top:18px;">
          <tr><td style="padding:8px 0;color:#71717a;">Items</td><td style="text-align:right;font-weight:600;">${itemCount}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Payment</td><td style="text-align:right;font-weight:600;">${order.paymentStatus}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Total</td><td style="text-align:right;font-weight:700;">Rs. ${total}</td></tr>
        </table>
      </div>
    </div>
  `;
};
