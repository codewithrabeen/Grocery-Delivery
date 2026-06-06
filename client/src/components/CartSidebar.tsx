import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { formatPrice } from "../lib/format";

const CartSidebar = () => {
  const {
    cartItems,
    deliveryFee,
    isCartOpen,
    removeFromCart,
    setIsCartOpen,
    subtotal,
    tax,
    total,
    updateCartQuantity,
  } = useAppContext();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40"
        onClick={() => setIsCartOpen(false)}
        aria-label="Close basket"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-sm text-zinc-500">Your basket</p>
            <h2 className="text-xl font-semibold text-zinc-950">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex size-10 items-center justify-center rounded-full hover:bg-zinc-100"
            aria-label="Close basket"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-green-50 text-app-green">
              <ShoppingBagIcon className="size-10" />
            </div>
            <h3 className="text-2xl font-semibold text-zinc-950">Basket is empty</h3>
            <p className="mt-2 text-zinc-500">
              Add fresh Nepali groceries and they will appear here.
            </p>
            <Link
              to="/products"
              onClick={() => setIsCartOpen(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
            >
              Browse products
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {cartItems.map(({ product, quantity }) => (
                <div
                  key={product._id}
                  className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-20 rounded-xl bg-zinc-50 object-contain p-2"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-zinc-950">{product.name}</h3>
                        <p className="text-sm text-zinc-500">{product.unit}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product._id)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex h-9 items-center rounded-full border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product._id, quantity - 1)}
                          className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-100"
                          aria-label={`Decrease ${product.name}`}
                        >
                          <MinusIcon className="size-4" />
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product._id, quantity + 1)}
                          className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-100"
                          aria-label={`Increase ${product.name}`}
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                      <p className="font-semibold text-app-green">
                        {formatPrice(product.price * quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 px-5 py-5">
              <div className="space-y-3 text-sm">
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
                <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-950">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
              >
                Checkout
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartSidebar;

