import { ArrowRightIcon, ClockIcon, LeafIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const features = [
  { icon: TruckIcon, title: "Valley delivery", desc: "Kathmandu, Lalitpur, Bhaktapur" },
  { icon: LeafIcon, title: "Local sourcing", desc: "Farms, dairies, and bakeries" },
  { icon: ClockIcon, title: "Fast slots", desc: "30-45 minute express runs" },
  { icon: ShieldCheckIcon, title: "Trusted checkout", desc: "Cash, eSewa, Khalti" },
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-app-green">
      <img
        src={assets.hero_bg}
        alt="Fresh groceries"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-linear-to-r from-app-green via-app-green/90 to-app-green/40" />

      <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
            Fresh groceries for Nepal homes
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Daily essentials delivered before the dal gets cold.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Shop local produce, Nepali staples, dairy, bakery items, snacks, and household
            essentials with prices in rupees and delivery built for Kathmandu Valley.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-app-green hover:bg-green-50"
            >
              Shop groceries
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View deals
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-lg lg:justify-self-end">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div key={feature.title} className="rounded-2xl bg-white/95 p-4 shadow-lg">
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-green-100 text-app-green">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold text-zinc-950">{feature.title}</h3>
                <p className="mt-1 text-sm leading-5 text-zinc-500">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Hero;