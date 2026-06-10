import { ArrowRightIcon, PackageIcon, ReceiptTextIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { statusColors } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { formatDate, formatPrice } from "../lib/format";

const MyOrders = () => {
  const { orders } = useAppContext();

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Account</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">My orders</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Review grocery orders, payment status, and delivery progress.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <PackageIcon className="mx-auto mb-5 size-12 text-zinc-300" />
            <h2 className="text-2xl font-semibold text-zinc-950">No orders yet</h2>
            <p className="mt-2 text-zinc-500">Your completed checkouts will appear here.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
            >
              Shop groceries
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-app-green">
                      <ReceiptTextIcon className="size-6" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-zinc-950">{order.id}</h2>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusColors[order.status] ?? "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{formatDate(order.createdAt)}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {order.shippingAddress.address}, {order.shippingAddress.city}
                      </p>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-2xl font-bold text-app-green">{formatPrice(order.total)}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} |{" "}
                      {order.paymentMethod}
                    </p>
                    <Link
                      to={`/orders/${order.id}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-app-green px-4 py-2 text-sm font-semibold text-white hover:bg-app-green-light"
                    >
                      Track order
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-zinc-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  {order.items.slice(0, 4).map((item) => (
                    <div key={`${order.id}-${item.product}`} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-14 rounded-xl bg-zinc-50 object-contain p-2"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950">{item.name}</p>
                        <p className="text-xs text-zinc-500">Qty {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyOrders;
