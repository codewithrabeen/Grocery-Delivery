import { Clock3Icon, FlameIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";
import ErrorState from "../components/ui/ErrorState";
import { ProductGridSkeleton } from "../components/ui/Skeleton";

const FlashDeals = () => {
  const { productError, productLoading, products, refreshProducts } = useAppContext();
  const deals = [...products]
    .filter((product) => product.discount > 0 && product.stock > 0)
    .sort((a, b) => b.discount - a.discount);
  const topDeals = deals.slice(0, 12);

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="bg-green-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <FlameIcon className="size-4 text-orange-300" />
                Flash deals
              </p>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                Save more on everyday Nepali groceries.
              </h1>
              <p className="mt-4 max-w-2xl text-white/75">
                Limited-time discounts on staples, snacks, dairy, produce, and household items.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
              <div className="rounded-2xl bg-white/10 p-4">
                <Clock3Icon className="mb-3 size-5 text-orange-200" />
                <p className="text-sm font-semibold">Daily refresh</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <TruckIcon className="mb-3 size-5 text-orange-200" />
                <p className="text-sm font-semibold">Free over Rs. 1,500</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <ShieldCheckIcon className="mb-3 size-5 text-orange-200" />
                <p className="text-sm font-semibold">Quality checked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {productLoading ? (
          <ProductGridSkeleton count={8} />
        ) : productError ? (
          <ErrorState message={productError} onRetry={() => void refreshProducts()} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topDeals.map((product) => (
              <ProductCard key={product.id} product={product} showCategory />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FlashDeals;
