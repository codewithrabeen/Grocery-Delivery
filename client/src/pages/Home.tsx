import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import AppPromoBanner from "../components/Home/AppPromoBanner";
import Features from "../components/Home/Features";
import Hero from "../components/Home/Hero";
import HomeCategories from "../components/Home/HomeCategories";
import Newsletter from "../components/Home/Newsletter";
import PopularProducts from "../components/Home/PopularProducts";
import ProductCard from "../components/ProductCard";
import { useAppContext } from "../context/AppContext";

const Home = () => {
  const { products } = useAppContext();
  const bestDeals = [...products]
    .filter((product) => product.discount > 0 && product.stock > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 4);

  return (
    <div className="bg-app-cream">
      <Hero />
      <HomeCategories />
      <PopularProducts />
      <Features />

      {bestDeals.length > 0 && (
        <section className="bg-green-950 py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
                  <SparklesIcon className="size-4" aria-hidden="true" />
                  Flash deals
                </p>
                <h2 className="mt-2 text-3xl font-bold">Best rupee savings today</h2>
              </div>
              <Link
                to="/deals"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-orange-200 focus:outline-none focus:text-orange-200"
              >
                See all deals
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestDeals.map((product) => (
                <ProductCard key={product.id} product={product} showCategory />
              ))}
            </div>
          </div>
        </section>
      )}

      <AppPromoBanner />
      <Newsletter />
    </div>
  );
};

export default Home;
