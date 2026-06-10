const Terms = () => (
  <div className="min-h-screen bg-app-cream">
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-app-orange">Terms</p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-950">Terms of Service</h1>
        <p className="mt-3 text-zinc-500">
          QuickBasket is a grocery delivery demo for browsing, checkout, and order tracking flows.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-sm leading-7 text-zinc-600 sm:px-6 lg:px-8">
      <p>
        Product availability, prices, delivery windows, and order states may change as inventory and
        fulfillment details are updated.
      </p>
      <p>
        Orders should include an accurate delivery address and reachable customer contact details so
        riders can complete delivery.
      </p>
    </section>
  </div>
);

export default Terms;
