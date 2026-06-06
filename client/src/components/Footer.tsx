import { BikeIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-app-green">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-green-100">
              <BikeIcon className="size-6" />
            </span>
            QuickBasket
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
            Fresh groceries, Nepali staples, and daily essentials delivered across Kathmandu
            Valley with local pricing and friendly riders.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-950">Shop</h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-500">
            <Link className="block hover:text-app-green" to="/products">
              All products
            </Link>
            <Link className="block hover:text-app-green" to="/deals">
              Flash deals
            </Link>
            <Link className="block hover:text-app-green" to="/orders">
              My orders
            </Link>
            <Link className="block hover:text-app-green" to="/addresses">
              Saved addresses
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-zinc-950">Contact</h3>
          <div className="mt-4 space-y-3 text-sm text-zinc-500">
            <p className="flex items-center gap-2">
              <MapPinIcon className="size-4 text-app-green" />
              Naxal, Kathmandu 44600
            </p>
            <p className="flex items-center gap-2">
              <PhoneIcon className="size-4 text-app-green" />
              +977 9801234567
            </p>
            <p className="flex items-center gap-2">
              <MailIcon className="size-4 text-app-green" />
              hello@quickbasket.com.np
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500">
        (c) 2026 QuickBasket Nepal. Demo client for grocery delivery.
      </div>
    </footer>
  );
};

export default Footer;
