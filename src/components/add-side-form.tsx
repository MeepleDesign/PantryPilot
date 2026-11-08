"use client";

import { useState, useTransition } from "react";
import { addMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import type { MealSlot, Recipe } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8];
const DEFAULT_SERVINGS = 2;

export function AddSideForm({
  date,
  mealSlot,
  parentEntryId,
  sideRecipes,
  onDone,
}: {
  date: string;
  mealSlot: MealSlot;
  parentEntryId: string;
  sideRecipes: Recipe[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState(DEFAULT_SERVINGS);

  const baseServings = sideRecipes.find((r) => r.id === recipeId)?.servings || 1;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 pl-6 text-xs">
      <select
        value={recipeId}
        onChange={(e) => setRecipeId(e.target.value)}
        className="min-w-[120px] flex-1 rounded-lg border border-border bg-background px-2 py-1"
      >
        <option value="" disabled>
          Choose a side…
        </option>
        {sideRecipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <select
        value={servings}
        onChange={(e) => setServings(Number(e.target.value))}
        className="rounded-lg border border-border bg-background px-2 py-1"
      >
        {SERVING_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s} servings
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !recipeId}
        onClick={() => {
          startTransition(async () => {
            await addMealPlanEntry({
              plan_date: date,
              recipe_id: recipeId,
              meal_slot: mealSlot,
              batch_multiplier: servings / baseServings,
              side_of: parentEntryId,
            });
            onDone();
          });
        }}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1 font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-3 w-3" />}
        {pending ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={onDone} className="text-muted hover:text-foreground">
        Cancel
      </button>
    </div>
  );
}
