import { ArrowRightIcon, Clock3Icon, MapPinnedIcon, ReceiptTextIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const highlights = [
  { icon: ReceiptTextIcon, label: "Clear order totals before checkout" },
  { icon: MapPinnedIcon, label: "Saved Kathmandu Valley addresses" },
  { icon: Clock3Icon, label: "Delivery windows for today or tomorrow" },
];

const AppPromoBanner = () => (
  <section className="bg-white py-12">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
      <div>
        <p className="text-sm font-semibold text-app-orange">Checkout ready</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold text-zinc-950">
          A grocery flow that keeps the whole delivery visible.
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
          Customers can save addresses, review every rupee in the cart, choose a payment method,
          and track orders from placement to handoff.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <Icon className="mb-3 size-5 text-app-green" aria-hidden="true" />
                <p className="text-sm font-semibold leading-5 text-zinc-800">{item.label}</p>
              </div>
            );
          })}
        </div>

        <Link
          to="/products"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
        >
          Start shopping
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-green-50 p-6">
        <img
          src={assets.delivery_truck}
          alt="QuickBasket delivery truck"
          className="mx-auto h-auto max-h-80 w-full object-contain"
        />
      </div>
    </div>
  </section>
);

export default AppPromoBanner;
