"use client";

import { useTransition } from "react";
import { Minus, Snowflake, Refrigerator, Trash2 } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { LogBatchManual } from "@/components/log-batch-manual";
import { consumeBatchPortion, deleteMealBatch } from "@/lib/actions/meal-batches";
import type { MealBatch } from "@/lib/types";

export function BatchList({
  batches,
  recipes,
}: {
  batches: MealBatch[];
  recipes: { id: string; name: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 font-medium">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
          <Snowflake className="h-4 w-4" />
        </span>
        Batch-cooked meals
      </h2>

      {batches.length === 0 ? (
        <p className="mb-3 text-sm text-muted">
          No batch-cooked meals logged yet. Mark a planner entry as cooked to log portions, or
          add one manually below.
        </p>
      ) : (
        <div className="mb-3 divide-y divide-border rounded-lg border border-border">
          {batches.map((batch) => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </div>
      )}

      <LogBatchManual recipes={recipes} />
    </div>
  );
}

function BatchRow({ batch }: { batch: MealBatch }) {
  const [pending, startTransition] = useTransition();
  const Icon = batch.storage_location === "freezer" ? Snowflake : Refrigerator;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{batch.recipe_name}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Icon className="h-3 w-3" />
          {batch.portions_remaining} of {batch.portions_total} portions left ·{" "}
          <span className="capitalize">{batch.storage_location}</span>
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
