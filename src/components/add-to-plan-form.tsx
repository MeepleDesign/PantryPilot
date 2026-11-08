"use client";

import { useTransition } from "react";
import { addMealPlanEntry } from "@/lib/actions/planner";
import type { MealSlot } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AddToPlanForm({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3"
      action={(formData) => {
        startTransition(async () => {
          await addMealPlanEntry({
            recipe_id: recipeId,
            plan_date: String(formData.get("plan_date")),
            meal_slot: String(formData.get("meal_slot")) as MealSlot,
            batch_multiplier: Number(formData.get("batch_multiplier")),
          });
        });
      }}
    >
      <label className="text-xs">
        <span className="mb-1 block text-muted">Date</span>
        <input
          type="date"
          name="plan_date"
          defaultValue={todayIso()}
          required
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-muted">Meal</span>
        <select
          name="meal_slot"
          defaultValue="dinner"
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-muted">Batch</span>
        <select
          name="batch_multiplier"
          defaultValue="1"
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {[0.5, 1, 1.5, 2, 3].map((m) => (
            <option key={m} value={m}>
              {m}×
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to plan"}
      </button>
    </form>
  );
}
