import { SearchIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";
import { normalizeText } from "../lib/format";

const SearchResults = () => {
  const { products } = useAppContext();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const normalizedQuery = normalizeText(query);

  const results = normalizedQuery
    ? products.filter((product) => {
        const searchable = normalizeText(
          `${product.name} ${product.description} ${product.category} ${product.unit}`,
        );
        return searchable.includes(normalizedQuery);
      })
    : [];

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-sm font-semibold text-app-orange">
            <SearchIcon className="size-4" />
            Search
          </div>
          <h1 className="mt-3 text-4xl font-bold text-zinc-950">
            {query ? `Results for "${query}"` : "Search groceries"}
          </h1>
          <p className="mt-2 text-zinc-500">
            {query
              ? `${results.length} matching products found in the QuickBasket Nepal catalog.`
              : "Use the search bar to find fruits, dal, milk, snacks, and household essentials."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product._id} product={product} showCategory />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <SearchIcon className="mx-auto mb-5 size-12 text-zinc-300" />
            <h2 className="text-2xl font-semibold text-zinc-950">No matching products</h2>
            <p className="mx-auto mt-2 max-w-md text-zinc-500">
              Try searching for apple, dal, milk, momo, tea, or another local grocery item.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
            >
              Browse all products
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchResults;

