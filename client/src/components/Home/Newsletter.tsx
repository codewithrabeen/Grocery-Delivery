import { MailIcon, SendIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Enter an email address");
      return;
    }

    toast.success("Deal alerts enabled");
    setEmail("");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 rounded-lg bg-app-green p-6 text-white sm:p-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-orange-200">
            <MailIcon className="size-4" aria-hidden="true" />
            Weekly grocery notes
          </p>
          <h2 className="mt-3 text-3xl font-bold">Fresh deals before the week starts.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Get category picks, delivery reminders, and QuickBasket savings for Kathmandu Valley
            households.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-full border border-white/20 bg-white px-5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-app-orange px-5 text-sm font-semibold text-white hover:bg-app-orange-dark focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <SendIcon className="size-4" aria-hidden="true" />
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
