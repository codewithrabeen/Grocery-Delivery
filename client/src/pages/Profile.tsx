import { MailIcon, MapPinIcon, PackageIcon, UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { addresses, orders } = useAppContext();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Account</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">Profile</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Manage the customer details used for delivery updates.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-app-green text-2xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">{user.name}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <MailIcon className="size-4" aria-hidden="true" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              to="/orders"
              className="rounded-lg border border-zinc-200 p-5 hover:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green"
            >
              <PackageIcon className="mb-4 size-7 text-app-green" aria-hidden="true" />
              <p className="text-2xl font-bold text-zinc-950">{orders.length}</p>
              <p className="mt-1 text-sm text-zinc-500">Orders</p>
            </Link>
            <Link
              to="/addresses"
              className="rounded-lg border border-zinc-200 p-5 hover:border-app-green focus:outline-none focus:ring-2 focus:ring-app-green"
            >
              <MapPinIcon className="mb-4 size-7 text-app-green" aria-hidden="true" />
              <p className="text-2xl font-bold text-zinc-950">{addresses.length}</p>
              <p className="mt-1 text-sm text-zinc-500">Saved addresses</p>
            </Link>
          </div>
        </div>

        <aside className="h-fit rounded-lg bg-white p-6 shadow-sm">
          <UserIcon className="mb-4 size-8 text-app-green" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-zinc-950">Delivery contact</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p>
              <span className="block font-semibold text-zinc-950">Name</span>
              {user.name}
            </p>
            <p>
              <span className="block font-semibold text-zinc-950">Email</span>
              {user.email}
            </p>
            {user.phone && (
              <p>
                <span className="block font-semibold text-zinc-950">Phone</span>
                {user.phone}
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Profile;
