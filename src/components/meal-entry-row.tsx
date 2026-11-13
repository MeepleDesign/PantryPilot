"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  confirmCooked,
  confirmBatchEntryCooked,
  removeMealPlanEntry,
} from "@/lib/actions/planner";
import { Spinner } from "@/components/spinner";
import { AddSideForm } from "@/components/add-side-form";
import type { MealPlanEntry, Recipe } from "@/lib/types";

export function MealEntryRow({
  entry,
  sides = [],
  sideRecipes = [],
}: {
  entry: MealPlanEntry;
  sides?: MealPlanEntry[];
  sideRecipes?: Recipe[];
}) {
  const [addingSide, setAddingSide] = useState(false);

  return (
    <div className="px-3 py-2">
      <EntryLine entry={entry} cookHref={`/planner/cook/${entry.id}`} />
      {sides.map((side) => (
        <div key={side.id} className="pl-6">
          <EntryLine entry={side} isSide />
        </div>
      ))}
      {addingSide ? (
        <AddSideForm
          date={entry.plan_date}
          mealSlot={entry.meal_slot}
          parentEntryId={entry.id}
          sideRecipes={sideRecipes}
          onDone={() => setAddingSide(false)}
        />
      ) : (
        sideRecipes.length > 0 && (
          <button
            onClick={() => setAddingSide(true)}
            className="ml-6 mt-1 text-xs font-medium text-brand"
          >
            + Add side
          </button>
        )
      )}
    </div>
  );
}

function EntryLine({
  entry,
  isSide,
  cookHref,
}: {
  entry: MealPlanEntry;
  isSide?: boolean;
  cookHref?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"cook" | "remove" | null>(null);
  const isBatch = !!entry.batch_id;

  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm transition-opacity duration-200">
      <div className="min-w-0">
        {isBatch ? (
          <span className="font-medium">
            {isSide && <span className="mr-1 text-muted">↳</span>}
            {entry.batch?.recipe_name ?? "Batch"}
          </span>
        ) : (
          <Link href={`/recipes/${entry.recipe_id}`} className="font-medium hover:text-brand">
            {isSide && <span className="mr-1 text-muted">↳</span>}
            {entry.recipes?.name}
          </Link>
        )}
        <p className="text-xs text-muted">
          {!isSide && <span className="capitalize">{entry.meal_slot} · </span>}
          {isBatch
            ? `${entry.batch_qty ?? 1} portion${(entry.batch_qty ?? 1) === 1 ? "" : "s"} from batch`
            : `${Math.round(entry.batch_multiplier * (entry.recipes?.servings ?? 1))} servings`}
          {entry.cooked && (
            <span className="text-success"> · {isBatch ? "eaten ✓" : "cooked ✓"}</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {!isBatch && cookHref && (
          <Link href={cookHref} className="font-medium text-brand">
            Cook
          </Link>
        )}
        {!entry.cooked && (
          <button
            disabled={pending}
            onClick={() => {
              setAction("cook");
              startTransition(() =>
                isBatch ? confirmBatchEntryCooked(entry.id) : confirmCooked(entry.id),
              );
            }}
            className="flex items-center gap-1.5 font-medium text-success disabled:cursor-wait disabled:opacity-60"
          >
            {pending && action === "cook" && <Spinner className="h-3.5 w-3.5" />}
            {pending && action === "cook"
              ? isBatch
                ? "Marking…"
                : "Cooking…"
              : isBatch
                ? "Mark eaten"
                : "Mark cooked"}
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
