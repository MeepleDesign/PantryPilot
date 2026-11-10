"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { logMealBatch } from "@/lib/actions/meal-batches";
import type { MealBatchStorage } from "@/lib/types";

export function LogBatchManual({ recipes }: { recipes: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [portionsInput, setPortionsInput] = useState("4");
  const [storage, setStorage] = useState<MealBatchStorage>("freezer");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <Plus className="h-4 w-4" />
        Log a batch
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          await logMealBatch({
            recipe_id: recipeId || null,
            recipe_name: name.trim(),
            meal_plan_entry_id: null,
            portions_total: Number(portionsInput) || 1,
            storage_location: storage,
            notes: null,
          });
          setOpen(false);
          setName("");
          setRecipeId("");
          setPortionsInput("4");
        });
      }}
      className="space-y-2 rounded-lg border border-dashed border-border bg-background p-3"
    >
      {recipes.length > 0 && (
        <select
          value={recipeId}
          onChange={(e) => {
            const r = recipes.find((r) => r.id === e.target.value);
            setRecipeId(e.target.value);
            if (r) setName(r.name);
          }}
          className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
        >
          <option value="">Based on a saved recipe (optional)</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What did you make?"
        required
        className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={portionsInput}
          onChange={(e) => setPortionsInput(e.target.value)}
          onBlur={() => {
            if (!portionsInput.trim() || Number(portionsInput) < 1) setPortionsInput("1");
          }}
          className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          aria-label="Portions"
        />
        <div className="flex overflow-hidden rounded-lg border border-border text-xs">
          {(["fridge", "freezer"] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setStorage(loc)}
              className={`px-2.5 py-1.5 capitalize transition-colors ${
                storage === loc ? "bg-brand/10 font-medium text-brand-dark" : "bg-surface text-muted"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
        >
          {pending && <Spinner className="h-3 w-3" />}
          Log
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
