"use client";

import { useState } from "react";
import type { RecipeIngredient } from "@/lib/types";

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const DEFAULT_SERVINGS = 2;

export function ScaledIngredients({
  ingredients,
  baseServings,
}: {
  ingredients: RecipeIngredient[];
  baseServings: number;
}) {
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const multiplier = servings / baseServings;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Ingredients</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Servings</span>
          <select
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:border-brand"
          >
            {SERVING_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
        {ingredients.map((ing) => (
          <li
            key={ing.id}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span>{ing.ingredient_name}</span>
            <span className="font-medium tabular-nums">
              {ing.quantity != null
                ? `${round(ing.quantity * multiplier)} ${ing.unit ?? ""}`
                : ing.unit ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
