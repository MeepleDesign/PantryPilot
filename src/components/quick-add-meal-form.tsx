"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addMealPlanEntry, addBatchMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import {
  isMulticookerRecipe,
  machineHasCapacityLimit,
  maxServingsForMachine,
} from "@/lib/cooking-machine";
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
  cookingMachine,
}: {
  date: string;
  recipes: Recipe[];
  batches: AvailableBatch[];
  cookingMachine?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"recipe" | "batch">("recipe");
  const [recipeId, setRecipeId] = useState("");
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [batchQty, setBatchQty] = useState("1");

  const selectedRecipe = recipes.find((r) => r.id === recipeId);
  const baseServings = selectedRecipe?.servings || 1;
  const batchMultiplier = servings / baseServings;
  const maxServings = maxServingsForMachine(cookingMachine);
  const overCapacity =
    isMulticookerRecipe(selectedRecipe?.tags ?? []) &&
    machineHasCapacityLimit(cookingMachine) &&
    servings > maxServings;
  const selectedBatch = batches.find((b) => b.id === batchId);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-brand-dark transition-colors hover:bg-brand/5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add meal
      </button>
    );
  }

  return (
    <div className="animate-fade-in-up bg-background/50 px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        {batches.length > 0 ? (
        <div className="flex overflow-hidden rounded-lg border border-border bg-surface text-xs">
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
        ) : (
          <span className="text-xs font-medium text-muted">Add a meal</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="rounded-md p-1 text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

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
              setOpen(false);
            });
          }}
          className="flex flex-wrap gap-2"
        >
          <select
            name="recipe_id"
            required
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="min-w-[140px] flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <select
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
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
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-3 w-3" />}
            {pending ? "Adding…" : "Add"}
          </button>
          {overCapacity && (
            <p className="w-full text-xs text-warn">
              ⚠ {servings} servings may exceed the {cookingMachine}&apos;s bowl capacity (
              {maxServings} max recommended).
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
              setOpen(false);
            });
          }}
          className="flex flex-wrap gap-2"
        >
          <select
            required
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="min-w-[140px] flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
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
            className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={pending || !batchId}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:cursor-wait disabled:opacity-60"
          >
            {pending && <Spinner className="h-3 w-3" />}
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}
