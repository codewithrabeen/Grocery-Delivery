import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

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

    const deliveryFee = subtotal > 100 ? 0 : 1.99;
    const tax = Math.round(subtotal * 0.07 * 100) / 100;
    const total =
      Math.round((subtotal + deliveryFee + tax) * 100) / 100;

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

    // Reduce stock
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

    // Send stock update event for each product in the order 

    for(const item of orderItems) {
      await inngest.send ({name: "inventory/stock.updated", data: {
        productId: item.product
      }})
    }

    await inngest.send({ name: "order/placed", data: {
      orderId: order.id
    }})





    return res.status(201).json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create order",
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