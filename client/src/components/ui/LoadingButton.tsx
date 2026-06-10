import { Loader2Icon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
};

const LoadingButton = ({ loading = false, children, disabled, className = "", ...props }: LoadingButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2 ${className}`}
  >
    {loading && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export default LoadingButton;
