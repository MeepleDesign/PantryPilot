import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export default async function RecipesPage({
  searchParams,
}: PageProps<"/recipes">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";

  const supabase = await createClient();

  let query = supabase.from("recipes").select("*").order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  if (cuisine) query = query.eq("cuisine", cuisine);

  const { data: recipes, error } = await query;
  if (error) throw new Error(error.message);

  const { data: cuisineRows } = await supabase
    .from("recipes")
    .select("cuisine")
    .not("cuisine", "is", null);
  const cuisines = [...new Set((cuisineRows ?? []).map((r) => r.cuisine))].sort();

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
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-medium leading-snug">{recipe.name}</h3>
        {recipe.protein_tag && (
          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
            {recipe.protein_tag}
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-muted">
        {[recipe.cuisine, recipe.diet].filter(Boolean).join(" · ")}
      </p>
      <div className="flex gap-4 text-xs text-muted">
        {recipe.total_time_minutes && <span>⏱ {recipe.total_time_minutes} min</span>}
        <span>🍽 {recipe.servings} servings</span>
        {recipe.calories && <span>🔥 {recipe.calories} kcal</span>}
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
