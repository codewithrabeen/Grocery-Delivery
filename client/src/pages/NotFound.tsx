import { SearchXIcon } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

const NotFound = () => (
  <div className="min-h-screen bg-app-cream px-4 py-20">
    <div className="mx-auto max-w-3xl">
      <EmptyState
        icon={SearchXIcon}
        title="Page not found"
        description="The page you are looking for is not available."
        actionLabel="Go home"
        actionTo="/"
      />
    </div>
  </div>
);

export default NotFound;
