import { RefreshCwIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../config/api";
import { orderService } from "../services/orderService";

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const provider = searchParams.get("provider") ?? "online";
  const reason = searchParams.get("reason") ?? "The payment was cancelled or could not be verified.";
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!orderId) {
      toast.error("Order id is missing. Please return to checkout.");
      return;
    }

    setRetrying(true);
    try {
      const result = await orderService.retryPayment(orderId);
      if (result.type === "redirect") {
        window.location.assign(result.url);
        return;
      }
      toast.success("Payment retry completed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not retry payment"));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-cream px-4 py-20">
      <section className="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircleIcon className="size-8" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-zinc-950">Payment failed</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
          {provider} payment needs attention. {reason}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={retrying || !orderId}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light disabled:cursor-not-allowed disabled:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
          >
            <RefreshCwIcon className={`size-4 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
            Retry payment
          </button>
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-full border border-app-green px-5 py-3 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
          >
            Back to checkout
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
          >
            View orders
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PaymentFailure;
