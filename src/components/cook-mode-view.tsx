"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ListChecks, UtensilsCrossed } from "lucide-react";

export type CookModeIngredient = {
  id: string;
  ingredient_name: string;
  amount: string;
};

export function CookModeView({
  steps,
  ingredients,
}: {
  steps: string[];
  ingredients: CookModeIngredient[];
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  if (steps.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setStepIndex(0);
          setOpen(true);
        }}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand/10"
      >
        <UtensilsCrossed className="h-4 w-4" />
        Start cooking mode
      </button>
    );
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border p-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
        <span className="text-sm font-medium text-muted">
          Step {stepIndex + 1} of {steps.length}
        </span>
        <button
          type="button"
          onClick={() => setShowIngredients(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
        >
          <ListChecks className="h-4 w-4" />
          Ingredients
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 sm:p-10">
        <p className="max-w-2xl text-center text-2xl font-medium leading-relaxed sm:text-3xl">
          {steps[stepIndex]}
        </p>
      </div>

      <div className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-4 text-base font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-4 text-base font-medium text-brand-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {showIngredients && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center"
          onClick={() => setShowIngredients(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-4 sm:max-w-md sm:rounded-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Ingredients</h3>
              <button
                type="button"
                onClick={() => setShowIngredients(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border bg-background">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                >
                  <span>{ing.ingredient_name}</span>
                  <span className="font-medium tabular-nums">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
