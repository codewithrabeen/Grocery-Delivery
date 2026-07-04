import api from "../config/api";
import type { CreateOrderPayload } from "./orderService";

export type PaymentMethodId = "cash" | "stripe" | "esewa" | "khalti";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
  reason?: string;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cash",
    label: "Cash on Delivery",
    description: "Pay the rider after delivery.",
    enabled: true,
  },
  {
    id: "stripe",
    label: "Stripe Card",
    description: "Secure hosted card checkout.",
    enabled: true,
  },
  {
    id: "esewa",
    label: "eSewa",
    description: "Pay with eSewa ePayment.",
    enabled: true,
  },
  {
    id: "khalti",
    label: "Khalti",
    description: "Pay with Khalti wallet.",
    enabled: false,
    reason: "Checking Khalti configuration.",
  },
];

export const toBackendPaymentMethod = (method: PaymentMethodId) => {
  if (method === "stripe") return "card";
  return method;
};

export const createPaymentPayload = (
  payload: Omit<CreateOrderPayload, "paymentMethod">,
  method: PaymentMethodId,
): CreateOrderPayload => ({
  ...payload,
  paymentMethod: toBackendPaymentMethod(method),
});

type PaymentMethodsResponse = {
  methods?: Array<{
    id: PaymentMethodId;
    enabled: boolean;
    reason?: string;
  }>;
};

export const getPaymentMethods = async () => {
  const { data } = await api.get<PaymentMethodsResponse>("/payments/methods");
  const availability = new Map((data.methods ?? []).map((method) => [method.id, method]));

  return paymentMethods.map((method) => {
    const next = availability.get(method.id);
    return next
      ? {
          ...method,
          enabled: next.enabled,
          reason: next.reason,
          description: next.enabled ? method.description : next.reason ?? method.description,
        }
      : method;
  });
};
