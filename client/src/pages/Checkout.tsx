import { ArrowLeftIcon, ShoppingBasketIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckOutAddress } from "../components/CheckOut/CheckOutAddress";
import { CheckoutPayment } from "../components/CheckOut/CheckoutPayment";
import { CheckoutReview } from "../components/CheckOut/CheckoutReview";
import EmptyState from "../components/ui/EmptyState";
import { getApiErrorMessage } from "../config/api";
import { useAppContext } from "../context/AppContext";
import { couponService } from "../services/couponService";
import {
  getPaymentMethods,
  paymentMethods as defaultPaymentMethods,
  type PaymentMethod,
  type PaymentMethodId,
} from "../services/paymentService";

const Checkout = () => {
  const {
    addresses,
    cartItems,
    deliveryFee,
    deliveryWindows,
    placeOrder,
    subtotal,
  } = useAppContext();
  const navigate = useNavigate();
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? addresses[0],
    [addresses],
  );
  const [manualAddressId, setManualAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cash");
  const [availablePaymentMethods, setAvailablePaymentMethods] =
    useState<PaymentMethod[]>(defaultPaymentMethods);
  const [deliveryWindow, setDeliveryWindow] = useState(deliveryWindows[0]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const selectedAddressId = manualAddressId || defaultAddress?.id || "";
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const displayDeliveryFee = discountedSubtotal === 0 || discountedSubtotal >= 1500 ? 0 : deliveryFee;
  const displayTax = Math.round(discountedSubtotal * 0.13);
  const displayTotal = discountedSubtotal + displayDeliveryFee + displayTax;

  useEffect(() => {
    setCouponDiscount(0);
  }, [subtotal, couponCode]);

  useEffect(() => {
    let active = true;

    void getPaymentMethods()
      .then((methods) => {
        if (!active) return;
        setAvailablePaymentMethods(methods);

        const selected = methods.find((method) => method.id === paymentMethod);
        if (selected && !selected.enabled) {
          setPaymentMethod("cash");
          toast.error(`${selected.label} is unavailable. Cash on Delivery has been selected.`);
        }
      })
      .catch(() => {
        if (active) setAvailablePaymentMethods(defaultPaymentMethods);
      });

    return () => {
      active = false;
    };
  }, [paymentMethod]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Enter a coupon code");
      return;
    }

    setCouponLoading(true);
    try {
      const result = await couponService.validateCoupon(couponCode, subtotal);
      setCouponDiscount(result.discount);
      toast.success(`${result.coupon?.code ?? couponCode} applied`);
    } catch (error) {
      setCouponDiscount(0);
      toast.error(getApiErrorMessage(error, "Coupon could not be applied"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please add a delivery address");
      return;
    }

    setPlacingOrder(true);
    try {
      const result = await placeOrder(
        selectedAddressId,
        paymentMethod,
        deliveryWindow,
        couponDiscount > 0 ? couponCode : undefined,
      );
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
              paymentMethods={availablePaymentMethods}
              selectedDeliveryWindow={deliveryWindow}
              selectedPaymentMethod={paymentMethod}
              onSelectDeliveryWindow={setDeliveryWindow}
              onSelectPaymentMethod={setPaymentMethod}
            />
          </div>

          <CheckoutReview
            cartItems={cartItems}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            couponLoading={couponLoading}
            deliveryFee={displayDeliveryFee}
            loading={placingOrder}
            subtotal={subtotal}
            tax={displayTax}
            total={displayTotal}
            disabled={!selectedAddressId}
            onApplyCoupon={() => void handleApplyCoupon()}
            onCouponCodeChange={setCouponCode}
            onPlaceOrder={() => void handlePlaceOrder()}
          />
        </div>
      </section>
    </div>
  );
};

export default Checkout;
