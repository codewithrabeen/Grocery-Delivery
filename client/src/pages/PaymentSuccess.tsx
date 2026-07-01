import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../config/api";
import { useAppContext } from "../context/AppContext";
import { orderService } from "../services/orderService";

type PaymentState =
  | { status: "loading"; message: string }
  | { status: "success"; message: string; orderId: string }
  | { status: "error"; message: string };

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, refreshOrders } = useAppContext();
  const orderId = searchParams.get("orderId") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";
  const [state, setState] = useState<PaymentState>({
    status: "loading",
    message: "Confirming your card payment...",
  });

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      if (!orderId || !sessionId) {
        setState({
          status: "error",
          message: "Payment returned without the details needed to confirm your order.",
        });
        return;
      }

      void orderService
        .confirmStripePayment(orderId, sessionId)
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
            message: getApiErrorMessage(error, "Could not confirm your card payment"),
          });
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [clearCart, navigate, orderId, refreshOrders, sessionId]);

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";
  const Icon = isLoading ? Loader2Icon : isSuccess ? CheckCircle2Icon : XCircleIcon;

  return (
    <div className="min-h-screen bg-app-cream px-4 py-20">
      <section className="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ${
            isSuccess ? "bg-green-100 text-green-700" : state.status === "error" ? "bg-red-100 text-red-600" : "bg-green-50 text-app-green"
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
              to="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
            >
              Back to checkout
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
