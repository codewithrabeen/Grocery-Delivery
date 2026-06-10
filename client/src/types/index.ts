export type ProductSort =
  | "popular"
  | "best-selling"
  | "newest"
  | "price-low"
  | "price-high"
  | "rating";

export type AvailabilityFilter = "all" | "in-stock" | "out-of-stock";

export interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
  lat: number;
  lng: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  slug: string;
  name: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  unit: string;
  stock: number;
  isOrganic: boolean;
  rating: number;
  reviewCount: number;
  discount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category: string;
  search: string;
  minPrice: number;
  maxPrice: number;
  availability: AvailabilityFilter;
  minRating: number;
  sort: ProductSort;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product?: string;
  productId?: string;
  id?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface DeliveryPartner {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  vehicleType?: "bike" | "scooter" | "car" | string;
  isActive?: boolean;
  createdAt?: string;
}

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Assigned"
  | "Packed"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | string;

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type ShippingAddress = Omit<Address, "id" | "isDefault" | "createdAt" | "updatedAt">;

export interface LiveLocation {
  lat: number;
  lng: number;
  updatedAt?: string;
}

export interface Order {
  id: string;
  user?: string | { id?: string; name?: string; email?: string; phone?: string };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  statusHistory: StatusHistoryItem[];
  deliveryPartner: DeliveryPartner | null;
  deliveryOtp?: string;
  liveLocation?: LiveLocation | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiMessage {
  message?: string;
}
