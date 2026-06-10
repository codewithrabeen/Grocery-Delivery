import api from "../config/api";
import { categoriesData } from "../assets/assets";
import type { Product, ProductSort } from "../types";

export type ProductQuery = {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "all" | "in-stock" | "out-of-stock";
  minRating?: number;
  sort?: ProductSort;
};

type ProductsResponse = {
  products?: Product[];
};

const FALLBACK_DATE = new Date(0).toISOString();

export const normalizeProduct = (product: Product): Product => {
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const price = Number(product.price || 0);
  const discount =
    product.discount ??
    (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  return {
    ...product,
    description: product.description ?? "",
    price,
    originalPrice: originalPrice || price,
    unit: product.unit ?? "piece",
    stock: Number(product.stock ?? 0),
    isOrganic: Boolean(product.isOrganic),
    rating: Number(product.rating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    discount,
    createdAt: product.createdAt ?? FALLBACK_DATE,
  };
};

const sortProducts = (products: Product[], sort: ProductSort = "popular") => {
  const sorted = [...products];

  if (sort === "price-low") return sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-high") return sorted.sort((a, b) => b.price - a.price);
  if (sort === "rating") return sorted.sort((a, b) => b.rating - a.rating);
  if (sort === "newest") {
    return sorted.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  if (sort === "best-selling") {
    return sorted.sort((a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating);
  }

  return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
};

const applyClientFilters = (products: Product[], query: ProductQuery) => {
  let next = products;

  if (query.availability === "in-stock") {
    next = next.filter((product) => product.stock > 0);
  }

  if (query.availability === "out-of-stock") {
    next = next.filter((product) => product.stock <= 0);
  }

  if (query.minRating && query.minRating > 0) {
    next = next.filter((product) => product.rating >= Number(query.minRating));
  }

  return sortProducts(next, query.sort);
};

const toParams = (query: ProductQuery) => {
  const params: Record<string, string | number> = {};

  if (query.category && query.category !== "all") params.category = query.category;
  if (query.search) params.search = query.search;
  if ((query.minPrice ?? 0) > 0) params.minPrice = query.minPrice ?? 0;
  if ((query.maxPrice ?? 0) > 0) params.maxPrice = query.maxPrice ?? 0;
  if (query.sort === "price-low" || query.sort === "price-high" || query.sort === "newest") {
    params.sort = query.sort;
  }

  return params;
};

export const productService = {
  categories: categoriesData,

  async getProducts(query: ProductQuery = {}) {
    const { data } = await api.get<ProductsResponse>("/products", {
      params: toParams(query),
    });
    const products = (data.products ?? []).map(normalizeProduct);
    return applyClientFilters(products, query);
  },

  async getFlashDeals() {
    const { data } = await api.get<ProductsResponse>("/products/flash-deals");
    return (data.products ?? []).map(normalizeProduct);
  },

  async getProductById(id: string) {
    const products = await this.getProducts();
    return products.find((product) => product.id === id) ?? null;
  },
};
