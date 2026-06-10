import {
  ArrowLeftIcon,
  HeartIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ErrorState from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { getApiErrorMessage } from "../config/api";
import { useAppContext } from "../context/AppContext";
import { getCategoryName } from "../lib/categories";
import { formatPrice } from "../lib/format";
import { productService } from "../services/productService";
import type { Product } from "../types";

const ProductPage = () => {
  const { id } = useParams();
  const {
    addToCart,
    cartQuantities,
    isWishlisted,
    productLoading,
    products,
    toggleWishlist,
    updateCartQuantity,
  } = useAppContext();
  const cachedProduct = useMemo(() => products.find((item) => item.id === id) ?? null, [id, products]);
  const [remoteState, setRemoteState] = useState<{
    error: string | null;
    loading: boolean;
    product: Product | null;
    productId: string | null;
  }>({
    error: null,
    loading: false,
    product: null,
    productId: null,
  });

  useEffect(() => {
    if (!id || cachedProduct || productLoading) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setRemoteState({ error: null, loading: true, product: null, productId: id });
      void productService
        .getProductById(id)
        .then((nextProduct) => {
          if (active) {
            setRemoteState({ error: null, loading: false, product: nextProduct, productId: id });
          }
        })
        .catch((requestError: unknown) => {
          if (active) {
            setRemoteState({
              error: getApiErrorMessage(requestError, "Could not load product"),
              loading: false,
              product: null,
              productId: id,
            });
          }
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cachedProduct, id, productLoading]);

  const product = cachedProduct ?? (remoteState.productId === id ? remoteState.product : null);
  const loading =
    productLoading ||
    (!cachedProduct && Boolean(id) && (remoteState.productId !== id || remoteState.loading));
  const error = cachedProduct || remoteState.productId !== id ? null : remoteState.error;

  const relatedProducts = useMemo(
    () =>
      product
        ? products
            .filter((item) => item.category === product.category && item.id !== product.id)
            .slice(0, 4)
        : [],
    [product, products],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-app-cream">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-36" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Skeleton className="aspect-square w-full" />
            <div className="rounded-lg bg-white p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-10 w-3/4" />
              <Skeleton className="mt-6 h-24 w-full" />
              <Skeleton className="mt-6 h-12 w-48" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-950">Product not found</h1>
        <p className="mt-2 text-zinc-500">This grocery item is not available in the catalog.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const quantity = cartQuantities[product.id] ?? 0;
  const saved = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  return (
    <div className="bg-app-cream">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-app-green focus:outline-none focus:text-app-green"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to products
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="relative flex aspect-square items-center justify-center rounded-lg bg-zinc-50 p-8">
              <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
              {product.discount > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-app-orange px-3 py-1.5 text-sm font-semibold text-white">
                  {product.discount}% off
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-app-orange">
                  {getCategoryName(product.category)}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-zinc-950 sm:text-4xl">
                  {product.name}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => void toggleWishlist(product.id)}
                className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-app-green ${
                  saved ? "bg-red-50 text-red-500" : "text-zinc-500 hover:text-red-500"
                }`}
                aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name}`}
              >
                <HeartIcon className={`size-5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-amber-500">
                <StarIcon className="size-5 fill-current" aria-hidden="true" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-zinc-400">({product.reviewCount} reviews)</span>
              </div>
              {product.isOrganic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  <LeafIcon className="size-4" aria-hidden="true" />
                  Organic
                </span>
              )}
            </div>

            <p className="mt-5 text-base leading-7 text-zinc-600">{product.description}</p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-bold text-app-green">{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="pb-1 text-lg text-zinc-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              <span className="pb-1 text-sm text-zinc-500">per {product.unit}</span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-4">
                <TruckIcon className="mb-3 size-5 text-app-green" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-950">Fast delivery</p>
                <p className="mt-1 text-xs text-zinc-500">30-45 min in core areas</p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <ShieldCheckIcon className="mb-3 size-5 text-app-green" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-950">Quality checked</p>
                <p className="mt-1 text-xs text-zinc-500">Packed at Naxal hub</p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-4">
                <ShoppingCartIcon className="mb-3 size-5 text-app-green" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-950">Stock</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {outOfStock ? "Currently unavailable" : `${product.stock} units available`}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {quantity > 0 ? (
                <div className="flex h-12 w-full items-center justify-between rounded-full border border-app-green/20 bg-green-50 px-2 sm:w-44">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(product.id, quantity - 1)}
                    className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white focus:outline-none focus:ring-2 focus:ring-app-green"
                    aria-label={`Decrease ${product.name}`}
                  >
                    <MinusIcon className="size-4" aria-hidden="true" />
                  </button>
                  <span className="font-semibold text-app-green">{quantity}</span>
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-app-green px-6 text-sm font-semibold text-white hover:bg-app-green-light disabled:cursor-not-allowed disabled:bg-zinc-300 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
                >
                  <ShoppingCartIcon className="size-5" aria-hidden="true" />
                  {outOfStock ? "Out of stock" : "Add to cart"}
                </button>
              )}
              <Link
                to="/checkout"
                className="inline-flex h-12 items-center justify-center rounded-full border border-app-green px-6 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-app-orange">Related products</p>
              <h2 className="mt-2 text-3xl font-bold text-zinc-950">You may also like</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} showCategory />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
