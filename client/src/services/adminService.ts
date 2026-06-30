import api from "../config/api";
import type { DeliveryPartner, Order } from "../types";
import { normalizeOrder } from "./orderService";

export type AdminStats = {
  totalOrders: number;
  totalUser: number;
  totalProducts: number;
  outOfStock: number;
  totalPartners: number;
  recentOrders: Order[];
};

type AdminStatsResponse = Omit<AdminStats, "recentOrders"> & {
  recentOrders?: Order[];
};

type PartnersResponse = {
  partner?: DeliveryPartner;
  partners?: DeliveryPartner[];
};

type PartnerPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: string;
};

type AssignResponse = {
  order?: Order;
};

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const { data } = await api.get<AdminStatsResponse>("/admin/stats");

    return {
      totalOrders: Number(data.totalOrders ?? 0),
      totalUser: Number(data.totalUser ?? 0),
      totalProducts: Number(data.totalProducts ?? 0),
      outOfStock: Number(data.outOfStock ?? 0),
      totalPartners: Number(data.totalPartners ?? 0),
      recentOrders: (data.recentOrders ?? []).map(normalizeOrder),
    };
  },

  async getDeliveryPartners() {
    const { data } = await api.get<PartnersResponse>("/admin/delivery-partners");
    return data.partners ?? [];
  },

  async createDeliveryPartner(payload: PartnerPayload) {
    const { data } = await api.post<PartnersResponse>("/admin/delivery-partners", payload);
    return data.partner;
  },

  async assignDeliveryPartner(orderId: string, partnerId: string) {
    const { data } = await api.put<AssignResponse>(`/admin/orders/${orderId}/assign`, {
      partnerId,
    });

    return data.order ? normalizeOrder(data.order) : null;
  },
};
