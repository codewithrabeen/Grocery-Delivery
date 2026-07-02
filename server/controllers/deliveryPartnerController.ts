import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { asyncHandler, routeParam } from "../utils/api.js";
import { appendStatusHistory, cancelOrder, ORDER_STATUS } from "../services/orderFulfillment.js";
import { sendOrderNotification } from "../services/notificationService.js";

const generateToken = (id: string) =>
  Jwt.sign({ id, role: "delivery" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

export const loginPartner = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  const partner = await prisma.deliveryPartner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!partner || !(await bcrypt.compare(password, partner.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!partner.isActive) {
    return res.status(403).json({ message: "Your account has been deactivated" });
  }

  const { password: _password, ...partnerData } = partner;

  return res.json({ success: true, partner: partnerData, token: generateToken(partner.id) });
});

export const getMydeliveries = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = { deliveryPartnerId: req.partner!.id };

  if (status === "active") {
    where.status = { in: ["Assigned", "Packed", "Out For Delivery", "Out for Delivery"] };
  } else if (status === "completed") {
    where.status = { in: ["Delivered", "Cancelled", "Returned"] };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, orders });
});

export const getDeliveryDetail = asyncHandler(async (req: Request, res: Response) => {
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryPartnerId: req.partner!.id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  if (!order) {
    return res.status(404).json({ message: "Delivery not found" });
  }

  return res.json({ success: true, order });
});

export const completeDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryPartnerId: req.partner!.id },
  });

  if (!order || ["Cancelled", "Delivered", "Returned"].includes(order.status)) {
    return res.status(400).json({ message: "Invalid delivery request" });
  }

  if (order.deliveryOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUS.DELIVERED,
      statusHistory: appendStatusHistory(order.statusHistory, ORDER_STATUS.DELIVERED, "Delivered by partner") as any,
      deliveryOtp: "",
      deliveredAt: new Date(),
      ...(order.paymentMethod === "cash" ? { isPaid: true, paymentStatus: "PAID" } : {}),
    },
  });

  void sendOrderNotification(order.id, "order_delivered");
  return res.json({ success: true, order: updatedOrder, message: "Delivery completed successfully" });
});

export const cancelDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryPartnerId: req.partner!.id },
  });

  if (!order) {
    return res.status(404).json({ message: "Delivery not found" });
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    return res.status(400).json({ message: "Cannot cancel the delivered order" });
  }

  const updatedOrder = await cancelOrder(order.id, reason || "Cancelled by delivery partner");
  return res.json({ success: true, order: updatedOrder, message: "Delivery cancelled" });
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const orderId = routeParam(req.params.id);
  const normalizedStatus = status === "Out for Delivery" ? ORDER_STATUS.OUT_FOR_DELIVERY : status;
  const allowedStatuses = [ORDER_STATUS.PACKED, ORDER_STATUS.OUT_FOR_DELIVERY];

  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status update" });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, deliveryPartnerId: req.partner!.id },
  });

  if (!order) {
    return res.status(404).json({ message: "Delivery not found" });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: normalizedStatus,
      statusHistory: appendStatusHistory(
        order.statusHistory,
        normalizedStatus,
        `Status updated to ${normalizedStatus}`,
      ) as any,
      ...(normalizedStatus === ORDER_STATUS.PACKED ? { packedAt: new Date() } : {}),
      ...(normalizedStatus === ORDER_STATUS.OUT_FOR_DELIVERY ? { outForDeliveryAt: new Date() } : {}),
    },
  });

  if (normalizedStatus === ORDER_STATUS.OUT_FOR_DELIVERY) {
    void sendOrderNotification(order.id, "order_shipped");
  }

  return res.json({ success: true, order: updatedOrder });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const orderId = routeParam(req.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deliveryPartnerId: req.partner!.id,
      status: { in: ["Assigned", "Packed", "Out For Delivery", "Out for Delivery"] },
    },
  });

  if (!order) {
    return res.status(404).json({ message: "Active delivery not found" });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { liveLocation: { lat: Number(lat), lng: Number(lng), updatedAt: new Date().toISOString() } },
  });

  return res.json({ success: true });
});
