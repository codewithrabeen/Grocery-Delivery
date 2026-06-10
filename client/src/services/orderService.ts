import api from "../config/api";
import type { LiveLocation, Order, OrderItem, ShippingAddress } from "../types";

type OrderResponse = {
  order?: Order;
  orders?: Order[];
  url?: string;
};

export type CreateOrderPayload = {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
};

export type CreateOrderResult =
  | { type: "redirect"; url: string }
  | { type: "order"; order: Order };

const normalizeItems = (items: OrderItem[] = []) =>
  items.map((item) => ({
    ...item,
    product: item.product ?? item.productId ?? item.id ?? "",
    unit: item.unit ?? "piece",
  }));

export const normalizeOrder = (order: Order): Order => ({
  ...order,
  items: normalizeItems(order.items),
  deliveryFee: Number(order.deliveryFee ?? 0),
  tax: Number(order.tax ?? 0),
  deliveryPartner: order.deliveryPartner ?? null,
  deliveryOtp: order.deliveryOtp ?? "",
  isPaid: Boolean(order.isPaid),
  statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
});

const readOrders = (data: OrderResponse | Order[]) => {
  if (Array.isArray(data)) return data.map(normalizeOrder);
  return (data.orders ?? []).map(normalizeOrder);
};

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
    const { data } = await api.post<OrderResponse | Order>("/orders", payload);

    if ("url" in data && data.url) {
      return { type: "redirect", url: data.url };
    }

    const order = "order" in data && data.order ? data.order : (data as Order);
    return { type: "order", order: normalizeOrder(order) };
  },

  async getOrders(status = "all") {
    const { data } = await api.get<OrderResponse | Order[]>("/orders", {
      params: status !== "all" ? { status } : undefined,
    });
    return readOrders(data);
  },

  async getOrder(id: string) {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return normalizeOrder(data);
  },

  async getOrderLocation(id: string) {
    const { data } = await api.get<{ liveLocation?: LiveLocation | null; status?: string }>(
      `/orders/${id}/location`,
    );
    return data;
  },
};
