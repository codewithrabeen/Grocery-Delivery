const PrivacyPolicy = () => (
  <div className="min-h-screen bg-app-cream">
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-app-orange">Policy</p>
        <h1 className="mt-2 text-4xl font-bold text-zinc-950">Privacy Policy</h1>
        <p className="mt-3 text-zinc-500">
          This demo stores only the information needed to sign in, manage addresses, and place
          grocery orders.
        </p>
      </div>
    </section>

    <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-sm leading-7 text-zinc-600 sm:px-6 lg:px-8">
      <p>
        Customer account details, saved addresses, cart contents, wishlist items, and order
        information are used to provide shopping, checkout, and delivery tracking features.
      </p>
      <p>
        Payment card details are handled through the configured payment provider and are not stored
        in the client application.
      </p>
    </section>
  </div>
);

export default PrivacyPolicy;
