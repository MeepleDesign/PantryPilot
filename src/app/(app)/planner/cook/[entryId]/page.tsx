import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarkCookedButton } from "@/components/cook-view-actions";

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function methodSteps(method: string | null): string[] {
  if (!method) return [];
  return method
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export default async function CookViewPage({
  params,
}: PageProps<"/planner/cook/[entryId]">) {
  const { entryId } = await params;
  const supabase = await createClient();

  const { data: mainEntry, error } = await supabase
    .from("meal_plan_entries")
    .select("*, recipes(*, recipe_ingredients(*))")
    .eq("id", entryId)
    .single();

  if (error || !mainEntry) notFound();

  const { data: sideEntries } = await supabase
    .from("meal_plan_entries")
    .select("*, recipes(*, recipe_ingredients(*))")
    .eq("side_of", entryId);

  const label = new Date(mainEntry.plan_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <Link href="/planner" className="text-sm text-muted hover:text-foreground">
          ← Planner
        </Link>
      </div>

      <h1 className="mb-1 mt-3 text-2xl font-semibold tracking-tight">
        Cooking: {mainEntry.recipes?.name}
      </h1>
      <p className="mb-6 text-sm text-muted capitalize">
        {label} · {mainEntry.meal_slot}
      </p>

      <RecipeBlock
        label="Main"
        entry={mainEntry}
      />

      {(sideEntries ?? []).map((side) => (
        <RecipeBlock key={side.id} label="Side" entry={side} />
      ))}
    </div>
  );
}

function RecipeBlock({
  label,
  entry,
}: {
  label: "Main" | "Side";
  entry: {
    id: string;
    cooked: boolean;
    batch_multiplier: number;
    recipes: {
      name: string;
      servings: number;
      prep_note: string | null;
      method: string | null;
      recipe_ingredients: {
        id: string;
        ingredient_name: string;
        quantity: number | null;
        unit: string | null;
        sort_order: number;
      }[];
    } | null;
  };
}) {
  const recipe = entry.recipes;
  if (!recipe) return null;

  const servings = Math.round(entry.batch_multiplier * recipe.servings);
  const ingredients = [...recipe.recipe_ingredients].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const steps = methodSteps(recipe.method);

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <span className="mb-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
            {label}
          </span>
          <h2 className="font-medium leading-snug">
            {recipe.name} <span className="font-normal text-muted">· {servings} servings</span>
          </h2>
        </div>
        <MarkCookedButton entryId={entry.id} cooked={entry.cooked} />
      </div>

      {recipe.prep_note && (
        <div className="mb-3 flex gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm">
          <span>⏰</span>
          <p>{recipe.prep_note}</p>
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            Ingredients
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border bg-background">
            {ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span>{ing.ingredient_name}</span>
                <span className="font-medium tabular-nums">
                  {ing.quantity != null
                    ? `${round(ing.quantity * entry.batch_multiplier)} ${ing.unit ?? ""}`
                    : (ing.unit ?? "—")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">
            Method
          </h3>
          <ol className="space-y-2 text-sm leading-relaxed">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 font-medium text-brand-dark">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
