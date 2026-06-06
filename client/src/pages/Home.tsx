import { ArrowRightIcon, BikeIcon, CreditCardIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Hero from "../components/Home/Hero";
import ProductCard from "../components/ProductCard";
import { nepalCategories } from "../data/nepalStore";
import { useAppContext } from "../context/AppContext";

const Home = () => {
  const { products } = useAppContext();
  const featuredProducts = products.slice(0, 8);
  const bestDeals = [...products].sort((a, b) => b.discount - a.discount).slice(0, 4);

  return (
    <div className="bg-app-cream">
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-app-orange">Shop by category</p>
            <h2 className="mt-2 text-3xl font-bold text-zinc-950">What are you buying today?</h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-app-green hover:text-app-green-light"
          >
            View all
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {nepalCategories.map((category) => (
            <Link
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto flex aspect-square max-w-[120px] items-center justify-center rounded-2xl bg-green-50 p-4">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-950">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-app-orange">Fresh picks</p>
              <h2 className="mt-2 text-3xl font-bold text-zinc-950">Popular in Kathmandu Valley</h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm font-semibold text-app-green hover:text-app-green-light"
            >
              Browse catalog
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} showCategory />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-app-green p-6 text-white">
            <BikeIcon className="mb-5 size-9" />
            <h3 className="text-xl font-semibold">Riders who know your area</h3>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Routes are tuned for Ring Road, Pulchowk, Naxal, Baneshwor, and nearby neighborhoods.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <MapPinIcon className="mb-5 size-9 text-app-green" />
            <h3 className="text-xl font-semibold text-zinc-950">Saved Nepali addresses</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Use city, ward, landmark, and phone-friendly address fields for local delivery.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <CreditCardIcon className="mb-5 size-9 text-app-green" />
            <h3 className="text-xl font-semibold text-zinc-950">Flexible payment</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Cash on Delivery, eSewa, and Khalti keep checkout simple for local shoppers.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-green-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
                <SparklesIcon className="size-4" />
                Flash deals
              </p>
              <h2 className="mt-2 text-3xl font-bold">Best rupee savings today</h2>
            </div>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-orange-200"
            >
              See all deals
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestDeals.map((product) => (
              <ProductCard key={product._id} product={product} showCategory />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
