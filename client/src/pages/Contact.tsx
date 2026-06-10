import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen bg-app-cream">
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-app-orange">Contact</p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-950">QuickBasket support</h1>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Reach the team for order help, delivery questions, and product support.
        </p>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
      {[
        { icon: MapPinIcon, label: "Address", value: "Naxal, Kathmandu 44600" },
        { icon: PhoneIcon, label: "Phone", value: "+977 9801234567" },
        { icon: MailIcon, label: "Email", value: "hello@quickbasket.com.np" },
      ].map(({ icon: Icon, label, value }) => (
        <article key={label} className="rounded-lg bg-white p-6 shadow-sm">
          <Icon className="mb-5 size-8 text-app-green" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-zinc-950">{label}</h2>
          <p className="mt-2 text-sm text-zinc-500">{value}</p>
        </article>
      ))}
    </section>
  </div>
);

export default Contact;
