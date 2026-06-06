import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import {
  deliveryWindows,
  nepalAddressData,
  nepalDeliveryPartner,
  nepalOrdersData,
  nepalProducts,
} from "../data/nepalStore";
import type { Address, CartItem, Order, Product, User } from "../types";

type CartQuantities = Record<string, number>;

type AppContextValue = {
  user: User | null;
  products: Product[];
  addresses: Address[];
  orders: Order[];
  cartQuantities: CartQuantities;
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  isCartOpen: boolean;
  deliveryWindows: string[];
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  login: (name: string, email: string) => void;
  register: (name: string, email: string) => void;
  logout: () => void;
  addAddress: (address: Omit<Address, "_id" | "isDefault" | "lat" | "lng">) => void;
  setDefaultAddress: (addressId: string) => void;
  placeOrder: (addressId: string, paymentMethod: string, deliveryWindow: string) => Order;
};

const defaultUser: User = {
  _id: "user-aarav",
  name: "Aarav Shrestha",
  email: "aarav@example.com",
  phone: "9800000000",
  avatar: "",
  addresses: nepalAddressData,
  isAdmin: false,
  createdAt: "2026-05-30T08:00:00.000Z",
  updatedAt: "2026-05-30T08:00:00.000Z",
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [addresses, setAddresses] = useState<Address[]>(nepalAddressData);
  const [orders, setOrders] = useState<Order[]>(nepalOrdersData);
  const [cartQuantities, setCartQuantities] = useState<CartQuantities>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItems = useMemo(
    () =>
      nepalProducts
        .filter((product) => cartQuantities[product._id] > 0)
        .map((product) => ({
          product,
          quantity: cartQuantities[product._id],
        })),
    [cartQuantities],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems],
  );

  const deliveryFee = subtotal === 0 || subtotal >= 1500 ? 0 : 99;
  const tax = Math.round(subtotal * 0.13);
  const total = subtotal + deliveryFee + tax;

  const addToCart = (productId: string, quantity = 1) => {
    const product = nepalProducts.find((item) => item._id === productId);

    if (!product) return;

    setCartQuantities((current) => {
      const nextQuantity = Math.min((current[productId] ?? 0) + quantity, product.stock);
      return { ...current, [productId]: nextQuantity };
    });

    toast.success(`${product.name} added to basket`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCartQuantities((current) => {
      const next = { ...current };
      const product = nepalProducts.find((item) => item._id === productId);

      if (!product || quantity <= 0) {
        delete next[productId];
        return next;
      }

      next[productId] = Math.min(quantity, product.stock);
      return next;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => setCartQuantities({});

  const syncUserAddresses = (nextAddresses: Address[]) => {
    setAddresses(nextAddresses);
    setUser((current) =>
      current
        ? {
            ...current,
            addresses: nextAddresses,
            updatedAt: new Date().toISOString(),
          }
        : current,
    );
  };

  const login = (name: string, email: string) => {
    setUser({
      _id: `user-${Date.now()}`,
      name,
      email,
      phone: "9800000000",
      avatar: "",
      addresses,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast.success("Signed in successfully");
  };

  const register = (name: string, email: string) => {
    login(name, email);
    toast.success("Account created");
  };

  const logout = () => {
    setUser(null);
    setIsCartOpen(false);
    toast.success("Signed out");
  };

  const addAddress = (address: Omit<Address, "_id" | "isDefault" | "lat" | "lng">) => {
    const nextAddress: Address = {
      ...address,
      _id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0,
      lat: 27.7172,
      lng: 85.324,
    };

    syncUserAddresses([...addresses, nextAddress]);
    toast.success("Address saved");
  };

  const setDefaultAddress = (addressId: string) => {
    syncUserAddresses(
      addresses.map((address) => ({
        ...address,
        isDefault: address._id === addressId,
      })),
    );
    toast.success("Default address updated");
  };

  const placeOrder = (addressId: string, paymentMethod: string, deliveryWindow: string) => {
    const address = addresses.find((item) => item._id === addressId);

    if (!address) {
      throw new Error("Please select a delivery address");
    }

    if (cartItems.length === 0) {
      throw new Error("Your basket is empty");
    }

    const now = new Date();
    const order: Order = {
      _id: `QB-NP-${now.getTime().toString().slice(-6)}`,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          }
        : "guest",
      items: cartItems.map(({ product, quantity }) => ({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        unit: product.unit,
      })),
      shippingAddress: {
        label: address.label,
        address: address.address,
        city: address.city,
        state: address.state,
        zip: address.zip,
        lat: address.lat,
        lng: address.lng,
      },
      paymentMethod,
      subtotal,
      deliveryFee,
      tax,
      total,
      status: "Placed",
      statusHistory: [
        {
          status: "Placed",
          note: `Order scheduled for ${deliveryWindow}`,
          timestamp: now.toISOString(),
        },
      ],
      deliveryPartner: nepalDeliveryPartner,
      deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(),
      isPaid: paymentMethod !== "Cash on Delivery",
      createdAt: now.toISOString(),
    };

    setOrders((current) => [order, ...current]);
    clearCart();
    setIsCartOpen(false);
    toast.success("Order placed successfully");

    return order;
  };

  const value: AppContextValue = {
    user,
    products: nepalProducts,
    addresses,
    orders,
    cartQuantities,
    cartItems,
    cartCount,
    subtotal,
    deliveryFee,
    tax,
    total,
    isCartOpen,
    deliveryWindows,
    setIsCartOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    login,
    register,
    logout,
    addAddress,
    setDefaultAddress,
    placeOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
};
