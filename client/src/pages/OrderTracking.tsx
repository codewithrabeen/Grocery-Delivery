import { PhoneIcon, ReceiptTextIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { statusColors } from "../assets/assets";
import OrderMap from "../components/OrderMap";
import ErrorState from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppContext } from "../context/AppContext";
import { formatDate, formatPrice } from "../lib/format";
import type { LiveLocation, Order } from "../types";

type RemoteOrderState = {
  error: string | null;
  loading: boolean;
  order: Order | null;
  orderId: string | null;
};

const OrderTracking = () => {
  const { id } = useParams();
  const { orders, refreshOrder, refreshOrderLocation } = useAppContext();
  const cachedOrder = useMemo(() => orders.find((item) => item.id === id) ?? null, [id, orders]);
  const [remoteState, setRemoteState] = useState<RemoteOrderState>({
    error: null,
    loading: false,
    order: null,
    orderId: null,
  });
  const [liveState, setLiveState] = useState<{
    location: LiveLocation | null | undefined;
    status?: string;
  }>({
    location: undefined,
  });

  useEffect(() => {
    if (!id || cachedOrder) return;

    let active = true;
    const timer = window.setTimeout(() => {
      setRemoteState({ error: null, loading: true, order: null, orderId: id });

      void refreshOrder(id)
        .then((nextOrder) => {
          if (!active) return;
          setRemoteState({
            error: nextOrder ? null : "We could not find this order for your account.",
            loading: false,
            order: nextOrder,
            orderId: id,
          });
        })
        .catch(() => {
          if (!active) return;
          setRemoteState({
            error: "Could not load this order right now.",
            loading: false,
            order: null,
            orderId: id,
          });
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cachedOrder, id, refreshOrder]);

  const order = cachedOrder ?? (remoteState.orderId === id ? remoteState.order : null);
  const loading = Boolean(id) && !cachedOrder && (remoteState.orderId !== id || remoteState.loading);
  const error = cachedOrder || remoteState.orderId !== id ? null : remoteState.error;

  useEffect(() => {
    if (!id || !order) return;

    let active = true;
    const loadLocation = () => {
      void refreshOrderLocation(id)
        .then((next) => {
          if (!active) return;
          setLiveState({
            location: next.liveLocation ?? null,
            status: next.status,
          });
        })
        .catch(() => {
          if (!active) return;
          setLiveState((current) => ({ ...current, location: current.location ?? null }));
        });
    };

    loadLocation();
    const timer = window.setInterval(loadLocation, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id, order, refreshOrderLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-cream">
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-10 w-full max-w-xl" />
            <Skeleton className="mt-3 h-4 w-52" />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-[520px] w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <ErrorState message={error} onRetry={() => id && void refreshOrder(id)} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-950">Order not found</h1>
        <p className="mt-2 text-zinc-500">We could not find this order in the client state.</p>
        <Link
          to="/orders"
          className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStatus = liveState.status ?? order.status;
  const currentLocation = liveState.location === undefined ? order.liveLocation : liveState.location;

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Order tracking</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-950">{order.id}</h1>
              <p className="mt-2 text-zinc-500">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                statusColors[currentStatus] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {currentStatus}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Live delivery map</h2>
            <div className="mt-5">
              <OrderMap
                shippingAddress={order.shippingAddress}
                liveLocation={currentLocation}
                status={currentStatus}
              />
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Status history</h2>
            {order.statusHistory.length > 0 ? (
              <div className="mt-5 space-y-4">
                {order.statusHistory.map((item) => (
                  <div
                    key={`${item.status}-${item.timestamp}`}
                    className="border-l-2 border-app-green pl-4"
                  >
                    <p className="font-semibold text-zinc-950">{item.status}</p>
                    <p className="text-sm text-zinc-500">{formatDate(item.timestamp)}</p>
                    {item.note && <p className="mt-1 text-sm text-zinc-600">{item.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                Status updates will appear here as the fulfillment team moves this order forward.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Order details</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div key={item.product ?? item.productId ?? item.name} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-14 rounded-lg bg-zinc-50 object-contain p-2"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-950">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-950">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-950">
              <ReceiptTextIcon className="size-6 text-app-green" aria-hidden="true" />
              Delivery info
            </h2>
            <div className="mt-5 space-y-4 text-sm text-zinc-600">
              <p>
                <span className="block font-semibold text-zinc-950">Address</span>
                {order.shippingAddress.address}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
              </p>
              <p>
                <span className="block font-semibold text-zinc-950">Payment</span>
                {order.paymentMethod} {order.isPaid ? "(Paid)" : "(Unpaid)"}
              </p>
              {order.deliveryOtp && (
                <p>
                  <span className="block font-semibold text-zinc-950">Delivery OTP</span>
                  {order.deliveryOtp}
                </p>
              )}
            </div>
          </section>

          {order.deliveryPartner && (
            <section className="rounded-lg bg-app-green p-6 text-white shadow-sm">
              <p className="text-sm font-semibold text-white/70">Delivery partner</p>
              <h2 className="mt-2 text-2xl font-bold">
                {order.deliveryPartner.name ?? "Assigned rider"}
              </h2>
              <p className="mt-1 text-sm text-white/75 capitalize">
                {order.deliveryPartner.vehicleType ?? "Delivery"} rider
              </p>
              {order.deliveryPartner.phone && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                  <PhoneIcon className="size-4" aria-hidden="true" />
                  {order.deliveryPartner.phone}
                </p>
              )}
            </section>
          )}
        </aside>
      </section>
    </div>
  );
};

export default OrderTracking;
