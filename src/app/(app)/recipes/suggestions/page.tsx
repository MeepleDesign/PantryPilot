import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { RecipeBrowser } from "@/components/recipe-views";
import { RecipeViewTabs } from "@/components/recipe-view-tabs";
import { EmptyState } from "@/components/empty-state";
import { computeRecipeMatches } from "@/lib/pantry-match";
import { computeExpiringCounts, matchesMethod } from "@/lib/recipe-suggestions";
import type { SuggestionMethod } from "@/lib/recipe-suggestions";
import type { Recipe } from "@/lib/types";

const SUGGESTION_LIMIT = 24;

export default async function RecipeSuggestionsPage({
  searchParams,
}: PageProps<"/recipes/suggestions">) {
  const params = await searchParams;
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const method = (typeof params.method === "string" ? params.method : "") as SuggestionMethod;
  const mode = params.mode === "useup" ? "useup" : "have";

  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { data: rawRecipes, error } = await supabase
    .from("recipes")
    .select("*")
    .or(`household_id.is.null,household_id.eq.${household.id}`)
    .order("name");
  if (error) throw new Error(error.message);
  const recipes = (rawRecipes as Recipe[] | null) ?? [];

  const recipeIds = recipes.map((r) => r.id);
  const [{ data: recipeIngredients }, { data: pantryItems }, { data: ratingRows }] =
    await Promise.all([
      recipeIds.length
        ? supabase
            .from("recipe_ingredients")
            .select("recipe_id, ingredient_name, unit, quantity")
            .in("recipe_id", recipeIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("pantry_items")
        .select("ingredient_name, unit, quantity, expiry_date")
        .eq("household_id", household.id),
      supabase.from("recipe_ratings").select("recipe_id, rating").eq("household_id", household.id),
    ]);

  const pantryMatch = computeRecipeMatches(recipeIngredients ?? [], pantryItems ?? []);
  const expiringCounts = computeExpiringCounts(recipeIngredients ?? [], pantryItems ?? []);

  const ratingsByRecipe: Record<string, number[]> = {};
  for (const r of ratingRows ?? []) {
    const list = ratingsByRecipe[r.recipe_id] ?? [];
    list.push(Number(r.rating));
    ratingsByRecipe[r.recipe_id] = list;
  }

  const cuisines = [...new Set(recipes.map((r) => r.cuisine).filter(Boolean))].sort();

  let candidates = recipes.filter((r) => matchesMethod(r.tags ?? [], method));
  if (cuisine) candidates = candidates.filter((r) => r.cuisine === cuisine);

  if (mode === "useup") {
    candidates = candidates.filter((r) => (expiringCounts[r.id] ?? 0) > 0);
    candidates.sort((a, b) => {
      const diff = (expiringCounts[b.id] ?? 0) - (expiringCounts[a.id] ?? 0);
      if (diff !== 0) return diff;
      return matchRatio(pantryMatch[b.id]) - matchRatio(pantryMatch[a.id]);
    });
  } else {
    candidates = candidates.filter((r) => (pantryMatch[r.id]?.covered ?? 0) > 0);
    candidates.sort((a, b) => matchRatio(pantryMatch[b.id]) - matchRatio(pantryMatch[a.id]));
  }

  const suggestions = candidates.slice(0, SUGGESTION_LIMIT);

  const modeHref = (m: "have" | "useup") => {
    const qs = new URLSearchParams();
    if (cuisine) qs.set("cuisine", cuisine);
    if (method) qs.set("method", method);
    qs.set("mode", m);
    return `/recipes/suggestions?${qs.toString()}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-brand" />
          Recipe Suggestions
        </h1>
        <p className="text-sm text-muted">
          {mode === "useup"
            ? "Recipes that use ingredients close to their best-before date."
            : "Recipes you can mostly make from what's already in your pantry."}
        </p>
      </div>

      <RecipeViewTabs active="suggestions" />

      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-surface p-1 text-sm">
        <Link
          href={modeHref("have")}
          className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors ${
            mode === "have" ? "bg-brand/10 text-brand-dark" : "text-muted hover:text-foreground"
          }`}
        >
          What I have
        </Link>
        <Link
          href={modeHref("useup")}
          className={`flex-1 rounded-md px-3 py-1.5 text-center font-medium transition-colors ${
            mode === "useup" ? "bg-brand/10 text-brand-dark" : "text-muted hover:text-foreground"
          }`}
        >
          Use it up
        </Link>
      </div>

      <form method="get" className="mb-6 flex flex-wrap gap-2">
        <input type="hidden" name="mode" value={mode} />
        <select
          name="cuisine"
          defaultValue={cuisine}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand sm:flex-none"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c ?? ""}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="method"
          defaultValue={method}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand sm:flex-none"
        >
          <option value="">Any cook method</option>
          <option value="multicooker">Multicooker ({household.cooking_machine})</option>
          <option value="manual">Manual / stovetop</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          Apply
        </button>
      </form>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <EmptyState
            icon={Sparkles}
            title="No matching suggestions"
            body={
              mode === "useup"
                ? "Nothing in your pantry is expiring soon that matches these filters — try widening them."
                : "Nothing matches these filters well yet — try a different cuisine or method, or add more to your pantry."
            }
          />
        </div>
      ) : (
        <RecipeBrowser
          recipes={suggestions}
          ratings={ratingsByRecipe}
          pantryMatch={pantryMatch}
          expiringCounts={mode === "useup" ? expiringCounts : undefined}
        />
      )}
    </div>
  );
}

function matchRatio(match?: { covered: number; total: number }) {
  if (!match || match.total === 0) return 0;
  return match.covered / match.total;
}
