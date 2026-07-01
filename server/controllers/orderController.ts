import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { fulfillPaidOrder, reduceStock, sendOrderEvents } from "../services/orderFulfillment.js";

const CARD_PAYMENT_METHOD = "card";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const getRequestOrigin = (req: Request) =>
  typeof req.headers.origin === "string" ? req.headers.origin : CLIENT_URL;

// Create Order
// Post/api/order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    const productIds = items.map((item: any) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    const productMap: Record<string, any> = {};

    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Validate products and stock
    for (const item of items) {
      const product = productMap[item.productId];

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if ((product.stock ?? 0) < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }
    }

    const orderItems = items.map((item: any) => {
      const dbProduct = productMap[item.productId];

      return {
        productId: dbProduct.id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: item.quantity,
        unit: dbProduct.unit,
      };
    });

    const subtotal = orderItems.reduce(
      (sum: number, item: any) =>
        sum + item.price * item.quantity,
      0
    );

    const deliveryFee = subtotal === 0 || subtotal >= 1500 ? 0 : 99;
    const tax = Math.round(subtotal * 0.13);
    const total =
      Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    if (paymentMethod === CARD_PAYMENT_METHOD && !process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        message: "Stripe is not configured",
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        items: orderItems as any,
        shippingAddress: shippingAddress as any,
        paymentMethod,
        subtotal,
        deliveryFee,
        tax,
        total,
        status: "Placed",
        statusHistory: [
          {
            status: "Placed",
            note: "Order placed successfully",
            timestamp: new Date(),
          },
        ] as any,
      },
    });

    if (paymentMethod === CARD_PAYMENT_METHOD) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      const origin = getRequestOrigin(req);
      const session = await stripe.checkout.sessions.create({
        success_url: `${origin}/payment/success?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
        line_items: [
          {
            price_data: {
              currency: "npr",
              product_data: {
                name: "QuickBasket groceries",
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: { orderId: order.id },
      });

      if (!session.url) {
        return res.status(500).json({
          message: "Could not create Stripe checkout session",
        });
      }

      return res.status(201).json({ url: session.url, orderId: order.id });
    }

    await reduceStock(orderItems);
    await sendOrderEvents(order.id, orderItems);

    return res.status(201).json({ order });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
};

export const confirmStripePayment = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ message: "Stripe session id is required" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== CARD_PAYMENT_METHOD) {
      return res.status(400).json({ message: "This order does not use card payment" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.orderId !== orderId) {
      return res.status(400).json({ message: "Stripe session does not match this order" });
    }

    if (session.payment_status !== "paid") {
      return res.status(402).json({ message: "Payment has not been completed" });
    }

    await fulfillPaidOrder(orderId);

    const paidOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
      },
      include: {
        deliveryPartner: {
          select: {
            id: true,
            phone: true,
            avatar: true,
            vehicleType: true,
          },
        },
      },
    });

    return res.json({ order: paidOrder });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to confirm Stripe payment",
    });
  }
};

// Get User Orders
export const getUserOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const { status } = req.query;

    const where: any = {
      userId: req.user!.id,
      NOT: [
        {
          paymentMethod: "card",
          isPaid: false,
        },
      ],
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        deliveryPartner: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// Get Single Order
export const getOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
      },
      include: {
        deliveryPartner: {
          select: {
            id: true,
            phone: true,
            avatar: true,
            vehicleType: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

// Update Order Status
export const updateOrderStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, note } = req.body;
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const history = Array.isArray(order.statusHistory)
      ? [...(order.statusHistory as any[])]
      : [];

    history.push({
      status,
      note: note || `Order ${status.toLowerCase()}`,
      timestamp: new Date(),
    });

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        statusHistory: history as any,
      },
    });

    return res.json({
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update order",
    });
  }
};

// Get All Orders (Admin)
export const getAllOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        NOT: [
          {
            paymentMethod: "card",
            isPaid: false,
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deliveryPartner: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// Get Order Location
export const getOrderLocation = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
      },
      select: {
        liveLocation: true,
        status: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      liveLocation: order.liveLocation,
      status: order.status,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch order location",
    });
  }
};
