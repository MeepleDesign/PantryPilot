import { Skeleton, RowSkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-32" />
      <Skeleton className="mb-6 h-4 w-28" />
      <Skeleton className="mb-8 h-20 w-full rounded-xl" />
      <Skeleton className="mb-2 h-4 w-20" />
      <div className="mb-6 divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
