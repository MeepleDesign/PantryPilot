"use client";

import { useState, useTransition } from "react";
import { PackagePlus } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { logMealBatch } from "@/lib/actions/meal-batches";
import type { MealBatchStorage } from "@/lib/types";

export function LogBatchPrompt({
  entryId,
  recipeId,
  recipeName,
  defaultPortions,
  existingBatch,
}: {
  entryId: string;
  recipeId: string;
  recipeName: string;
  defaultPortions: number;
  existingBatch: { portions_total: number; storage_location: MealBatchStorage } | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [portions, setPortions] = useState(defaultPortions);
  const [storage, setStorage] = useState<MealBatchStorage>("freezer");
  const [pending, startTransition] = useTransition();
  const [logged, setLogged] = useState(existingBatch);

  if (logged) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <PackagePlus className="h-3.5 w-3.5" />
        Logged {logged.portions_total} portion{logged.portions_total === 1 ? "" : "s"} in the{" "}
        {logged.storage_location}
      </p>
    );
  }

  if (dismissed) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2">
      <span className="text-xs text-muted">Batch cooked? Log portions:</span>
      <input
        type="number"
        min={1}
        value={portions}
        onChange={(e) => setPortions(Number(e.target.value) || 1)}
        className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
      />
      <div className="flex overflow-hidden rounded-lg border border-border text-xs">
        {(["fridge", "freezer"] as const).map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setStorage(loc)}
            className={`px-2.5 py-1 capitalize transition-colors ${
              storage === loc ? "bg-brand/10 font-medium text-brand-dark" : "bg-surface text-muted"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await logMealBatch({
              recipe_id: recipeId,
              recipe_name: recipeName,
              meal_plan_entry_id: entryId,
              portions_total: portions,
              storage_location: storage,
              notes: null,
            });
            setLogged({ portions_total: portions, storage_location: storage });
          })
        }
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-3 w-3" />}
        Log batch
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs text-muted hover:text-foreground"
      >
        No thanks
      </button>
    </div>
  );
}
