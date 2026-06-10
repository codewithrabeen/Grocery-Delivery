import { HeartIcon } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";

const Wishlist = () => {
  const { products, wishlistIds } = useAppContext();
  const savedProducts = products.filter((product) => wishlistIds.includes(product.id));

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Account</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">Wishlist</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Products you saved for your next grocery run.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {savedProducts.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="No saved products"
            description="Tap the heart on any product to keep it here."
            actionLabel="Browse products"
            actionTo="/products"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} showCategory />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Wishlist;
