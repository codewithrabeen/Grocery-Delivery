import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo }: EmptyStateProps) => (
  <div className="rounded-lg border border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
    <Icon className="mx-auto mb-5 size-12 text-zinc-300" aria-hidden="true" />
    <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-zinc-500">{description}</p>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="mt-6 inline-flex rounded-full bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-2"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;
