import { Skeleton, CardSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/10 via-surface to-accent/10 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <Skeleton className="mb-2 h-3 w-36" />
        <Skeleton className="mb-2 h-7 w-52" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
    </div>
  );
}
