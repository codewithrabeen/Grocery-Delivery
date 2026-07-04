import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../config/api";
import { useAppContext } from "../context/AppContext";
import { orderService } from "../services/orderService";

type PaymentState =
  | { status: "loading"; message: string }
  | { status: "success"; message: string; orderId: string }
  | { status: "error"; message: string; orderId?: string };

const providerLabels: Record<string, string> = {
  stripe: "card",
  khalti: "Khalti",
  esewa: "eSewa",
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, refreshOrder, refreshOrders } = useAppContext();
  const provider = (searchParams.get("provider") || "stripe").toLowerCase();
  const orderId = searchParams.get("orderId") ?? searchParams.get("purchase_order_id") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";
  const pidx = searchParams.get("pidx") ?? "";
  const transactionUuid = searchParams.get("transaction_uuid") ?? "";
  const dataPayload = searchParams.get("data") ?? undefined;
  const verified = ["1", "true"].includes((searchParams.get("verified") || "").toLowerCase());
  const [state, setState] = useState<PaymentState>({
    status: "loading",
    message: `Confirming your ${providerLabels[provider] ?? "online"} payment...`,
  });

  useEffect(() => {
    let active = true;

    const confirmPayment = async () => {
      if (!orderId && provider !== "esewa") {
        throw new Error("Payment returned without an order id.");
      }

      if (verified && orderId) {
        const order = await refreshOrder(orderId);
        if (!order) throw new Error("Payment was verified, but the order could not be loaded.");
        return order;
      }

      if (provider === "stripe") {
        if (!sessionId) throw new Error("Stripe returned without a session id.");
        return orderService.confirmStripePayment(orderId, sessionId);
      }

      if (provider === "khalti") {
        if (!pidx) throw new Error("Khalti returned without a pidx.");
        return orderService.verifyKhaltiPayment(orderId, pidx);
      }

      if (provider === "esewa") {
        if (transactionUuid) {
          return orderService.verifyEsewaPayment(transactionUuid, dataPayload);
        }

        if (orderId) {
          const order = await refreshOrder(orderId);
          if (!order) throw new Error("Could not load the eSewa order.");
          return order;
        }
      }

      throw new Error("Unsupported payment provider.");
    };

    void confirmPayment()
      .then((order) => {
        if (!active) return;
        clearCart();
        void refreshOrders();
        setState({
          status: "success",
          message: "Payment confirmed. Your order is ready to track.",
          orderId: order.id,
        });

        window.setTimeout(() => {
          navigate(`/orders/${order.id}`, { replace: true });
        }, 1200);
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: "error",
          message: getApiErrorMessage(error, "Could not confirm your payment"),
          orderId,
        });
      });

    return () => {
      active = false;
    };
  }, [
    clearCart,
    dataPayload,
    navigate,
    orderId,
    pidx,
    provider,
    refreshOrder,
    refreshOrders,
    sessionId,
    transactionUuid,
    verified,
  ]);

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";
  const Icon = isLoading ? Loader2Icon : isSuccess ? CheckCircle2Icon : XCircleIcon;

  return (
    <div className="min-h-screen bg-app-cream px-4 py-20">
      <section className="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-700"
              : state.status === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-50 text-app-green"
          }`}
        >
          <Icon className={`size-8 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-zinc-950">
          {isLoading ? "Confirming payment" : isSuccess ? "Payment complete" : "Payment needs attention"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">{state.message}</p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {isSuccess ? (
            <Link
              to={`/orders/${state.orderId}`}
              className="inline-flex items-center justify-center rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
            >
              Track order
            </Link>
          ) : (
            <Link
              to={
                state.status === "error" && state.orderId
                  ? `/payment/failure?orderId=${state.orderId}&provider=${provider}`
                  : "/checkout"
              }
              className="inline-flex items-center justify-center rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
            >
              Review payment
            </Link>
          )}
          <Link
            to="/orders"
            className="inline-flex items-center justify-center rounded-full border border-app-green px-5 py-3 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
          >
            View orders
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PaymentSuccess;
