import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="mb-6 h-5 w-36" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-3 py-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
            <div className="px-3 py-2.5">
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
