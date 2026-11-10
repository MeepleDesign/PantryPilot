"use client";

import { useTransition } from "react";
import { Minus, Snowflake, Refrigerator, Trash2, Layers } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { LogBatchManual } from "@/components/log-batch-manual";
import { consumeBatchPortion, deleteMealBatch } from "@/lib/actions/meal-batches";
import type { MealBatch, MealBatchStorage } from "@/lib/types";

const LOCATIONS: MealBatchStorage[] = ["freezer", "fridge"];
const LOCATION_ICONS: Record<MealBatchStorage, typeof Snowflake> = {
  freezer: Snowflake,
  fridge: Refrigerator,
};

export function BatchList({
  batches,
  recipes,
}: {
  batches: MealBatch[];
  recipes: { id: string; name: string }[];
}) {
  const totalPortions = batches.reduce((sum, b) => sum + b.portions_remaining, 0);

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
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-2xl font-semibold tracking-tight">{batches.length}</p>
              <p className="text-xs text-muted">
                batch{batches.length === 1 ? "" : "es"} on the go
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-2xl font-semibold tracking-tight">{totalPortions}</p>
              <p className="text-xs text-muted">portions ready to eat</p>
            </div>
          </div>

          {LOCATIONS.map((loc) => {
            const locBatches = batches.filter((b) => b.storage_location === loc);
            if (!locBatches.length) return null;
            const Icon = LOCATION_ICONS[loc];
            return (
              <div key={loc} className="mb-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <Icon className="h-3.5 w-3.5" />
                  {loc}
                </h3>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {locBatches.map((batch) => (
                    <BatchRow key={batch.id} batch={batch} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      <LogBatchManual recipes={recipes} />
    </div>
  );
}

function BatchRow({ batch }: { batch: MealBatch }) {
  const [pending, startTransition] = useTransition();
  const usedPct = Math.round(
    ((batch.portions_total - batch.portions_remaining) / batch.portions_total) * 100,
  );
  const empty = batch.portions_remaining === 0;

  return (
    <div className="px-3 py-2.5 text-sm">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{batch.recipe_name}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Layers className="h-3 w-3" />
            {empty ? (
              <span className="text-muted">All used up</span>
            ) : (
              <>
                <span className="font-medium text-foreground">{batch.portions_remaining}</span>{" "}
                of {batch.portions_total} portions left
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            disabled={pending || empty}
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
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-background"
        role="progressbar"
        aria-valuenow={usedPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${batch.portions_remaining} of ${batch.portions_total} portions left`}
      >
        <div
          className={`h-full rounded-full transition-all ${empty ? "bg-border" : "bg-brand"}`}
          style={{ width: `${100 - usedPct}%` }}
        />
      </div>
    </div>
  );
}
