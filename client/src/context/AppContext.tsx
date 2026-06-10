/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../config/api";
import { readJsonStorage, userScopedKey, writeJsonStorage } from "../lib/storage";
import {
  addressService,
  createAddressPayload,
  type AddressInput,
} from "../services/addressService";
import { orderService, type CreateOrderResult } from "../services/orderService";
import { createPaymentPayload, type PaymentMethodId } from "../services/paymentService";
import { productService, type ProductQuery } from "../services/productService";
import { wishlistService } from "../services/wishlistService";
import type { Address, CartItem, LiveLocation, Order, Product, User } from "../types";
import { useAuth } from "./AuthContext";

type CartQuantities = Record<string, number>;

type AppContextValue = {
  user: User | null;
  products: Product[];
  productLoading: boolean;
  productError: string | null;
  addresses: Address[];
  addressLoading: boolean;
  addressError: string | null;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  wishlistIds: string[];
  wishlistLoading: boolean;
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
  refreshProducts: (query?: ProductQuery) => Promise<Product[]>;
  refreshAddresses: () => Promise<Address[]>;
  refreshOrders: () => Promise<Order[]>;
  refreshOrder: (id: string) => Promise<Order | null>;
  refreshOrderLocation: (id: string) => Promise<{ liveLocation?: LiveLocation | null; status?: string }>;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  addAddress: (address: AddressInput) => Promise<boolean>;
  updateAddress: (id: string, address: AddressInput) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  placeOrder: (
    addressId: string,
    paymentMethod: PaymentMethodId,
    deliveryWindow: string,
  ) => Promise<CreateOrderResult | null>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

const deliveryWindows = [
  "Today, 30-45 min",
  "Today, 5:00 PM - 6:00 PM",
  "Tomorrow, 8:00 AM - 10:00 AM",
];

const cartKey = (userId?: string | null) => userScopedKey("cart", userId);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, updateUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses ?? []);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<CartQuantities>(() =>
    readJsonStorage<CartQuantities>(cartKey(user?.id), {}),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshProducts = useCallback(async (query: ProductQuery = {}) => {
    setProductLoading(true);
    setProductError(null);
    try {
      const nextProducts = await productService.getProducts(query);
      setProducts(nextProducts);
      return nextProducts;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load products");
      setProductError(message);
      toast.error(message);
      return [];
    } finally {
      setProductLoading(false);
    }
  }, []);

  const refreshAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return [];
    }

    setAddressLoading(true);
    setAddressError(null);
    try {
      const nextAddresses = await addressService.getAddresses();
      setAddresses(nextAddresses);
      updateUser({ addresses: nextAddresses });
      return nextAddresses;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load addresses");
      setAddressError(message);
      return [];
    } finally {
      setAddressLoading(false);
    }
  }, [updateUser, user]);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return [];
    }

    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const nextOrders = await orderService.getOrders();
      setOrders(nextOrders);
      return nextOrders;
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load orders");
      setOrdersError(message);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  const refreshOrder = useCallback(async (id: string) => {
    try {
      const order = await orderService.getOrder(id);
      setOrders((current) => {
        const exists = current.some((item) => item.id === id);
        return exists ? current.map((item) => (item.id === id ? order : item)) : [order, ...current];
      });
      return order;
    } catch {
      return null;
    }
  }, []);

  const refreshOrderLocation = useCallback(async (id: string) => orderService.getOrderLocation(id), []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    const nextCart = readJsonStorage<CartQuantities>(cartKey(user?.id), {});
    setCartQuantities(nextCart);

    if (!user) {
      setAddresses([]);
      setOrders([]);
      setWishlistIds([]);
      return;
    }

    setWishlistLoading(true);
    void wishlistService
      .getWishlist(user.id)
      .then(setWishlistIds)
      .finally(() => setWishlistLoading(false));

    void refreshAddresses();
    void refreshOrders();
  }, [refreshAddresses, refreshOrders, user]);

  useEffect(() => {
    writeJsonStorage(cartKey(user?.id), cartQuantities);
  }, [cartQuantities, user?.id]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cartQuantities)
        .map(([productId, quantity]) => {
          const product = productMap.get(productId);
          return product && quantity > 0 ? { product, quantity } : null;
        })
        .filter((item): item is CartItem => Boolean(item)),
    [cartQuantities, productMap],
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

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = productMap.get(productId);

      if (!product) {
        toast.error("Product is not available right now");
        return;
      }

      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }

      setCartQuantities((current) => {
        const nextQuantity = Math.min((current[productId] ?? 0) + quantity, product.stock);
        return { ...current, [productId]: nextQuantity };
      });

      toast.success(`${product.name} added to cart`);
    },
    [productMap],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = productMap.get(productId);
      setCartQuantities((current) => {
        const next = { ...current };

        if (!product || quantity <= 0) {
          delete next[productId];
          return next;
        }

        next[productId] = Math.min(quantity, product.stock);
        return next;
      });
    },
    [productMap],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCartQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    toast.success("Product removed from cart");
  }, []);

  const clearCart = useCallback(() => {
    setCartQuantities({});
  }, []);

  const syncAddresses = useCallback(
    (nextAddresses: Address[]) => {
      setAddresses(nextAddresses);
      updateUser({ addresses: nextAddresses });
    },
    [updateUser],
  );

  const addAddress = useCallback(
    async (address: AddressInput) => {
      try {
        const nextAddresses = await addressService.addAddress(createAddressPayload(address));
        syncAddresses(nextAddresses);
        toast.success("Address added");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not add address"));
        return false;
      }
    },
    [syncAddresses],
  );

  const updateAddress = useCallback(
    async (id: string, address: AddressInput) => {
      try {
        const nextAddresses = await addressService.updateAddress(id, createAddressPayload(address));
        syncAddresses(nextAddresses);
        toast.success("Address updated");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not update address"));
        return false;
      }
    },
    [syncAddresses],
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      try {
        const nextAddresses = await addressService.deleteAddress(id);
        syncAddresses(nextAddresses);
        toast.success("Address deleted");
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not delete address"));
        return false;
      }
    },
    [syncAddresses],
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      const address = addresses.find((item) => item.id === addressId);
      if (!address) return false;
      return updateAddress(addressId, createAddressPayload({ ...address, isDefault: true }));
    },
    [addresses, updateAddress],
  );

  const placeOrder = useCallback(
    async (addressId: string, paymentMethod: PaymentMethodId, deliveryWindow: string) => {
      const address = addresses.find((item) => item.id === addressId);

      if (!address) {
        toast.error("Please select a delivery address");
        return null;
      }

      if (cartItems.length === 0) {
        toast.error("Your cart is empty");
        return null;
      }

      try {
        const result = await orderService.createOrder(
          createPaymentPayload(
            {
              items: cartItems.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
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
            },
            paymentMethod,
          ),
        );

        if (result.type === "order") {
          setOrders((current) => [result.order, ...current.filter((item) => item.id !== result.order.id)]);
          clearCart();
          setIsCartOpen(false);
          toast.success(`Order placed for ${deliveryWindow}`);
        }

        return result;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not place order"));
        return null;
      }
    },
    [addresses, cartItems, clearCart],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error("Sign in to save favorites");
        return;
      }

      const product = productMap.get(productId);
      const alreadySaved = wishlistIds.includes(productId);
      const nextIds = alreadySaved
        ? await wishlistService.removeProduct(user.id, productId)
        : await wishlistService.addProduct(user.id, productId);

      setWishlistIds(nextIds);
      toast.success(
        alreadySaved
          ? `${product?.name ?? "Product"} removed from wishlist`
          : `${product?.name ?? "Product"} saved to wishlist`,
      );
    },
    [productMap, user, wishlistIds],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      products,
      productLoading,
      productError,
      addresses,
      addressLoading,
      addressError,
      orders,
      ordersLoading,
      ordersError,
      wishlistIds,
      wishlistLoading,
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
      refreshProducts,
      refreshAddresses,
      refreshOrders,
      refreshOrder,
      refreshOrderLocation,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      placeOrder,
      toggleWishlist,
      isWishlisted,
    }),
    [
      addAddress,
      addToCart,
      addressError,
      addressLoading,
      addresses,
      cartCount,
      cartItems,
      cartQuantities,
      clearCart,
      deleteAddress,
      deliveryFee,
      isCartOpen,
      isWishlisted,
      orders,
      ordersError,
      ordersLoading,
      placeOrder,
      productError,
      productLoading,
      products,
      refreshAddresses,
      refreshOrder,
      refreshOrderLocation,
      refreshOrders,
      refreshProducts,
      removeFromCart,
      setDefaultAddress,
      subtotal,
      tax,
      toggleWishlist,
      total,
      updateAddress,
      updateCartQuantity,
      user,
      wishlistIds,
      wishlistLoading,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
};
