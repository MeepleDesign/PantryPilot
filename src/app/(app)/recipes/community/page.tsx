import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { RecipeViewTabs } from "@/components/recipe-view-tabs";
import { CommunityRecipeList, type CommunityRecipeCard } from "@/components/community-recipe-list";
import {
  getCommunityRatings,
  getCommunityHouseholdNames,
  getCommunityImportCounts,
} from "@/lib/community-data";

export default async function CommunityRecipesPage({
  searchParams,
}: PageProps<"/recipes/community">) {
  const params = await searchParams;
  const cuisine = typeof params.cuisine === "string" ? params.cuisine : "";
  const minRating = typeof params.minRating === "string" ? Number(params.minRating) : 0;
  const mineOnly = params.mine === "1";
  const sort = typeof params.sort === "string" ? params.sort : "name";

  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  let query = supabase
    .from("recipes")
    .select("id, name, cuisine, course, household_id, community_origin_id, image_url")
    .eq("is_shared", true)
    .order("name");
  if (cuisine) query = query.eq("cuisine", cuisine);
  if (mineOnly) query = query.eq("household_id", household.id);

  const { data: shared, error } = await query;
  if (error) throw new Error(error.message);

  const originIds = Array.from(
    new Set((shared ?? []).map((r) => r.community_origin_id ?? r.id)),
  );
  const householdIds = Array.from(
    new Set((shared ?? []).map((r) => r.household_id).filter((id): id is string => !!id)),
  );

  const [ratingsMap, namesMap, importCountsMap] = await Promise.all([
    getCommunityRatings(originIds),
    getCommunityHouseholdNames(householdIds),
    getCommunityImportCounts(originIds),
  ]);

  let cards: CommunityRecipeCard[] = (shared ?? []).map((r) => {
    const originId = r.community_origin_id ?? r.id;
    return {
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      course: r.course,
      isOwn: r.household_id === household.id,
      sharedByName: r.household_id ? (namesMap[r.household_id] ?? null) : null,
      rating: ratingsMap[originId] ?? null,
      importCount: importCountsMap[originId] ?? 0,
      imageUrl: r.image_url,
    };
  });

  if (minRating > 0) {
    cards = cards.filter((c) => c.rating && c.rating.avg >= minRating);
  }

  if (sort === "imports") {
    cards = [...cards].sort((a, b) => b.importCount - a.importCount);
  } else if (sort === "rating") {
    cards = [...cards].sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
  }

  const totalMyImports = mineOnly
    ? cards.filter((c) => c.isOwn).reduce((sum, c) => sum + c.importCount, 0)
    : 0;

  const cuisines = Array.from(
    new Set((shared ?? []).map((r) => r.cuisine).filter((c): c is string => !!c)),
  ).sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
        <p className="text-sm text-muted">
          {cards.length} community recipe{cards.length === 1 ? "" : "s"}
        </p>
      </div>

      <RecipeViewTabs active="community" />

      <p className="mb-4 text-xs text-muted">
        Community recipes aren&apos;t verified for accuracy. Always check ingredients yourself,
        especially for allergies.
      </p>

      {mineOnly && (
        <p className="mb-4 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          Your shared recipes have been imported{" "}
          <span className="font-medium">{totalMyImports}</span> time
          {totalMyImports === 1 ? "" : "s"} total.
        </p>
      )}

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="name">Sort: A–Z</option>
          <option value="imports">Sort: Most imported</option>
          <option value="rating">Sort: Top rated</option>
        </select>
        <select
          name="cuisine"
          defaultValue={cuisine}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="minRating"
          defaultValue={minRating || ""}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Any rating</option>
          <option value="4">★★★★ & up</option>
          <option value="3">★★★ & up</option>
          <option value="2">★★ & up</option>
          <option value="1">★ & up</option>
        </select>
        <label className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="mine"
            value="1"
            defaultChecked={mineOnly}
            className="h-4 w-4 accent-brand"
          />
          Recipes I&apos;ve shared
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Filter
        </button>
      </form>

      <CommunityRecipeList recipes={cards} />
    </div>
  );
}
