import { BikeIcon, LeafIcon, ShieldCheckIcon } from "lucide-react";

const About = () => (
  <div className="min-h-screen bg-app-cream">
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-app-orange">About QuickBasket</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-bold text-zinc-950">
          Local grocery delivery built around Kathmandu Valley routines.
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
          QuickBasket brings fresh produce, staples, snacks, and household essentials together
          in one focused shopping flow for daily Nepali grocery needs.
        </p>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
      {[
        {
          icon: LeafIcon,
          title: "Fresh catalog",
          text: "Products are organized by local shopping categories and everyday essentials.",
        },
        {
          icon: BikeIcon,
          title: "Fast delivery",
          text: "Checkout supports delivery windows suited for nearby grocery fulfillment.",
        },
        {
          icon: ShieldCheckIcon,
          title: "Reliable orders",
          text: "Order status, saved addresses, and tracking keep each delivery visible.",
        },
      ].map(({ icon: Icon, title, text }) => (
        <article key={title} className="rounded-lg bg-white p-6 shadow-sm">
          <Icon className="mb-5 size-9 text-app-green" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
        </article>
      ))}
    </section>
  </div>
);

export default About;
