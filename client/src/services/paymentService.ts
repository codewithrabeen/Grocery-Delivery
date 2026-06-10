import type { CreateOrderPayload } from "./orderService";

export type PaymentMethodId = "cash" | "stripe" | "esewa" | "khalti";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
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
    description: "Wallet structure ready for provider credentials.",
    enabled: false,
  },
  {
    id: "khalti",
    label: "Khalti",
    description: "Wallet structure ready for provider credentials.",
    enabled: false,
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
