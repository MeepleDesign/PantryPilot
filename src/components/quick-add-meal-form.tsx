"use client";

import { useState, useTransition } from "react";
import { addMealPlanEntry, addBatchMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import { OMNICOOK_TAG, OMNICOOK_MAX_SERVINGS } from "@/lib/omnicook";
import type { MealSlot, Recipe } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8];
const DEFAULT_SERVINGS = 2;

type AvailableBatch = {
  id: string;
  recipe_name: string;
  portions_remaining: number;
  storage_location: "fridge" | "freezer";
};

export function QuickAddMealForm({
  date,
  recipes,
  batches,
}: {
  date: string;
  recipes: Recipe[];
  batches: AvailableBatch[];
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"recipe" | "batch">("recipe");
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [batchQty, setBatchQty] = useState("1");

  const selectedRecipe = recipes.find((r) => r.id === recipeId);
  const baseServings = selectedRecipe?.servings || 1;
  const batchMultiplier = servings / baseServings;
  const isOmniCook = selectedRecipe?.tags.includes(OMNICOOK_TAG) ?? false;
  const overCapacity = isOmniCook && servings > OMNICOOK_MAX_SERVINGS;
  const selectedBatch = batches.find((b) => b.id === batchId);

  return (
    <div className="px-3 py-2">
      {batches.length > 0 && (
        <div className="mb-2 flex overflow-hidden rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setMode("recipe")}
            className={`px-2.5 py-1 transition-colors ${
              mode === "recipe" ? "bg-brand/10 font-medium text-brand-dark" : "text-muted"
            }`}
          >
            Cook a recipe
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`px-2.5 py-1 transition-colors ${
              mode === "batch" ? "bg-brand/10 font-medium text-brand-dark" : "text-muted"
            }`}
          >
            Eat from a batch
          </button>
        </div>
      )}

      {mode === "recipe" ? (
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
          className="flex flex-wrap gap-2"
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
          {overCapacity && (
            <p className="w-full text-xs text-warn">
              ⚠ {servings} servings may exceed the Omni Cook&apos;s bowl capacity (
              {OMNICOOK_MAX_SERVINGS} max recommended).
            </p>
          )}
        </form>
      ) : (
        <form
          action={(formData) => {
            if (!batchId) return;
            startTransition(async () => {
              await addBatchMealPlanEntry({
                plan_date: date,
                batch_id: batchId,
                batch_qty: Number(batchQty) || 1,
                meal_slot: String(formData.get("meal_slot")) as MealSlot,
              });
            });
          }}
          className="flex flex-wrap gap-2"
        >
          <select
            required
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.recipe_name} ({b.portions_remaining} left, {b.storage_location})
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
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={selectedBatch?.portions_remaining ?? 1}
            value={batchQty}
            onChange={(e) => setBatchQty(e.target.value)}
            onBlur={() => {
              if (!batchQty.trim() || Number(batchQty) < 1) setBatchQty("1");
            }}
            className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pending || !batchId}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-3 w-3" />}
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
