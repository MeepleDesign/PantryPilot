"use client";

import { useState, useTransition } from "react";
import { addMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import type { MealSlot, Recipe } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8];
const DEFAULT_SERVINGS = 2;

export function QuickAddMealForm({
  date,
  recipes,
}: {
  date: string;
  recipes: Recipe[];
}) {
  const [pending, startTransition] = useTransition();
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState(DEFAULT_SERVINGS);

  const baseServings = recipes.find((r) => r.id === recipeId)?.servings || 1;
  const batchMultiplier = servings / baseServings;

  return (
    <form
      action={(formData) => {
        if (!recipeId) return;
        startTransition(async () => {
          await addMealPlanEntry({
            plan_date: date,
            recipe_id: recipeId,
            meal_slot: String(formData.get("meal_slot")) as MealSlot,
            batch_multiplier: batchMultiplier,
          });
        });
      }}
      className="flex flex-wrap gap-2 px-3 py-2"
    >
      <select
        name="recipe_id"
        required
        value={recipeId}
        onChange={(e) => setRecipeId(e.target.value)}
        className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
      >
        <option value="" disabled>
          Choose a recipe…
        </option>
        {recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <select
        name="meal_slot"
        defaultValue="dinner"
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
      >
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
        <option value="snack">Snack</option>
      </select>
      <select
        value={servings}
        onChange={(e) => setServings(Number(e.target.value))}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
      >
        {SERVING_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s} servings
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-3 w-3" />}
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
