import { CheckCircle2Icon, TagIcon } from "lucide-react";
import LoadingButton from "../ui/LoadingButton";
import { formatPrice } from "../../lib/format";
import type { CartItem } from "../../types";

type CheckoutReviewProps = {
  cartItems: CartItem[];
  couponCode: string;
  couponDiscount: number;
  deliveryFee: number;
  loading: boolean;
  couponLoading?: boolean;
  subtotal: number;
  tax: number;
  total: number;
  disabled?: boolean;
  onApplyCoupon: () => void;
  onCouponCodeChange: (value: string) => void;
  onPlaceOrder: () => void;
};

export const CheckoutReview = ({
  cartItems,
  couponCode,
  couponDiscount,
  deliveryFee,
  loading,
  couponLoading = false,
  subtotal,
  tax,
  total,
  disabled = false,
  onApplyCoupon,
  onCouponCodeChange,
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

    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <label className="block text-sm font-semibold text-zinc-700" htmlFor="coupon-code">
        Coupon
      </label>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          id="coupon-code"
          type="text"
          value={couponCode}
          onChange={(event) => onCouponCodeChange(event.target.value.toUpperCase())}
          placeholder="SAVE10"
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-app-green focus:outline-none focus:ring-2 focus:ring-green-100"
        />
        <LoadingButton
          type="button"
          loading={couponLoading}
          onClick={onApplyCoupon}
          className="h-11 px-4 py-0"
        >
          <TagIcon className="size-4" aria-hidden="true" />
          Apply
        </LoadingButton>
      </div>
    </div>

    <div className="mt-6 space-y-3 border-t border-zinc-200 pt-5 text-sm">
      <div className="flex justify-between text-zinc-600">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {couponDiscount > 0 && (
        <div className="flex justify-between text-green-700">
          <span>Coupon discount</span>
          <span>-{formatPrice(couponDiscount)}</span>
        </div>
      )}
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
