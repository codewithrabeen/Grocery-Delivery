import { CheckCircle2Icon, HomeIcon, MapPinIcon, PlusIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";

const initialForm = {
  label: "",
  address: "",
  city: "Kathmandu",
  state: "Bagmati",
  zip: "44600",
};

const Addresses = () => {
  const { addAddress, addresses, setDefaultAddress } = useAppContext();
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addAddress(form);
    setForm(initialForm);
  };

  return (
    <div className="min-h-screen bg-app-cream">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-app-orange">Account</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-950">Saved addresses</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Manage delivery locations for Kathmandu Valley orders.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="space-y-4">
          {addresses.map((address) => (
            <article key={address._id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-full bg-green-50 text-app-green">
                      {address.label.toLowerCase().includes("home") ? (
                        <HomeIcon className="size-5" />
                      ) : (
                        <MapPinIcon className="size-5" />
                      )}
                    </span>
                    <h2 className="text-xl font-semibold text-zinc-950">{address.label}</h2>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2Icon className="size-3.5" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {address.address}, {address.city}, {address.state} {address.zip}
                  </p>
                </div>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(address._id)}
                    className="rounded-full border border-app-green px-4 py-2 text-sm font-semibold text-app-green hover:bg-green-50"
                  >
                    Set default
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-green-50 text-app-green">
              <PlusIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-app-orange">New address</p>
              <h2 className="text-2xl font-bold text-zinc-950">Add delivery location</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Label</span>
              <input
                type="text"
                required
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Home, Work, Hostel"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Street and landmark</span>
              <input
                type="text"
                required
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                placeholder="Baneshwor, near Civil Hospital"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">City</span>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Province</span>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Postal code</span>
              <input
                type="text"
                required
                value={form.zip}
                onChange={(event) => setForm({ ...form, zip: event.target.value })}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
          >
            <PlusIcon className="size-5" />
            Save address
          </button>
        </form>
      </section>
    </div>
  );
};

export default Addresses;

