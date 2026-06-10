import { MapPinIcon, PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Address } from "../../types";

type CheckOutAddressProps = {
  addresses: Address[];
  selectedAddressId: string;
  onSelectAddress: (addressId: string) => void;
};

export const CheckOutAddress = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
}: CheckOutAddressProps) => (
  <section className="rounded-lg bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-app-orange">Step 1</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-950">Delivery address</h1>
      </div>
      <Link
        to="/addresses"
        className="inline-flex items-center gap-2 rounded-full border border-app-green px-4 py-2 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
      >
        <PlusIcon className="size-4" aria-hidden="true" />
        Add address
      </Link>
    </div>

    {addresses.length === 0 ? (
      <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
        Add a delivery address before placing your order.
      </div>
    ) : (
      <div className="mt-5 grid gap-3">
        {addresses.map((address) => (
          <label
            key={address.id}
            className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
              selectedAddressId === address.id
                ? "border-app-green bg-green-50"
                : "border-zinc-200 bg-white hover:border-app-green/50"
            }`}
          >
            <input
              type="radio"
              name="address"
              value={address.id}
              checked={selectedAddressId === address.id}
              onChange={() => onSelectAddress(address.id)}
              className="mt-1 accent-app-green"
            />
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2 font-semibold text-zinc-950">
                <MapPinIcon className="size-4 text-app-green" aria-hidden="true" />
                {address.label}
                {address.isDefault && (
                  <span className="rounded-full bg-app-green px-2 py-0.5 text-xs text-white">
                    Default
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm leading-6 text-zinc-500">
                {address.address}, {address.city}, {address.state} {address.zip}
              </span>
            </span>
          </label>
        ))}
      </div>
    )}
  </section>
);

