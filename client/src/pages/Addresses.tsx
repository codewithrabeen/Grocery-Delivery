import { CheckCircle2Icon, HomeIcon, MapPinIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingButton from "../components/ui/LoadingButton";
import { Skeleton } from "../components/ui/Skeleton";
import type { Address } from "../types";

const initialForm = {
  label: "",
  address: "",
  city: "Kathmandu",
  state: "Bagmati",
  zip: "44600",
};

const Addresses = () => {
  const {
    addAddress,
    addressError,
    addressLoading,
    addresses,
    deleteAddress,
    refreshAddresses,
    setDefaultAddress,
  } = useAppContext();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await addAddress({
        ...form,
        isDefault: addresses.length === 0,
        lat: 27.7172,
        lng: 85.324,
      });

      if (saved) {
        setForm(initialForm);
      }
    } finally {
      setSaving(false);
    }
  };

  const renderAddresses = () => {
    if (addressLoading) {
      return Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg bg-white p-5 shadow-sm">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ));
    }

    if (addressError) {
      return <ErrorState message={addressError} onRetry={() => void refreshAddresses()} />;
    }

    if (addresses.length === 0) {
      return (
        <EmptyState
          icon={MapPinIcon}
          title="No saved addresses"
          description="Add your first delivery location to make checkout faster."
        />
      );
    }

    return addresses.map((address: Address) => (
      <article key={address.id} className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full bg-green-50 text-app-green">
                {address.label.toLowerCase().includes("home") ? (
                  <HomeIcon className="size-5" aria-hidden="true" />
                ) : (
                  <MapPinIcon className="size-5" aria-hidden="true" />
                )}
              </span>
              <h2 className="text-xl font-semibold text-zinc-950">{address.label}</h2>
              {address.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
                  Default
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {address.address}, {address.city}, {address.state} {address.zip}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!address.isDefault && (
              <button
                type="button"
                onClick={() => void setDefaultAddress(address.id)}
                className="rounded-full border border-app-green px-4 py-2 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
              >
                Set default
              </button>
            )}
            <button
              type="button"
              onClick={() => void deleteAddress(address.id)}
              className="flex size-10 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label={`Delete ${address.label}`}
            >
              <Trash2Icon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    ));
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
          {renderAddresses()}
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-green-50 text-app-green">
              <PlusIcon className="size-5" aria-hidden="true" />
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
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
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
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
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
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Province</span>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
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
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-app-green focus:bg-white focus:outline-none"
              />
            </label>
          </div>

          <LoadingButton
            type="submit"
            loading={saving}
            className="mt-6 w-full"
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            Save address
          </LoadingButton>
        </form>
      </section>
    </div>
  );
};

export default Addresses;
