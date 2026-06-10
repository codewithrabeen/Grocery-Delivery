import { CheckCircle2Icon } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";
import { formatPrice } from "../../lib/format";
import type { CartItem } from "../../types";

type CheckoutReviewProps = {
  cartItems: CartItem[];
  deliveryFee: number;
  loading: boolean;
  subtotal: number;
  tax: number;
  total: number;
  disabled?: boolean;
  onPlaceOrder: () => void;
};

export const CheckoutReview = ({
  cartItems,
  deliveryFee,
  loading,
  subtotal,
  tax,
  total,
  disabled = false,
  onPlaceOrder,
}: CheckoutReviewProps) => (
  <aside className="h-fit rounded-lg bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-bold text-zinc-950">Order summary</h2>

    <div className="mt-5 space-y-4">
      {cartItems.map(({ product, quantity }) => (
        <div key={product.id} className="flex gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="size-16 rounded-lg bg-zinc-50 object-contain p-2"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-950">{product.name}</p>
            <p className="text-sm text-zinc-500">
              {quantity} x {formatPrice(product.price)}
            </p>
          </div>
          <p className="font-semibold text-zinc-950">{formatPrice(product.price * quantity)}</p>
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

    <LoadingButton
      type="button"
      loading={loading}
      disabled={disabled}
      onClick={onPlaceOrder}
      className="mt-6 w-full"
    >
      <CheckCircle2Icon className="size-5" aria-hidden="true" />
      Place order
    </LoadingButton>
  </aside>
);
