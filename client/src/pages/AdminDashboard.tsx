import {
  BikeIcon,
  ClipboardListIcon,
  CreditCardIcon,
  Edit3Icon,
  PackageIcon,
  PackageXIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  Trash2Icon,
  TruckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { statusColors } from "../assets/assets";
import ErrorState from "../components/ui/ErrorState";
import LoadingButton from "../components/ui/LoadingButton";
import { Skeleton } from "../components/ui/Skeleton";
import { getApiErrorMessage } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatPrice } from "../lib/format";
import { adminService, type AdminStats, type ProductPayload } from "../services/adminService";
import type { DeliveryPartner, Order, Product } from "../types";

const partnerFormInitial = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleType: "bike",
};

const productFormInitial: ProductPayload = {
  name: "",
  description: "",
  price: 0,
  originalPrice: 0,
  image: "",
  category: "fruits-vegetables",
  unit: "piece",
  stock: 0,
  isOrganic: false,
  isFeatured: false,
};

const getCustomerName = (order: Order) => {
  if (typeof order.user === "object" && order.user?.name) return order.user.name;
  return "Customer";
};

const getPartnerName = (order: Order) => order.deliveryPartner?.name ?? "Unassigned";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [creatingPartner, setCreatingPartner] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [partnerForm, setPartnerForm] = useState(partnerFormInitial);
  const [productForm, setProductForm] = useState<ProductPayload>(productFormInitial);

  const activePartners = useMemo(
    () => partners.filter((partner) => partner.isActive !== false),
    [partners],
  );
  const visibleProducts = useMemo(
    () =>
      adminProducts.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(productSearch.toLowerCase()),
      ),
    [adminProducts, productSearch],
  );

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextStats, nextPartners, nextProducts] = await Promise.all([
        adminService.getStats(),
        adminService.getDeliveryPartners(),
        adminService.getProducts(),
      ]);
      setStats(nextStats);
      setPartners(nextPartners);
      setAdminProducts(nextProducts);
      setSelectedPartners((current) => {
        const next = { ...current };
        nextStats.recentOrders.forEach((order) => {
          if (!next[order.id] && nextPartners[0]?.id) {
            next[order.id] = nextPartners[0].id;
          }
        });
        return next;
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Could not load admin dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdminData]);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreatePartner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingPartner(true);

    try {
      const partner = await adminService.createDeliveryPartner({
        ...partnerForm,
        email: partnerForm.email.trim().toLowerCase(),
        name: partnerForm.name.trim(),
        phone: partnerForm.phone.trim(),
      });

      if (partner) {
        setPartners((current) => [partner, ...current]);
        setStats((current) =>
          current ? { ...current, totalPartners: current.totalPartners + 1 } : current,
        );
        setPartnerForm(partnerFormInitial);
        toast.success("Delivery partner created");
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Could not create delivery partner"));
    } finally {
      setCreatingPartner(false);
    }
  };

  const handleAssignPartner = async (orderId: string) => {
    const partnerId = selectedPartners[orderId];

    if (!partnerId) {
      toast.error("Select a delivery partner");
      return;
    }

    setAssigningOrderId(orderId);

    try {
      const updatedOrder = await adminService.assignDeliveryPartner(orderId, partnerId);

      if (updatedOrder) {
        setStats((current) =>
          current
            ? {
                ...current,
                recentOrders: current.recentOrders.map((order) =>
                  order.id === orderId ? updatedOrder : order,
                ),
              }
            : current,
        );
        toast.success("Delivery partner assigned");
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Could not assign delivery partner"));
    } finally {
      setAssigningOrderId(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      unit: product.unit,
      stock: product.stock,
      isOrganic: product.isOrganic,
      isFeatured: Boolean(product.isFeatured),
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(productFormInitial);
  };

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProduct(true);

    try {
      const savedProduct = editingProductId
        ? await adminService.updateProduct(editingProductId, productForm)
        : await adminService.createProduct(productForm);

      if (savedProduct) {
        setAdminProducts((current) =>
          editingProductId
            ? current.map((product) => (product.id === savedProduct.id ? savedProduct : product))
            : [savedProduct, ...current],
        );
        setStats((current) =>
          current && !editingProductId
            ? { ...current, totalProducts: current.totalProducts + 1 }
            : current,
        );
        resetProductForm();
        toast.success(editingProductId ? "Product updated" : "Product created");
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Could not save product"));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Delete this product?")) return;
    setDeletingProductId(productId);

    try {
      await adminService.deleteProduct(productId);
      setAdminProducts((current) => current.filter((product) => product.id !== productId));
      setStats((current) =>
        current ? { ...current, totalProducts: Math.max(0, current.totalProducts - 1) } : current,
      );
      toast.success("Product deleted");
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Could not delete product"));
    } finally {
      setDeletingProductId(null);
    }
  };

  const statCards = stats
    ? [
        { label: "Orders", value: stats.totalOrders, icon: ClipboardListIcon },
        { label: "Revenue", value: formatPrice(stats.revenue), icon: CreditCardIcon },
        { label: "This week", value: formatPrice(stats.weeklySales), icon: CreditCardIcon },
        { label: "Customers", value: stats.totalUser, icon: UsersIcon },
        { label: "Products", value: stats.totalProducts, icon: PackageIcon },
        { label: "Out of stock", value: stats.outOfStock, icon: PackageXIcon },
        { label: "Partners", value: stats.totalPartners, icon: BikeIcon },
      ]
    : [];
  const monthlySalesMax = Math.max(
    1,
    ...(stats?.monthlySales.map((period) => Number(period.total) || 0) ?? [0]),
  );

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Operations</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Monitor live order volume, inventory health, and delivery partner assignments.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadAdminData()} />
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article key={stat.label} className="rounded-lg bg-white p-5 shadow-sm">
                    <Icon className="mb-5 size-7 text-app-green" aria-hidden="true" />
                    <p className="text-3xl font-bold text-zinc-950">{stat.value}</p>
                    <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                  </article>
                );
              })}
            </div>

            {stats?.monthlySales.length ? (
              <section className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-app-orange">Sales chart</p>
                    <h2 className="mt-1 text-2xl font-bold text-zinc-950">Monthly sales</h2>
                  </div>
                  <p className="text-sm font-semibold text-app-green">
                    {formatPrice(stats.monthlySalesTotal)} this month
                  </p>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {stats.monthlySales.map((period) => {
                    const height = Math.max(12, (Number(period.total) / monthlySalesMax) * 100);

                    return (
                      <div key={period.label} className="flex h-44 flex-col justify-end gap-3">
                        <div className="flex flex-1 items-end rounded-lg bg-zinc-50 p-2">
                          <div
                            className="w-full rounded-md bg-app-green"
                            style={{ height: `${height}%` }}
                            aria-label={`${period.label}: ${formatPrice(period.total)}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-950">{period.label}</p>
                          <p className="text-xs text-zinc-500">{formatPrice(period.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <section className="rounded-lg bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-app-orange">Fulfillment</p>
                    <h2 className="mt-1 text-2xl font-bold text-zinc-950">Recent orders</h2>
                  </div>
                  <p className="text-sm text-zinc-500">Assign active delivery partners</p>
                </div>

                <div className="mt-5 space-y-4">
                  {stats?.recentOrders.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
                      Recent orders will appear here.
                    </div>
                  ) : (
                    stats?.recentOrders.map((order) => (
                      <article key={order.id} className="rounded-lg border border-zinc-200 p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-zinc-950">
                                {order.id}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  statusColors[order.status] ?? "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-zinc-500">
                              {getCustomerName(order)} | {formatDate(order.createdAt)}
                            </p>
                            <p className="mt-2 text-sm text-zinc-500">
                              {order.items.length} {order.items.length === 1 ? "item" : "items"} |{" "}
                              {formatPrice(order.total)} | {getPartnerName(order)}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:w-[360px]">
                            <label>
                              <span className="sr-only">Delivery partner</span>
                              <select
                                value={selectedPartners[order.id] ?? ""}
                                onChange={(event) =>
                                  setSelectedPartners((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                              >
                                <option value="">Select partner</option>
                                {activePartners.map((partner) => (
                                  <option key={partner.id} value={partner.id}>
                                    {partner.name} ({partner.vehicleType ?? "vehicle"})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <LoadingButton
                              type="button"
                              loading={assigningOrderId === order.id}
                              disabled={activePartners.length === 0}
                              onClick={() => void handleAssignPartner(order.id)}
                              className="h-11 px-4 py-0"
                            >
                              Assign
                            </LoadingButton>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <aside className="space-y-6">
                <form onSubmit={handleCreatePartner} className="rounded-lg bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-green-50 text-app-green">
                      <TruckIcon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-app-orange">Partner roster</p>
                      <h2 className="text-2xl font-bold text-zinc-950">Add rider</h2>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <input
                      type="text"
                      required
                      value={partnerForm.name}
                      onChange={(event) =>
                        setPartnerForm({ ...partnerForm, name: event.target.value })
                      }
                      placeholder="Full name"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <input
                      type="email"
                      required
                      value={partnerForm.email}
                      onChange={(event) =>
                        setPartnerForm({ ...partnerForm, email: event.target.value })
                      }
                      placeholder="Email address"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={partnerForm.password}
                      onChange={(event) =>
                        setPartnerForm({ ...partnerForm, password: event.target.value })
                      }
                      placeholder="Temporary password"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={partnerForm.phone}
                      onChange={(event) =>
                        setPartnerForm({ ...partnerForm, phone: event.target.value })
                      }
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <select
                      value={partnerForm.vehicleType}
                      onChange={(event) =>
                        setPartnerForm({ ...partnerForm, vehicleType: event.target.value })
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    >
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                    </select>
                  </div>

                  <LoadingButton type="submit" loading={creatingPartner} className="mt-5 w-full">
                    <PlusIcon className="size-5" aria-hidden="true" />
                    Save rider
                  </LoadingButton>
                </form>

                <section className="rounded-lg bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-950">Active partners</h2>
                  <div className="mt-4 space-y-3">
                    {partners.length === 0 ? (
                      <p className="text-sm text-zinc-500">No delivery partners yet.</p>
                    ) : (
                      partners.slice(0, 6).map((partner) => (
                        <div
                          key={partner.id ?? partner.email}
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-950">{partner.name}</p>
                            <p className="text-sm text-zinc-500">
                              {partner.phone} | {partner.vehicleType ?? "vehicle"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              partner.isActive === false
                                ? "bg-zinc-100 text-zinc-500"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {partner.isActive === false ? "Inactive" : "Active"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </aside>
            </div>

            <section className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-app-orange">Catalog</p>
                  <h2 className="mt-1 text-2xl font-bold text-zinc-950">Product management</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Edit stock, prices, featured products, and catalog details.
                  </p>
                </div>
                <label className="relative block w-full lg:w-80">
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search products"
                    className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
                <div className="overflow-hidden rounded-lg border border-zinc-200">
                  <div className="max-h-[620px] overflow-auto">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                      <thead className="sticky top-0 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">Rating</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {visibleProducts.map((product) => (
                          <tr key={product.id} className="align-middle">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="size-12 rounded-lg bg-zinc-50 object-contain p-1"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-zinc-950">{product.name}</p>
                                  <p className="text-xs text-zinc-500">
                                    {product.category} | {product.unit}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-zinc-950">
                              {formatPrice(product.price)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  product.stock <= 0
                                    ? "bg-red-100 text-red-700"
                                    : product.stock <= 10
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-green-100 text-green-700"
                                }`}
                              >
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-600">
                              {product.rating.toFixed(1)} ({product.reviewCount})
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditProduct(product)}
                                  className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-app-green hover:text-app-green focus:outline-none focus:ring-2 focus:ring-app-green"
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Edit3Icon className="size-4" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteProduct(product.id)}
                                  disabled={deletingProductId === product.id}
                                  className="flex size-9 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-400"
                                  aria-label={`Delete ${product.name}`}
                                >
                                  <Trash2Icon className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {visibleProducts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                              No products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <form onSubmit={handleSaveProduct} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-app-orange">
                        {editingProductId ? "Edit product" : "New product"}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-zinc-950">
                        {editingProductId ? "Update catalog item" : "Add catalog item"}
                      </h3>
                    </div>
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="flex size-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-app-green"
                        aria-label="Cancel edit"
                      >
                        <XIcon className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm({ ...productForm, name: event.target.value })
                      }
                      placeholder="Product name"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <textarea
                      required
                      value={productForm.description}
                      onChange={(event) =>
                        setProductForm({ ...productForm, description: event.target.value })
                      }
                      placeholder="Description"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={productForm.image}
                      onChange={(event) =>
                        setProductForm({ ...productForm, image: event.target.value })
                      }
                      placeholder="Image URL"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        value={productForm.category}
                        onChange={(event) =>
                          setProductForm({ ...productForm, category: event.target.value })
                        }
                        placeholder="Category"
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={productForm.unit}
                        onChange={(event) =>
                          setProductForm({ ...productForm, unit: event.target.value })
                        }
                        placeholder="Unit"
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={productForm.price}
                        onChange={(event) =>
                          setProductForm({ ...productForm, price: Number(event.target.value) })
                        }
                        placeholder="Price"
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.originalPrice}
                        onChange={(event) =>
                          setProductForm({
                            ...productForm,
                            originalPrice: Number(event.target.value),
                          })
                        }
                        placeholder="Original price"
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        required
                        value={productForm.stock}
                        onChange={(event) =>
                          setProductForm({ ...productForm, stock: Number(event.target.value) })
                        }
                        placeholder="Stock"
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={productForm.isOrganic}
                          onChange={(event) =>
                            setProductForm({ ...productForm, isOrganic: event.target.checked })
                          }
                          className="size-4 accent-app-green"
                        />
                        Organic
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={Boolean(productForm.isFeatured)}
                          onChange={(event) =>
                            setProductForm({ ...productForm, isFeatured: event.target.checked })
                          }
                          className="size-4 accent-app-green"
                        />
                        Featured
                      </label>
                    </div>
                  </div>

                  <LoadingButton type="submit" loading={savingProduct} className="mt-5 w-full">
                    <SaveIcon className="size-5" aria-hidden="true" />
                    {editingProductId ? "Update product" : "Create product"}
                  </LoadingButton>
                </form>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-app-orange">Inventory</p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950">Low stock</h2>
                <div className="mt-5 space-y-3">
                  {stats?.lowStock.length === 0 ? (
                    <p className="text-sm text-zinc-500">No low-stock products.</p>
                  ) : (
                    stats?.lowStock.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
                      >
                        <p className="truncate font-semibold text-zinc-950">{product.name}</p>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {product.stock}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-lg bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-app-orange">Sales</p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950">Top selling</h2>
                <div className="mt-5 space-y-3">
                  {stats?.topSelling.length === 0 ? (
                    <p className="text-sm text-zinc-500">Top products will appear after orders.</p>
                  ) : (
                    stats?.topSelling.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
                      >
                        <p className="truncate font-semibold text-zinc-950">{product.name}</p>
                        <span className="text-sm font-semibold text-app-green">
                          {product.soldCount ?? 0} sold
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
