import {
  BikeIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PackageCheckIcon,
  PhoneIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { statusColors } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { formatDate, formatPrice } from "../lib/format";
import OrderMap from "../components/OrderMap";

const trackingSteps = ["Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const OrderTracking = () => {
  const { id } = useParams();
  const { orders } = useAppContext();
  const order = orders.find((item) => item._id === id);

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

  const currentStep = Math.max(0, trackingSteps.indexOf(order.status));

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Order tracking</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-950">{order._id}</h1>
              <p className="mt-2 text-zinc-500">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                statusColors[order.status] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-bold text-zinc-950">
    Live Delivery Map
  </h2>

  <div className="mt-5">
    <OrderMap
      address={order.shippingAddress.label}
    />
  </div>
</section>


  
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Order details</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <div key={item.product} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-14 rounded-xl bg-zinc-50 object-contain p-2"
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

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-950">
              <ReceiptTextIcon className="size-6 text-app-green" />
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
            <section className="rounded-2xl bg-app-green p-6 text-white shadow-sm">
              <p className="text-sm font-semibold text-white/70">Delivery partner</p>
              <h2 className="mt-2 text-2xl font-bold">{order.deliveryPartner.name}</h2>
              <p className="mt-1 text-sm text-white/75 capitalize">
                {order.deliveryPartner.vehicleType} rider
              </p>
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <PhoneIcon className="size-4" />
                {order.deliveryPartner.phone}
              </p>
            </section>
          )}
        </aside>
      </section>
    </div>
  );
};

export default OrderTracking;

