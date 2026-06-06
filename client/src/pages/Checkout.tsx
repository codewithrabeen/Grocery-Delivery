import { ArrowLeftIcon, CheckCircle2Icon, MapPinIcon, PlusIcon, WalletIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { formatPrice } from "../lib/format";

const paymentMethods = ["Cash on Delivery", "eSewa", "Khalti"];

const Checkout = () => {
  const {
    addresses,
    cartItems,
    deliveryFee,
    deliveryWindows,
    placeOrder,
    subtotal,
    tax,
    total,
  } = useAppContext();
  const navigate = useNavigate();
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0],
    [addresses],
  );
  const [selectedAddress, setSelectedAddress] = useState(defaultAddress?._id ?? "");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [deliveryWindow, setDeliveryWindow] = useState(deliveryWindows[0]);

  const handlePlaceOrder = () => {
    try {
      const order = placeOrder(selectedAddress, paymentMethod, deliveryWindow);
      navigate(`/orders/${order._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place order");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-950">Your basket is empty</h1>
        <p className="mt-2 text-zinc-500">Add groceries before opening checkout.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-app-green"
        >
          <ArrowLeftIcon className="size-4" />
          Continue shopping
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-app-orange">Step 1</p>
                  <h1 className="mt-1 text-2xl font-bold text-zinc-950">Delivery address</h1>
                </div>
                <Link
                  to="/addresses"
                  className="inline-flex items-center gap-2 rounded-full border border-app-green px-4 py-2 text-sm font-semibold text-app-green hover:bg-green-50"
                >
                  <PlusIcon className="size-4" />
                  Add address
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${
                      selectedAddress === address._id
                        ? "border-app-green bg-green-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address._id}
                      checked={selectedAddress === address._id}
                      onChange={() => setSelectedAddress(address._id)}
                      className="mt-1 accent-app-green"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 font-semibold text-zinc-950">
                        <MapPinIcon className="size-4 text-app-green" />
                        {address.label}
                        {address.isDefault && (
                          <span className="rounded-full bg-app-green px-2 py-0.5 text-xs text-white">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-zinc-500">
                        {address.address}, {address.city}, {address.state} {address.zip}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-app-orange">Step 2</p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-950">Delivery time</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {deliveryWindows.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDeliveryWindow(slot)}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
                      deliveryWindow === slot
                        ? "border-app-green bg-green-50 text-app-green"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-app-green/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-app-orange">Step 3</p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-950">Payment method</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
                      paymentMethod === method
                        ? "border-app-green bg-green-50 text-app-green"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-app-green/50"
                    }`}
                  >
                    <WalletIcon className="mb-3 size-5" />
                    {method}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-zinc-950">Order summary</h2>

            <div className="mt-5 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product._id} className="flex gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-16 rounded-xl bg-zinc-50 object-contain p-2"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-950">{product.name}</p>
                    <p className="text-sm text-zinc-500">
                      {quantity} x {formatPrice(product.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-950">
                    {formatPrice(product.price * quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-zinc-200 pt-5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>VAT 13%</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold text-zinc-950">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
            >
              <CheckCircle2Icon className="size-5" />
              Place order
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Checkout;
