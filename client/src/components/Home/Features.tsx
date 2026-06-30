import {
  BikeIcon,
  CreditCardIcon,
  MapPinIcon,
  PackageCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";

const features = [
  {
    icon: BikeIcon,
    title: "Riders who know your area",
    text: "Routes are tuned for Ring Road, Pulchowk, Naxal, Baneshwor, and nearby neighborhoods.",
  },
  {
    icon: MapPinIcon,
    title: "Saved Nepali addresses",
    text: "Use city, ward, landmark, and phone-friendly address fields for local delivery.",
  },
  {
    icon: CreditCardIcon,
    title: "Flexible payment",
    text: "Cash on Delivery, card checkout, and wallet-ready payment structure.",
  },
];

const stats = [
  { value: "30-45", label: "minute express runs" },
  { value: "10", label: "grocery categories" },
  { value: "Rs. 1,500", label: "free delivery threshold" },
];

const Features = () => (
  <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-app-orange">Delivery promise</p>
        <h2 className="mt-2 text-3xl font-bold text-zinc-950">
          Built for daily grocery runs, not generic shipping.
        </h2>
        <p className="mt-4 leading-7 text-zinc-500">
          The customer flow keeps local addresses, order totals, payment state, and delivery
          progress close at hand from cart to doorstep.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold text-app-green">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const featured = index === 0;

          return (
            <article
              key={feature.title}
              className={`rounded-lg p-6 shadow-sm ${
                featured ? "bg-app-green text-white" : "bg-white text-zinc-950"
              }`}
            >
              <Icon
                className={`mb-5 size-9 ${featured ? "text-white" : "text-app-green"}`}
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${featured ? "text-white/75" : "text-zinc-500"}`}>
                {feature.text}
              </p>
            </article>
          );
        })}

        <article className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm md:col-span-3 lg:col-span-1">
          <ShieldCheckIcon className="mb-5 size-9 text-amber-600" aria-hidden="true" />
          <h3 className="text-xl font-semibold">Quality checks before handoff</h3>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Products stay visible through stock status, item summaries, order history, and delivery
            tracking, so customers know what is arriving and when.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-700">
            <PackageCheckIcon className="size-3.5" aria-hidden="true" />
            Packed at the Naxal hub
          </div>
        </article>
      </div>
    </div>
  </section>
);

export default Features;
