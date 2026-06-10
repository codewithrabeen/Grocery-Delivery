import { ArrowLeftIcon, ShoppingBasketIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckOutAddress } from "../components/CheckOut/CheckOutAddress";
import { CheckoutPayment } from "../components/CheckOut/CheckoutPayment";
import { CheckoutReview } from "../components/CheckOut/CheckoutReview";
import EmptyState from "../components/ui/EmptyState";
import { useAppContext } from "../context/AppContext";
import type { PaymentMethodId } from "../services/paymentService";

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
  const [manualAddressId, setManualAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cash");
  const [deliveryWindow, setDeliveryWindow] = useState(deliveryWindows[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const selectedAddressId = manualAddressId || defaultAddress?.id || "";

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please add a delivery address");
      return;
    }

    setPlacingOrder(true);
    try {
      const result = await placeOrder(selectedAddressId, paymentMethod, deliveryWindow);
      if (!result) return;

      if (result.type === "redirect") {
        window.location.assign(result.url);
        return;
      }

      navigate(`/orders/${result.order.id}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            icon={ShoppingBasketIcon}
            title="Your basket is empty"
            description="Add groceries before opening checkout."
            actionLabel="Shop products"
            actionTo="/products"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-app-green focus:outline-none focus:text-app-green"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Continue shopping
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <CheckOutAddress
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setManualAddressId}
            />
            <CheckoutPayment
              deliveryWindows={deliveryWindows}
              selectedDeliveryWindow={deliveryWindow}
              selectedPaymentMethod={paymentMethod}
              onSelectDeliveryWindow={setDeliveryWindow}
              onSelectPaymentMethod={setPaymentMethod}
            />
          </div>

          <CheckoutReview
            cartItems={cartItems}
            deliveryFee={deliveryFee}
            loading={placingOrder}
            subtotal={subtotal}
            tax={tax}
            total={total}
            disabled={!selectedAddressId}
            onPlaceOrder={() => void handlePlaceOrder()}
          />
        </div>
      </section>
    </div>
  );
};

export default Checkout;
