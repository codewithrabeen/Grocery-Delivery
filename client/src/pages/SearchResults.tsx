import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { ProductGridSkeleton } from "../components/ui/Skeleton";
import { getApiErrorMessage } from "../config/api";
import { normalizeText } from "../lib/format";
import { readJsonStorage, writeJsonStorage } from "../lib/storage";
import { productService } from "../services/productService";
import type { Product } from "../types";

const RECENT_SEARCHES_KEY = "quickbasket:recent-searches";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const normalizedQuery = normalizeText(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readJsonStorage<string[]>(RECENT_SEARCHES_KEY, []),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!normalizedQuery) {
        setProducts([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      void productService
        .getProducts({ search: normalizedQuery })
        .then((results) => {
          setProducts(results);
          setRecentSearches((current) => {
            const next = [query, ...current.filter((item) => normalizeText(item) !== normalizedQuery)].slice(
              0,
              6,
            );
            writeJsonStorage(RECENT_SEARCHES_KEY, next);
            return next;
          });
        })
        .catch((requestError: unknown) => {
          setError(getApiErrorMessage(requestError, "Could not search products"));
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [normalizedQuery, query]);

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-app-orange">
            <SearchIcon className="size-4" aria-hidden="true" />
            Search
          </div>
          <h1 className="mt-3 text-4xl font-bold text-zinc-950">
            {query ? `Results for "${query}"` : "Search groceries"}
          </h1>
          <p className="mt-2 text-zinc-500">
            {query
              ? loading
                ? "Searching the live catalog..."
                : `${products.length} matching products found.`
              : "Use the search bar to find fruits, rice, milk, snacks, and household essentials."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} showCategory />
            ))}
          </div>
        ) : query ? (
          <EmptyState
            icon={SearchIcon}
            title="No matching products"
            description="Try a broader search term or browse the full catalog."
            actionLabel="Browse all products"
            actionTo="/products"
          />
        ) : (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">Recent searches</h2>
            {recentSearches.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-green-50 hover:text-app-green focus:outline-none focus:ring-2 focus:ring-app-green"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">Your recent searches will appear here.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchResults;
