import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { categories } from "../../lib/categories";

const HomeCategories = () => (
  <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-app-orange">Shop by category</p>
        <h2 className="mt-2 text-3xl font-bold text-zinc-950">What are you buying today?</h2>
      </div>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-app-green hover:text-app-green-light focus:outline-none focus:text-app-green-light"
      >
        View all
        <ArrowRightIcon className="size-4" aria-hidden="true" />
      </Link>
    </div>

    <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={`/products?category=${category.slug}`}
          className="group rounded-lg border border-zinc-200 bg-white p-4 text-center shadow-sm hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-app-green"
        >
          <div className="mx-auto flex aspect-square max-w-[120px] items-center justify-center rounded-lg bg-green-50 p-4">
            <img
              src={category.image}
              alt=""
              className="h-full w-full object-contain transition group-hover:scale-105"
            />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-950">{category.name}</h3>
        </Link>
      ))}
    </div>
  </section>
);

export default HomeCategories;
