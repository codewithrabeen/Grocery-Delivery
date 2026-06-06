import { FilterIcon, SlidersHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { nepalCategories } from "../data/nepalStore";
import { useAppContext } from "../context/AppContext";
import type { Product } from "../types";

const sortProducts = (sort: string) => {
  return (a: Product, b: Product) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "discount") return b.discount - a.discount;
    return b.reviewCount - a.reviewCount;
  };
};

const Products = () => {
  const { products } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState("popular");
  const selectedCategory = searchParams.get("category") ?? "all";

  const filteredProducts = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? products
        : products.filter((product) => product.category === selectedCategory);

    return [...filtered].sort(sortProducts(sort));
  }, [products, selectedCategory, sort]);

  const handleCategoryChange = (category: string) => {
    if (category === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ category });
  };

  return (
    <div className="bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Nepal grocery catalog</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-950">Products</h1>
              <p className="mt-2 max-w-2xl text-zinc-500">
                Browse local vegetables, pantry staples, dairy, snacks, drinks, and household
                essentials priced in Nepali rupees.
              </p>
            </div>

            <label className="flex w-full items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600 sm:w-auto">
              <SlidersHorizontalIcon className="size-4 text-app-green" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="w-full bg-transparent font-medium text-zinc-800 outline-none sm:w-44"
              >
                <option value="popular">Most popular</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
                <option value="discount">Best discount</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <FilterIcon className="size-4 text-app-green" />
          Categories
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              selectedCategory === "all"
                ? "bg-app-green text-white"
                : "bg-white text-zinc-600 hover:text-app-green"
            }`}
          >
            All
          </button>
          {nepalCategories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => handleCategoryChange(category.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                selectedCategory === category.slug
                  ? "bg-app-green text-white"
                  : "bg-white text-zinc-600 hover:text-app-green"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between text-sm text-zinc-500">
          <span>{filteredProducts.length} products found</span>
          <span>Delivery from Naxal hub</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} showCategory />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Products;
