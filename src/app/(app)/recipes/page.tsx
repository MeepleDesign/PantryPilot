import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { StaticStars } from "@/components/star-rating";
import type { Recipe } from "@/lib/types";

export default async function RecipesPage({
  searchParams,
}: PageProps<"/recipes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const tag = typeof params.tag === "string" ? params.tag : "";

  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  let query = supabase.from("recipes").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (cuisine) query = query.eq("cuisine", cuisine);
  if (tag) query = query.contains("tags", [tag]);

  const { data: recipes, error } = await query;
  if (error) throw new Error(error.message);

  const { data: allRecipes } = await supabase.from("recipes").select("cuisine, tags");
  const cuisines = [...new Set((allRecipes ?? []).map((r) => r.cuisine).filter(Boolean))].sort();
  const tags = [...new Set((allRecipes ?? []).flatMap((r) => r.tags ?? []))].sort();

  const { data: ratingRows } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("household_id", household.id);

  const ratingsByRecipe = new Map<string, number[]>();
  for (const r of ratingRows ?? []) {
    const list = ratingsByRecipe.get(r.recipe_id) ?? [];
    list.push(r.rating);
    ratingsByRecipe.set(r.recipe_id, list);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
          <p className="text-sm text-muted">
            {recipes?.length ?? 0} recipe{recipes?.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-dark"
        >
          + Add recipe
        </Link>
      </div>

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
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Filter
        </button>
      </form>

      {!recipes?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r: Recipe) => (
            <RecipeCard key={r.id} recipe={r} ratings={ratingsByRecipe.get(r.id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, ratings }: { recipe: Recipe; ratings: number[] }) {
  const avgRating = ratings.length
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block overflow-hidden rounded-xl border border-border bg-surface transition hover:border-brand hover:shadow-sm"
    >
      {recipe.image_url ? (
        <div className="relative h-32 w-full">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-background text-3xl">
          🍲
        </div>
      )}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-medium leading-snug">{recipe.name}</h3>
          {recipe.protein_tag && (
            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              {recipe.protein_tag}
            </span>
          )}
        </div>
        <p className="mb-1 text-xs text-muted">
          {[recipe.cuisine, recipe.diet].filter(Boolean).join(" · ")}
        </p>
        <div className="mb-2">
          {ratings.length > 0 ? (
            <StaticStars value={avgRating} count={ratings.length} />
          ) : (
            <span className="text-xs text-muted">No ratings yet</span>
          )}
        </div>
        {recipe.tags?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-4 text-xs text-muted">
          {recipe.total_time_minutes && <span>⏱ {recipe.total_time_minutes} min</span>}
          <span>🍽 2 servings</span>
          {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
        </div>
      </div>
    </Link>
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
