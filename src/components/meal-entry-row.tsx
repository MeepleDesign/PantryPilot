"use client";

import { useTransition } from "react";
import Link from "next/link";
import { confirmCooked, removeMealPlanEntry } from "@/lib/actions/planner";
import type { MealPlanEntry } from "@/lib/types";

export function MealEntryRow({ entry }: { entry: MealPlanEntry }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <div className="min-w-0">
        <Link href={`/recipes/${entry.recipe_id}`} className="font-medium hover:text-brand">
          {entry.recipes?.name}
        </Link>
        <p className="text-xs text-muted">
          {entry.meal_slot} · {entry.batch_multiplier}× batch
          {entry.cooked && <span className="text-success"> · cooked ✓</span>}
        </p>
      </div>
      <div className="flex shrink-0 gap-3">
        {!entry.cooked && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => confirmCooked(entry.id))}
            className="font-medium text-success"
          >
            Mark cooked
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(() => removeMealPlanEntry(entry.id))}
          className="text-danger"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
