import {
  ArrowLeftIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";
import { getCategoryName } from "../data/nepalStore";
import { formatPrice } from "../lib/format";

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart, cartQuantities, products, updateCartQuantity } = useAppContext();
  const product = products.find((item) => item._id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-app-cream px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-950">Product not found</h1>
        <p className="mt-2 text-zinc-500">This grocery item is not available in the catalog.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const quantity = cartQuantities[product._id] ?? 0;
  const relatedProducts = products
    .filter((item) => item.category === product.category && item._id !== product._id)
    .slice(0, 4);

  return (
    <div className="bg-app-cream">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-app-green"
        >
          <ArrowLeftIcon className="size-4" />
          Back to products
        </Link>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-zinc-50 p-8">
              <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
              {product.discount > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-app-orange px-3 py-1.5 text-sm font-semibold text-white">
                  {product.discount}% off
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:p-8">
            <p className="text-sm font-semibold text-app-orange">{getCategoryName(product.category)}</p>
            <h1 className="mt-3 text-3xl font-bold text-zinc-950 sm:text-4xl">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-amber-500">
                <StarIcon className="size-5 fill-current" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-zinc-400">({product.reviewCount} reviews)</span>
              </div>
              {product.isOrganic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  <LeafIcon className="size-4" />
                  Organic
                </span>
              )}
            </div>

            <p className="mt-5 text-base leading-7 text-zinc-600">{product.description}</p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-bold text-app-green">{formatPrice(product.price)}</span>
              <span className="pb-1 text-lg text-zinc-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="pb-1 text-sm text-zinc-500">per {product.unit}</span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 p-4">
                <TruckIcon className="mb-3 size-5 text-app-green" />
                <p className="text-sm font-semibold text-zinc-950">Fast delivery</p>
                <p className="mt-1 text-xs text-zinc-500">30-45 min in core areas</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <ShieldCheckIcon className="mb-3 size-5 text-app-green" />
                <p className="text-sm font-semibold text-zinc-950">Quality checked</p>
                <p className="mt-1 text-xs text-zinc-500">Packed at Naxal hub</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <ShoppingCartIcon className="mb-3 size-5 text-app-green" />
                <p className="text-sm font-semibold text-zinc-950">Stock</p>
                <p className="mt-1 text-xs text-zinc-500">{product.stock} units available</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {quantity > 0 ? (
                <div className="flex h-12 w-full items-center justify-between rounded-full border border-app-green/20 bg-green-50 px-2 sm:w-44">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(product._id, quantity - 1)}
                    className="flex size-10 items-center justify-center rounded-full text-app-green hover:bg-white"
                    aria-label={`Decrease ${product.name}`}
                  >
                    <MinusIcon className="size-4" />
                  </button>
                  <span className="font-semibold text-app-green">{quantity}</span>
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-app-green px-6 text-sm font-semibold text-white hover:bg-app-green-light"
                >
                  <ShoppingCartIcon className="size-5" />
                  Add to basket
                </button>
              )}
              <Link
                to="/checkout"
                className="inline-flex h-12 items-center justify-center rounded-full border border-app-green px-6 text-sm font-semibold text-app-green hover:bg-green-50"
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
              <ProductCard key={item._id} product={item} showCategory />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;

