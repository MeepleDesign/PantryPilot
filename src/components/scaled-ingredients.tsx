"use client";

import { useState } from "react";
import type { RecipeIngredient } from "@/lib/types";

export function ScaledIngredients({
  ingredients,
  baseServings,
}: {
  ingredients: RecipeIngredient[];
  baseServings: number;
}) {
  const [multiplier, setMultiplier] = useState(1);
  const servings = Math.round(baseServings * multiplier);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Ingredients</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Batch</span>
          <select
            value={multiplier}
            onChange={(e) => setMultiplier(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:border-brand"
          >
            {[0.5, 1, 1.5, 2, 3].map((m) => (
              <option key={m} value={m}>
                {m}×{" "}
              </option>
            ))}
          </select>
          <span className="text-muted">({servings} servings)</span>
        </div>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
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
