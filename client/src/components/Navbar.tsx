import {
  BikeIcon,
  ChevronDownIcon,
  LogOutIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Deals", to: "/deals", highlight: true },
];

const Navbar = () => {
  const { cartCount, logout, setIsCartOpen, user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const linkClass = (to: string, highlight?: boolean) => {
    const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    if (active) return "text-app-green font-semibold";
    if (highlight) return "text-app-orange hover:text-app-orange-dark";
    return "text-zinc-600 hover:text-app-green";
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-xl font-bold text-app-green"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-green-100">
            <BikeIcon className="size-6" />
          </span>
          <span className="hidden sm:inline">QuickBasket </span>
          <span className="sm:hidden">QuickBasket</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to, link.highlight)}>
              {link.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearch} className="hidden flex-1 justify-end sm:flex">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm transition focus:border-app-green focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative flex size-11 items-center justify-center rounded-full hover:bg-zinc-100"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open basket"
          >
            <ShoppingCartIcon className="size-5 text-zinc-900" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-app-orange px-1.5 py-0.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative hidden md:block">
            {user ? (
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full p-1.5 hover:bg-zinc-100"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-app-green text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <ChevronDownIcon className="size-4 text-zinc-500" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-app-green px-4 py-2 text-sm font-semibold text-white hover:bg-app-green-light"
              >
                <UserIcon className="size-4" />
                Sign in
              </Link>
            )}

            {userMenuOpen && user && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setUserMenuOpen(false)}
                  aria-label="Close account menu"
                />
                <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-zinc-100 bg-white py-2 shadow-xl">
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="font-semibold text-zinc-950">{user.name}</p>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-app-green"
                  >
                    <PackageIcon className="size-4" />
                    My orders
                  </Link>
                  <Link
                    to="/addresses"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-app-green"
                  >
                    <MapPinIcon className="size-4" />
                    Addresses
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin/products"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-app-orange hover:bg-orange-50"
                    >
                      <ShieldIcon className="size-4" />
                      Admin panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    <LogOutIcon className="size-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full hover:bg-zinc-100 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Open menu"
          >
            {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 shadow-lg md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                placeholder="Search groceries..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm focus:border-app-green focus:bg-white"
              />
            </div>
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  My orders
                </Link>
                <Link
                  to="/addresses"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Addresses
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl bg-app-green px-3 py-3 text-center text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
