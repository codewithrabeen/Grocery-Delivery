import api from "../config/api";
import type { DeliveryPartner, Order, Product } from "../types";
import { normalizeOrder } from "./orderService";
import { normalizeProduct, type ProductQuery } from "./productService";

export type AdminStats = {
  totalOrders: number;
  totalUser: number;
  totalProducts: number;
  outOfStock: number;
  totalPartners: number;
  revenue: number;
  weeklySales: number;
  monthlySalesTotal: number;
  monthlySales: { label: string; total: number }[];
  topSelling: Product[];
  lowStock: Product[];
  recentOrders: Order[];
};

type AdminStatsResponse = Omit<AdminStats, "recentOrders" | "topSelling" | "lowStock"> & {
  recentOrders?: Order[];
  topSelling?: Product[];
  lowStock?: Product[];
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

type ProductsResponse = {
  product?: Product;
  products?: Product[];
};

export type ProductPayload = {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  stock: number;
  isOrganic: boolean;
  isFeatured?: boolean;
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
      revenue: Number(data.revenue ?? 0),
      weeklySales: Number(data.weeklySales ?? 0),
      monthlySalesTotal: Number(data.monthlySalesTotal ?? 0),
      monthlySales: data.monthlySales ?? [],
      topSelling: (data.topSelling ?? []).map(normalizeProduct),
      lowStock: (data.lowStock ?? []).map(normalizeProduct),
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

  async getProducts(query: ProductQuery = {}) {
    const { data } = await api.get<ProductsResponse>("/products", {
      params: { ...query, limit: 24 },
    });
    return (data.products ?? []).map(normalizeProduct);
  },

  async createProduct(payload: ProductPayload) {
    const { data } = await api.post<ProductsResponse>("/products", payload);
    return data.product ? normalizeProduct(data.product) : null;
  },

  async updateProduct(id: string, payload: Partial<ProductPayload>) {
    const { data } = await api.put<ProductsResponse>(`/products/${id}`, payload);
    return data.product ? normalizeProduct(data.product) : null;
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },
};
