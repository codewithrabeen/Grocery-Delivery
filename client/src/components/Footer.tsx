import { BikeIcon, MailIcon, MapPinIcon, PhoneIcon, ArrowUpRightIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-zinc-200 bg-gradient-to-b from-white to-green-50">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        {/* Logo & About */}
        <div>
          <Link
            to="/"
            className="group inline-flex items-center gap-3 text-2xl font-bold text-app-green transition-all duration-300 hover:scale-105"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 transition-all duration-300 group-hover:bg-app-green group-hover:text-white group-hover:shadow-lg">
              <BikeIcon className="h-6 w-6" />
            </span>

            <span>QuickBasket</span>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600">
            Fresh groceries, Nepali staples, fruits, vegetables and daily
            essentials delivered across Kathmandu Valley with affordable prices
            and friendly riders.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-app-green px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-green-700 hover:shadow-lg"
          >
            Shop Now
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Shop</h3>

          <div className="mt-5 space-y-4 text-sm text-zinc-600">
            <Link
              className="block transition-all duration-300 hover:translate-x-2 hover:text-app-green"
              to="/products"
            >
              All Products
            </Link>

            <Link
              className="block transition-all duration-300 hover:translate-x-2 hover:text-app-green"
              to="/deals"
            >
              Flash Deals
            </Link>

            <Link
              className="block transition-all duration-300 hover:translate-x-2 hover:text-app-green"
              to="/orders"
            >
              My Orders
            </Link>

            <Link
              className="block transition-all duration-300 hover:translate-x-2 hover:text-app-green"
              to="/addresses"
            >
              Saved Addresses
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Contact</h3>

          <div className="mt-5 space-y-4 text-sm text-zinc-600">
            <div className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white hover:shadow-md">
              <MapPinIcon className="h-5 w-5 text-app-green transition-transform duration-300 group-hover:scale-125" />
              <span>Samakhushi, Kathmandu 44600</span>
            </div>

            <a
              href="tel:+9779814820958"
              className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white hover:shadow-md"
            >
              <PhoneIcon className="h-5 w-5 text-app-green transition-transform duration-300 group-hover:scale-125" />
              <span>+977 9814820958</span>
            </a>

            <a
              href="mailto:rabeensharma888@gmail.com"
              className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white hover:shadow-md"
            >
              <MailIcon className="h-5 w-5 text-app-green transition-transform duration-300 group-hover:scale-125" />
              <span className="break-all">
                rabeensharma888@gmail.com
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-sm text-zinc-500 sm:px-6 md:flex-row lg:px-8">
          <p>
            © 2026{" "}
            <span className="font-semibold text-app-green">
              QuickBasket Nepal
            </span>
            . Quick and convenient grocery delivery.
          </p>

          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="rounded-lg border border-green-200 px-4 py-2 transition-all duration-300 hover:bg-app-green hover:text-white"
          >
            ↑ Back to Top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;