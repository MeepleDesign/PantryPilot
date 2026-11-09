"use client";

import { useState, useTransition } from "react";
import { addMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import { OMNICOOK_TAG, OMNICOOK_MAX_SERVINGS } from "@/lib/omnicook";
import type { MealSlot } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8];
const DEFAULT_SERVINGS = 2;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AddToPlanForm({
  recipeId,
  baseServings,
  tags = [],
}: {
  recipeId: string;
  baseServings: number;
  tags?: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const isOmniCook = tags.includes(OMNICOOK_TAG);
  const overCapacity = isOmniCook && servings > OMNICOOK_MAX_SERVINGS;

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm"
      action={(formData) => {
        startTransition(async () => {
          await addMealPlanEntry({
            recipe_id: recipeId,
            plan_date: String(formData.get("plan_date")),
            meal_slot: String(formData.get("meal_slot")) as MealSlot,
            batch_multiplier: servings / (baseServings || 1),
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
        <span className="mb-1 block text-muted">Servings</span>
        <select
          value={servings}
          onChange={(e) => setServings(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {SERVING_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s} servings
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Adding…" : "Add to plan"}
      </button>
      {overCapacity && (
        <p className="w-full text-xs text-warn">
          ⚠ {servings} servings may exceed the Omni Cook's bowl capacity ({OMNICOOK_MAX_SERVINGS}{" "}
          max recommended).
        </p>
      )}
    </form>
  );
}
