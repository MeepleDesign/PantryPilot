"use client";

import { useState, useTransition } from "react";
import { Minus, Snowflake, Refrigerator, Layers } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { LogBatchManual } from "@/components/log-batch-manual";
import {
  consumeBatchPortion,
  deleteMealBatch,
  updateMealBatch,
} from "@/lib/actions/meal-batches";
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
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [name, setName] = useState(batch.recipe_name);
  const [totalInput, setTotalInput] = useState(String(batch.portions_total));
  const [remainingInput, setRemainingInput] = useState(String(batch.portions_remaining));
  const [location, setLocation] = useState<MealBatchStorage>(batch.storage_location);

  const usedPct = Math.round(
    ((batch.portions_total - batch.portions_remaining) / batch.portions_total) * 100,
  );
  const empty = batch.portions_remaining === 0;

  if (editing) {
    return (
      <div className="space-y-2 px-3 py-2.5 text-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          placeholder="Recipe name"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Total
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              onBlur={() => {
                if (!totalInput.trim() || Number(totalInput) < 1) setTotalInput("1");
              }}
              className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Left
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={remainingInput}
              onChange={(e) => setRemainingInput(e.target.value)}
              onBlur={() => {
                if (!remainingInput.trim()) setRemainingInput("0");
              }}
              className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <div className="flex overflow-hidden rounded-lg border border-border text-xs">
            {(["fridge", "freezer"] as const).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`px-2.5 py-1.5 capitalize transition-colors ${
                  location === loc ? "bg-brand/10 font-medium text-brand-dark" : "bg-surface text-muted"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={pending || !name.trim()}
            onClick={() =>
              startTransition(async () => {
                await updateMealBatch(batch.id, {
                  recipe_name: name.trim(),
                  portions_total: Number(totalInput) || 1,
                  portions_remaining: Number(remainingInput) || 0,
                  storage_location: location,
                });
                setEditing(false);
              })
            }
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && <Spinner className="h-3.5 w-3.5" />}
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (confirmingRemove) {
    return (
      <div className="px-3 py-2.5 text-sm">
        <p className="mb-2">
          Remove <span className="font-medium">{batch.recipe_name}</span> entirely? This can&apos;t
          be undone.
        </p>
        <div className="flex gap-2">
          <button
            disabled={pending}
            onClick={() => startTransition(() => deleteMealBatch(batch.id))}
            className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-3.5 w-3.5" />}
            Yes, remove it
          </button>
          <button
            disabled={pending}
            onClick={() => setConfirmingRemove(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 text-sm">
      <div className="mb-1.5">
        <p className="truncate font-medium">{batch.recipe_name}</p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Layers className="h-3 w-3" />
          {empty ? (
            <span className="text-muted">All used up</span>
          ) : (
            <>
              <span className="font-medium text-foreground">{batch.portions_remaining}</span> of{" "}
              {batch.portions_total} portions left
            </>
          )}
        </p>
      </div>
      <div
        className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-background"
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
      <div className="flex items-center justify-between gap-3">
        <button
          disabled={pending || empty}
          onClick={() => startTransition(() => consumeBatchPortion(batch.id, 1))}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          1 used
        </button>
        <div className="flex shrink-0 gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="font-medium text-brand hover:text-brand-dark">
            Edit
          </button>
          <button onClick={() => setConfirmingRemove(true)} className="font-medium text-danger">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
