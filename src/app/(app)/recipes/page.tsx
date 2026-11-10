import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { RecipeBrowser } from "@/components/recipe-views";
import { RecipeViewTabs } from "@/components/recipe-view-tabs";
import { computeRecipeMatches } from "@/lib/pantry-match";

export default async function RecipesPage({
  searchParams,
}: PageProps<"/recipes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const tag = typeof params.tag === "string" ? params.tag : "";
  const course = typeof params.course === "string" ? params.course : "";
  const minRating = typeof params.minRating === "string" ? params.minRating : "";
  const readyOnly = params.ready === "1";

  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  let query = supabase
    .from("recipes")
    .select("*")
    .or(`household_id.is.null,household_id.eq.${household.id}`)
    .order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (cuisine) query = query.eq("cuisine", cuisine);
  if (tag) query = query.contains("tags", [tag]);
  if (course) query = query.eq("course", course);

  const { data: recipes, error } = await query;
  if (error) throw new Error(error.message);

  const recipeIds = (recipes ?? []).map((r) => r.id);
  const [{ data: recipeIngredients }, { data: pantryItems }] = await Promise.all([
    recipeIds.length
      ? supabase
          .from("recipe_ingredients")
          .select("recipe_id, ingredient_name, unit, quantity")
          .in("recipe_id", recipeIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("pantry_items")
      .select("ingredient_name, unit, quantity")
      .eq("household_id", household.id),
  ]);
  const pantryMatch = computeRecipeMatches(recipeIngredients ?? [], pantryItems ?? []);

  const { data: allRecipes } = await supabase
    .from("recipes")
    .select("cuisine, tags")
    .or(`household_id.is.null,household_id.eq.${household.id}`);
  const cuisines = [...new Set((allRecipes ?? []).map((r) => r.cuisine).filter(Boolean))].sort();
  const tags = [...new Set((allRecipes ?? []).flatMap((r) => r.tags ?? []))].sort();
  const COURSES = [
    { value: "main", label: "Main" },
    { value: "side", label: "Side" },
    { value: "snack", label: "Snack" },
    { value: "dessert", label: "Dessert" },
  ];

  const { data: ratingRows } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("household_id", household.id);

  const ratingsByRecipe: Record<string, number[]> = {};
  for (const r of ratingRows ?? []) {
    const list = ratingsByRecipe[r.recipe_id] ?? [];
    list.push(r.rating);
    ratingsByRecipe[r.recipe_id] = list;
  }

  let visibleRecipes = minRating
    ? (recipes ?? []).filter((r) => {
        const list = ratingsByRecipe[r.id] ?? [];
        if (!list.length) return false;
        const avg = list.reduce((a, b) => a + b, 0) / list.length;
        return avg >= Number(minRating);
      })
    : (recipes ?? []);

  if (readyOnly) {
    visibleRecipes = visibleRecipes.filter((r) => {
      const m = pantryMatch[r.id];
      return m && m.total > 0 && m.covered === m.total;
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
          <p className="text-sm text-muted">
            {visibleRecipes.length} recipe{visibleRecipes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Add recipe
        </Link>
      </div>

      <RecipeViewTabs active="mine" />

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search recipes…"
          className="w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <select
          name="cuisine"
          defaultValue={cuisine}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c ?? ""}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="tag"
          defaultValue={tag}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="course"
          defaultValue={course}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All courses</option>
          {COURSES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          name="minRating"
          defaultValue={minRating}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Any rating</option>
          <option value="4">★★★★ & up</option>
          <option value="3">★★★ & up</option>
          <option value="2">★★ & up</option>
          <option value="1">★ & up</option>
        </select>
        <label className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <input type="checkbox" name="ready" value="1" defaultChecked={readyOnly} className="h-4 w-4 accent-brand" />
          I can make this now
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Filter
        </button>
      </form>

      {!visibleRecipes.length ? (
        <EmptyState />
      ) : (
        <RecipeBrowser recipes={visibleRecipes} ratings={ratingsByRecipe} pantryMatch={pantryMatch} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center">
      <p className="mb-3 text-muted">No recipes match yet.</p>
      <Link href="/recipes/new" className="font-medium text-brand">
        Add your first recipe →
      </Link>
    </div>
  );
}
