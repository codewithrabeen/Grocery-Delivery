import { FilterIcon, PackageSearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { getApiErrorMessage } from "../config/api";
import { categories } from "../lib/categories";
import { productService } from "../services/productService";
import type { AvailabilityFilter, Product, ProductSort } from "../types";

const DEFAULT_MAX_PRICE = 2000;

const readNumberParam = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") ?? "all",
      minPrice: readNumberParam(searchParams.get("minPrice"), 0),
      maxPrice: readNumberParam(searchParams.get("maxPrice"), DEFAULT_MAX_PRICE),
      availability: (searchParams.get("availability") ?? "all") as AvailabilityFilter,
      minRating: readNumberParam(searchParams.get("rating"), 0),
      sort: (searchParams.get("sort") ?? "popular") as ProductSort,
    }),
    [searchParams],
  );

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void productService
        .getProducts(filters)
        .then((nextProducts) => {
          if (active) setProducts(nextProducts);
        })
        .catch((requestError: unknown) => {
          if (active) setError(getApiErrorMessage(requestError, "Could not load products"));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [filters]);

  const updateFilter = (key: string, value: string | number) => {
    const next = new URLSearchParams(searchParams);
    const stringValue = String(value);

    if (
      stringValue === "all" ||
      stringValue === "popular" ||
      stringValue === "0" ||
      (key === "maxPrice" && stringValue === String(DEFAULT_MAX_PRICE))
    ) {
      next.delete(key);
    } else {
      next.set(key, stringValue);
    }

    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Grocery catalog</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-950">Products</h1>
              <p className="mt-2 max-w-2xl text-zinc-500">
                Browse fresh produce, pantry staples, dairy, snacks, drinks, and household
                essentials with live stock from the backend.
              </p>
            </div>

            <label className="flex w-full items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 sm:w-auto">
              <SlidersHorizontalIcon className="size-4 text-app-green" aria-hidden="true" />
              <span className="sr-only">Sort products</span>
              <select
                value={filters.sort}
                onChange={(event) => updateFilter("sort", event.target.value)}
                className="w-full bg-transparent font-medium text-zinc-800 outline-none sm:w-44"
              >
                <option value="popular">Most popular</option>
                <option value="best-selling">Best selling</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
              <FilterIcon className="size-4 text-app-green" aria-hidden="true" />
              Filters
            </h2>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-app-green hover:text-app-green-light focus:outline-none focus:text-app-green-light"
            >
              Reset
            </button>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Category</span>
              <select
                value={filters.category}
                onChange={(event) => updateFilter("category", event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Min price</span>
                <input
                  type="number"
                  min={0}
                  value={filters.minPrice}
                  onChange={(event) => updateFilter("minPrice", event.target.value || 0)}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Max price</span>
                <input
                  type="number"
                  min={0}
                  value={filters.maxPrice}
                  onChange={(event) =>
                    updateFilter("maxPrice", event.target.value || DEFAULT_MAX_PRICE)
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Availability</span>
              <select
                value={filters.availability}
                onChange={(event) => updateFilter("availability", event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value="all">All products</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Minimum rating</span>
              <select
                value={filters.minRating}
                onChange={(event) => updateFilter("rating", event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-app-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value={0}>Any rating</option>
                <option value={4}>4 stars and up</option>
                <option value={4.5}>4.5 stars and up</option>
              </select>
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              {loading ? "Loading products..." : `${products.length} products found`}
            </p>
            <p className="text-sm text-zinc-500">Delivery from Naxal hub</p>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearchIcon}
              title="No products found"
              description="Try removing a filter or changing your price range."
              actionLabel="Clear filters"
              actionTo="/products"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} showCategory />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;
