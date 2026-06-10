type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} aria-hidden="true" />
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mt-4 h-4 w-2/3" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <div className="mt-5 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export const PageLoader = () => (
  <div className="min-h-[60vh] bg-app-cream px-4 py-10">
    <div className="mx-auto max-w-7xl">
      <Skeleton className="h-8 w-60" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  </div>
);
