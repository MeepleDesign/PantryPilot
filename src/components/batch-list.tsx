"use client";

import { useTransition } from "react";
import { Minus, Snowflake, Refrigerator, Trash2 } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { consumeBatchPortion, deleteMealBatch } from "@/lib/actions/meal-batches";
import type { MealBatch } from "@/lib/types";

export function BatchList({ batches }: { batches: MealBatch[] }) {
  if (!batches.length) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
        <Snowflake className="h-4 w-4" />
        Batch-cooked meals
      </h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
        {batches.map((batch) => (
          <BatchRow key={batch.id} batch={batch} />
        ))}
      </div>
    </div>
  );
}

function BatchRow({ batch }: { batch: MealBatch }) {
  const [pending, startTransition] = useTransition();
  const Icon = batch.storage_location === "freezer" ? Snowflake : Refrigerator;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{batch.recipe_name}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Icon className="h-3 w-3" />
          {batch.portions_remaining} of {batch.portions_total} portions left · {batch.storage_location}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          disabled={pending || batch.portions_remaining === 0}
          onClick={() => startTransition(() => consumeBatchPortion(batch.id, 1))}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          1 used
        </button>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteMealBatch(batch.id))}
          className="text-muted hover:text-danger"
          aria-label="Remove batch"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
