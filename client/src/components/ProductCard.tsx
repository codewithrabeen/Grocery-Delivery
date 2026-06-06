import {
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  StarIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryName } from "../data/nepalStore";
import { useAppContext } from "../context/AppContext";
import { formatPrice } from "../lib/format";
import type { Product } from "../types";

type ProductCardProps = {
  product: Product;
  showCategory?: boolean;
};

const ProductCard = ({ product, showCategory = false }: ProductCardProps) => {
  const { addToCart, cartQuantities, updateCartQuantity } = useAppContext();
  const quantity = cartQuantities[product._id] ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        to={`/products/${product._id}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-50 p-5"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
        />

        {product.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-app-orange px-2.5 py-1 text-xs font-semibold text-white shadow">
            {product.discount}% off
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {showCategory && (
            <p className="mb-1 text-xs font-medium uppercase text-app-orange">
              {getCategoryName(product.category)}
            </p>
          )}

          <Link
            to={`/products/${product._id}`}
            className="line-clamp-2 text-base font-semibold text-zinc-900 hover:text-app-green"
          >
            {product.name}
          </Link>

          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <StarIcon className="size-4 fill-current" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-zinc-400">({product.reviewCount})</span>
            </div>

            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-app-green">{formatPrice(product.price)}</span>
              <span className="text-sm text-zinc-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            </div>
          </div>

          {quantity > 0 ? (
            <div className="flex h-10 items-center rounded-full border border-app-green/20 bg-green-50">
              <button
                type="button"
                onClick={() => updateCartQuantity(product._id, quantity - 1)}
                className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white"
                aria-label={`Decrease ${product.name}`}
              >
                <MinusIcon className="size-4" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold text-app-green">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => updateCartQuantity(product._id, quantity + 1)}
                className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white"
                aria-label={`Increase ${product.name}`}
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product._id)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-app-green text-white shadow-sm hover:bg-app-green-light"
              aria-label={`Add ${product.name} to basket`}
            >
              <ShoppingCartIcon className="size-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{product.unit}</span>
          {product.isOrganic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
              <LeafIcon className="size-3" />
              Organic
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
