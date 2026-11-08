"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { confirmCooked, removeMealPlanEntry } from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import type { MealPlanEntry } from "@/lib/types";

export function MealEntryRow({ entry }: { entry: MealPlanEntry }) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"cook" | "remove" | null>(null);

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
      <div className="flex shrink-0 items-center gap-3">
        {!entry.cooked && (
          <button
            disabled={pending}
            onClick={() => {
              setAction("cook");
              startTransition(() => confirmCooked(entry.id));
            }}
            className="flex items-center gap-1.5 font-medium text-success disabled:cursor-wait disabled:opacity-60"
          >
            {pending && action === "cook" && <Spinner className="h-3.5 w-3.5" />}
            {pending && action === "cook" ? "Cooking…" : "Mark cooked"}
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => {
            setAction("remove");
            startTransition(() => removeMealPlanEntry(entry.id));
          }}
          className="flex items-center gap-1.5 text-danger disabled:cursor-wait disabled:opacity-60"
        >
          {pending && action === "remove" && <Spinner className="h-3.5 w-3.5" />}
          Remove
        </button>
      </div>
    </div>
  );
}
