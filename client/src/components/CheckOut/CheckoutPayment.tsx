import { ClockIcon, WalletIcon } from "lucide-react";
import { paymentMethods, type PaymentMethodId } from "../../services/paymentService";

type CheckoutPaymentProps = {
  deliveryWindows: string[];
  selectedDeliveryWindow: string;
  selectedPaymentMethod: PaymentMethodId;
  onSelectDeliveryWindow: (slot: string) => void;
  onSelectPaymentMethod: (method: PaymentMethodId) => void;
};

export const CheckoutPayment = ({
  deliveryWindows,
  selectedDeliveryWindow,
  selectedPaymentMethod,
  onSelectDeliveryWindow,
  onSelectPaymentMethod,
}: CheckoutPaymentProps) => (
  <>
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-app-orange">Step 2</p>
      <h2 className="mt-1 text-2xl font-bold text-zinc-950">Delivery time</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {deliveryWindows.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onSelectDeliveryWindow(slot)}
            className={`rounded-lg border px-4 py-4 text-left text-sm font-semibold ${
              selectedDeliveryWindow === slot
                ? "border-app-green bg-green-50 text-app-green"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-app-green/50"
            } focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2`}
          >
            <ClockIcon className="mb-3 size-5" aria-hidden="true" />
            {slot}
          </button>
        ))}
      </div>
    </section>

    <section className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-app-orange">Step 3</p>
      <h2 className="mt-1 text-2xl font-bold text-zinc-950">Payment method</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => method.enabled && onSelectPaymentMethod(method.id)}
            disabled={!method.enabled}
            className={`rounded-lg border px-4 py-4 text-left text-sm font-semibold ${
              selectedPaymentMethod === method.id
                ? "border-app-green bg-green-50 text-app-green"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-app-green/50"
            } disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2`}
          >
            <WalletIcon className="mb-3 size-5" aria-hidden="true" />
            <span className="block">{method.label}</span>
            <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">
              {method.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  </>
);
