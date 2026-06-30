import { Link } from "react-router-dom";
import { ArrowRightIcon, PackageSearchIcon } from "lucide-react";
import ProductCard from "../ProductCard";
import { useAppContext } from "../../context/AppContext";
import ErrorState from "../ui/ErrorState";
import { ProductGridSkeleton } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

const PopularProducts = () => {
  const { productError, productLoading, products, refreshProducts } = useAppContext();
  const popularProducts = [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    .slice(0, 8);

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-app-orange">Fresh picks</p>
            <h2 className="mt-2 text-3xl font-bold text-zinc-950">Popular near you</h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-app-green hover:text-app-green-light focus:outline-none focus:text-app-green-light"
          >
            Browse catalog
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {productLoading ? (
          <ProductGridSkeleton count={8} />
        ) : productError ? (
          <ErrorState message={productError} onRetry={() => void refreshProducts()} />
        ) : popularProducts.length === 0 ? (
          <EmptyState
            icon={PackageSearchIcon}
            title="No popular products yet"
            description="The catalog is available, but there are no in-stock products to feature right now."
            actionLabel="Browse all products"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularProducts;
