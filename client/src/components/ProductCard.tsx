import {
  HeartIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  StarIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getCategoryName } from "../lib/categories";
import { formatPrice } from "../lib/format";
import type { Product } from "../types";

type ProductCardProps = {
  product: Product;
  showCategory?: boolean;
};

const ProductCard = ({ product, showCategory = false }: ProductCardProps) => {
  const { addToCart, cartQuantities, isWishlisted, toggleWishlist, updateCartQuantity } =
    useAppContext();
  const quantity = cartQuantities[product.id] ?? 0;
  const outOfStock = product.stock <= 0;
  const saved = isWishlisted(product.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <Link
          to={`/products/${product.id}`}
          className="relative flex aspect-square items-center justify-center overflow-hidden bg-zinc-50 p-5 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-inset"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
          />

          {product.discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-app-orange px-2.5 py-1 text-xs font-semibold text-white shadow">
              {product.discount}% off
            </span>
          )}

          {outOfStock && (
            <span className="absolute bottom-3 left-3 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => void toggleWishlist(product.id)}
          className={`absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-app-green ${
            saved ? "text-red-500" : "text-zinc-500 hover:text-red-500"
          }`}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
        >
          <HeartIcon className={`size-5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          {showCategory && (
            <p className="mb-1 text-xs font-medium uppercase text-app-orange">
              {getCategoryName(product.category)}
            </p>
          )}

          <Link
            to={`/products/${product.id}`}
            className="line-clamp-2 text-base font-semibold text-zinc-900 hover:text-app-green focus:outline-none focus:text-app-green"
          >
            {product.name}
          </Link>

          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <StarIcon className="size-4 fill-current" aria-hidden="true" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-zinc-400">({product.reviewCount})</span>
            </div>

            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-app-green">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-zinc-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {quantity > 0 ? (
            <div className="flex h-10 items-center rounded-full border border-app-green/20 bg-green-50">
              <button
                type="button"
                onClick={() => updateCartQuantity(product.id, quantity - 1)}
                className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white focus:outline-none focus:ring-2 focus:ring-app-green"
                aria-label={`Decrease ${product.name}`}
              >
                <MinusIcon className="size-4" aria-hidden="true" />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold text-app-green">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => updateCartQuantity(product.id, quantity + 1)}
                className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white focus:outline-none focus:ring-2 focus:ring-app-green"
                aria-label={`Increase ${product.name}`}
                disabled={quantity >= product.stock}
              >
                <PlusIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product.id)}
              disabled={outOfStock}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-app-green text-white shadow-sm hover:bg-app-green-light disabled:cursor-not-allowed disabled:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCartIcon className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{product.unit}</span>
          {product.isOrganic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
              <LeafIcon className="size-3" aria-hidden="true" />
              Organic
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{product.stock} left</span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
