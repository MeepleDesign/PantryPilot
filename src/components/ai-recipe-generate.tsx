"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { generateRecipe } from "@/lib/actions/recipe-generate";
import { CUISINES, RECIPE_DIETS } from "@/lib/taxonomies";
import type { ExtractedRecipe } from "@/lib/recipe-extraction-types";
import type { RecipeCourse } from "@/lib/types";

const COURSES: { value: RecipeCourse; label: string }[] = [
  { value: "main", label: "Main" },
  { value: "side", label: "Side" },
  { value: "snack", label: "Snack" },
  { value: "dessert", label: "Dessert" },
];

export function AiRecipeGenerate({
  onImported,
  isPro,
  cookingMachine,
  pantryHints = [],
}: {
  onImported: (data: ExtractedRecipe) => void;
  isPro: boolean;
  cookingMachine: string;
  pantryHints?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [course, setCourse] = useState<RecipeCourse>("main");
  const [cookingMethod, setCookingMethod] = useState<"any" | "multicooker" | "manual">("any");
  const [servings, setServings] = useState(4);
  const [useItUp, setUseItUp] = useState(false);
  const [notes, setNotes] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand/10"
      >
        <Sparkles className="h-4 w-4" />
        Generate a recipe with AI
        {!isPro && (
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold">
            <Lock className="h-3 w-3" />
            Pro
          </span>
        )}
      </button>
    );
  }

  if (!isPro) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-border bg-background p-4 text-center text-sm">
        <p className="mb-3 text-muted">
          AI recipe generation is a Pro feature — invent a recipe from a cuisine, diet, cooking
          method and what&apos;s already in your pantry.
        </p>
        <Link
          href="/billing"
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-surface text-brand shadow-sm">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-sm font-medium">Generate a recipe with AI</p>
          <p className="text-xs text-muted">
            Pick what you&apos;re after and we&apos;ll invent a recipe for you to review below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="">Any cuisine</option>
          {CUISINES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={diet}
          onChange={(e) => setDiet(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="">Any diet</option>
          {RECIPE_DIETS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value as RecipeCourse)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          {COURSES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={cookingMethod}
          onChange={(e) => setCookingMethod(e.target.value as typeof cookingMethod)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="any">Any method</option>
          <option value="multicooker">{cookingMachine}</option>
          <option value="manual">Manual / stovetop</option>
        </select>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          Servings
          <input
            type="number"
            min={1}
            max={12}
            value={servings}
            onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        {pantryHints.length > 0 && (
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={useItUp}
              onChange={(e) => setUseItUp(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand"
            />
            Use up what I have
          </label>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything else? (e.g. 'kid-friendly', 'no nuts')"
        rows={2}
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const data = await generateRecipe({
                  cuisine: cuisine || null,
                  diet: diet || null,
                  course,
                  cookingMethod,
                  servings,
                  useItUp,
                  pantryHints,
                  notes: notes.trim() || null,
                });
                onImported(data);
                setOpen(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Couldn't generate a recipe — try again.");
              }
            });
          }}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
        >
          {pending && <Spinner className="h-4 w-4" />}
          {pending ? "Generating…" : "Generate recipe"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
