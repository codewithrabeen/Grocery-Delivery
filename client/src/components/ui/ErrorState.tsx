import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

const ErrorState = ({ title = "Something went wrong", message, onRetry }: ErrorStateProps) => (
  <div className="rounded-lg border border-red-100 bg-white px-6 py-10 text-center shadow-sm">
    <AlertCircleIcon className="mx-auto mb-4 size-11 text-red-500" aria-hidden="true" />
    <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-app-green px-5 py-3 text-sm font-semibold text-app-green hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
      >
        <RefreshCwIcon className="size-4" aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;
