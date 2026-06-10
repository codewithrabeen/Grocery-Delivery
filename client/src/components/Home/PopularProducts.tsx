import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import ProductCard from "../ProductCard";
import { useAppContext } from "../../context/AppContext";
import ErrorState from "../ui/ErrorState";
import { ProductGridSkeleton } from "../ui/Skeleton";

const PopularProducts = () => {
  const { productError, productLoading, products, refreshProducts } = useAppContext();
  const popularProducts = [...products]
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    .slice(0, 10);

  return (
    <section className="pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">Popular products</h2>
            <p className="mt-1 text-sm text-zinc-500">Top-rated products this season</p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm font-semibold text-app-orange transition-colors hover:text-app-orange-dark focus:outline-none focus:text-app-orange-dark"
          >
            View All
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {productLoading ? (
          <ProductGridSkeleton count={10} />
        ) : productError ? (
          <ErrorState message={productError} onRetry={() => void refreshProducts()} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularProducts;
