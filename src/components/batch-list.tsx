"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Snowflake, Refrigerator, Layers } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { LogBatchManual } from "@/components/log-batch-manual";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { formatShortDate } from "@/lib/format-date";
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
        <EmptyState
          icon={Snowflake}
          title="No batch-cooked meals logged yet"
          body="Mark a planner entry as cooked to log portions, or add one manually below."
          compact
        />
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
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
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
  const [qtyInput, setQtyInput] = useState(String(batch.portions_remaining));
  const [location, setLocation] = useState<MealBatchStorage>(batch.storage_location);
  const showToast = useToast();

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
            Qty
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onBlur={() => {
                if (!qtyInput.trim()) setQtyInput("0");
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
                const qty = Number(qtyInput) || 0;
                await updateMealBatch(batch.id, {
                  recipe_name: name.trim(),
                  portions_total: Math.max(batch.portions_total, qty, 1),
                  portions_remaining: qty,
                  storage_location: location,
                });
                setEditing(false);
                showToast("Batch updated");
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
            className="flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-danger-foreground disabled:cursor-wait disabled:opacity-60"
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

  const LocIcon = LOCATION_ICONS[batch.storage_location];
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-3 text-sm transition-colors hover:bg-background/60">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-dark"
        >
          <LocIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {batch.recipe_id ? (
            <Link
              href={`/recipes/${batch.recipe_id}`}
              className="block truncate font-medium hover:text-brand-dark hover:underline"
            >
              {batch.recipe_name}
            </Link>
          ) : (
            <p className="truncate font-medium">{batch.recipe_name}</p>
          )}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
            {empty ? (
              <span>All used up</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-1.5 py-px text-[11px] font-medium text-brand-dark">
                <Layers className="h-3 w-3" />
                {batch.portions_remaining} portion{batch.portions_remaining === 1 ? "" : "s"} left
              </span>
            )}
            {batch.cooked_date && <span>cooked {formatShortDate(batch.cooked_date)}</span>}
          </p>
          {!empty && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {Array.from({ length: batch.portions_remaining }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  title="Tick off a used portion"
                  aria-label="Tick off a used portion"
                  disabled={pending}
                  onClick={() => startTransition(() => consumeBatchPortion(batch.id, 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-brand/25 bg-surface text-brand/60 transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand-dark disabled:cursor-wait disabled:opacity-60"
                >
                  {pending ? <Spinner className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                </button>
              ))}
              <span className="ml-1 text-[11px] text-muted">tap to use a portion</span>
            </div>
          )}
        </div>
      </div>
      <div className="-ml-2 flex w-full shrink-0 gap-1 pl-12 sm:ml-0 sm:w-auto sm:pl-0">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-brand-dark transition-colors hover:bg-brand/10"
        >
          Edit
        </button>
        <button
          onClick={() => setConfirmingRemove(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
