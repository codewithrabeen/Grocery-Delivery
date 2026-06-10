import { AtSignIcon, BikeIcon, LockIcon, UserIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { heroSectionData } from "../assets/assets";
import LoadingButton from "../components/ui/LoadingButton";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { isAuthenticated, login, loading: authLoading, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginState, setIsLoginState] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!isLoginState && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isLoginState && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!isLoginState && !trimmedName) {
      toast.error("Please enter your name");
      return;
    }

    const success = isLoginState
      ? await login(trimmedEmail, password)
      : await register(trimmedName, trimmedEmail, password);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm transition focus:border-app-green focus:bg-white focus:ring-2 focus:ring-green-100";

  return (
    <div className="min-h-screen bg-app-cream lg:grid lg:grid-cols-2">
      <section className="relative hidden items-center overflow-hidden bg-app-green px-12 lg:flex">
        <img
          src={heroSectionData.hero_image}
          alt="Fresh groceries"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-app-green/70" />
        <div className="relative max-w-lg text-white">
          <Link to="/" className="mb-10 inline-flex items-center gap-3 text-3xl font-bold">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
              <BikeIcon className="size-7" />
            </span>
            QuickBasket
          </Link>
          <h1 className="text-5xl font-bold leading-tight">
            Groceries for the way Nepal shops.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/80">
            Local staples, fresh produce, fast delivery, and rupee pricing in one customer app.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-app-green">
              <BikeIcon className="size-8" />
              QuickBasket 
            </Link>
            <h2 className="mt-8 text-3xl font-bold text-zinc-950">
              {isLoginState ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {isLoginState ? "New to QuickBasket?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLoginState((current) => !current)}
                className="ml-1 font-semibold text-app-orange hover:text-app-orange-dark"
              >
                {isLoginState ? "Register" : "Sign in"}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {!isLoginState && (
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Full name</span>
                <span className="relative mt-2 block">
                  <UserIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-app-green" />
                  <input
                    type="text"
                    required
                    placeholder="Aarav Shrestha"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Email address</span>
              <span className="relative mt-2 block">
                <AtSignIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-app-green" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">Password</span>
              <span className="relative mt-2 block">
                <LockIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-app-green" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </span>
            </label>

            {!isLoginState && (
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Confirm password</span>
                <span className="relative mt-2 block">
                  <LockIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-app-green" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                  />
                </span>
              </label>
            )}

            <LoadingButton
              type="submit"
              loading={authLoading}
              className="w-full"
            >
              {isLoginState ? "Sign in" : "Create account"}
            </LoadingButton>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
