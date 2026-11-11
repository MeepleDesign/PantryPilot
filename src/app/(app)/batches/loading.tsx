import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <Skeleton className="mb-3 h-5 w-40" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <Skeleton className="mb-2 h-4 w-1/3" />
            <Skeleton className="mb-2 h-1.5 w-full rounded-full" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
