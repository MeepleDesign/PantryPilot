"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  isMulticookerRecipe,
  machineHasCapacityLimit,
  maxServingsForMachine,
} from "@/lib/cooking-machine";
import { smartRound, maxServingsFromPantry } from "@/lib/recipe-scaling";
import type { RecipeIngredient } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const DEFAULT_SERVINGS = 2;

type PantryStock = { ingredient_name: string; unit: string | null; quantity: number };

export function ScaledIngredients({
  ingredients,
  baseServings,
  tags = [],
  cookingMachine,
  pantryItems = [],
}: {
  ingredients: RecipeIngredient[];
  baseServings: number;
  tags?: string[];
  cookingMachine?: string;
  pantryItems?: PantryStock[];
}) {
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const multiplier = servings / baseServings;
  const maxServings = maxServingsForMachine(cookingMachine);
  const overCapacity =
    isMulticookerRecipe(tags) && machineHasCapacityLimit(cookingMachine) && servings > maxServings;
  const pantryMaxServings = maxServingsFromPantry(ingredients, pantryItems, baseServings);
  const servingOptions = [...new Set([...SERVING_OPTIONS, servings])].sort((a, b) => a - b);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">
          Ingredients <span className="hidden font-normal text-muted print:inline">(for {servings} servings)</span>
        </h2>
        <div className="flex items-center gap-2 text-sm print:hidden">
          <span className="text-muted">Servings</span>
          <select
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:border-brand"
          >
            {servingOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {pantryMaxServings != null && pantryMaxServings > 0 && pantryMaxServings !== servings && (
        <button
          type="button"
          onClick={() => setServings(pantryMaxServings)}
          className="mb-3 flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark print:hidden"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Scale to what&apos;s in your pantry ({pantryMaxServings} serving
          {pantryMaxServings === 1 ? "" : "s"})
        </button>
      )}
      {pantryMaxServings === 0 && (
        <p className="mb-3 text-xs text-warn">
          Your pantry doesn&apos;t have enough of a tracked ingredient to make even one serving.
        </p>
      )}
      {overCapacity && (
        <p className="mb-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          ⚠ {servings} servings may exceed the {cookingMachine}&apos;s bowl capacity.{" "}
          {maxServings} servings is the recommended max for this cook method.
        </p>
      )}
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span>{ing.ingredient_name}</span>
            <span className="font-medium tabular-nums">
              {ing.quantity != null
                ? `${smartRound(ing.quantity * multiplier, ing.unit)} ${ing.unit ?? ""}`
                : ing.unit ?? "-"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
