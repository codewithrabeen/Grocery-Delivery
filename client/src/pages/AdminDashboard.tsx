import {
  BikeIcon,
  ClipboardListIcon,
  PackageIcon,
  PackageXIcon,
  PlusIcon,
  TruckIcon,
  UsersIcon,
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
import { adminService, type AdminStats } from "../services/adminService";
import type { DeliveryPartner, Order } from "../types";

const partnerFormInitial = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleType: "bike",
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
  const [selectedPartners, setSelectedPartners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [creatingPartner, setCreatingPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState(partnerFormInitial);

  const activePartners = useMemo(
    () => partners.filter((partner) => partner.isActive !== false),
    [partners],
  );

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextStats, nextPartners] = await Promise.all([
        adminService.getStats(),
        adminService.getDeliveryPartners(),
      ]);
      setStats(nextStats);
      setPartners(nextPartners);
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

  const statCards = stats
    ? [
        { label: "Orders", value: stats.totalOrders, icon: ClipboardListIcon },
        { label: "Customers", value: stats.totalUser, icon: UsersIcon },
        { label: "Products", value: stats.totalProducts, icon: PackageIcon },
        { label: "Out of stock", value: stats.outOfStock, icon: PackageXIcon },
        { label: "Partners", value: stats.totalPartners, icon: BikeIcon },
      ]
    : [];

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
