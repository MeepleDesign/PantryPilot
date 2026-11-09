"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import type { Recipe } from "@/lib/types";

export type GenerateWeekInput = {
  /** All dates in the visible week, in order (YYYY-MM-DD). */
  dates: string[];
  skipDates: string[];
  specialDates: string[];
  cuisines: string[];
  wellnessTags: string[];
};

export type GenerateWeekResult = {
  planned: { date: string; recipeName: string }[];
  skipped: { date: string; reason: string }[];
  usedFallbackPool: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fills empty dinner slots in the given dates from the household's own
 * saved recipes, no AI involved. Never touches a date that already has a
 * dinner planned.
 */
export async function generateWeekPlan(input: GenerateWeekInput): Promise<GenerateWeekResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("*")
    .eq("household_id", household.id)
    .eq("course", "main");
  if (recipesError) throw new Error(recipesError.message);

  const { data: existingEntries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("plan_date")
    .eq("household_id", household.id)
    .is("side_of", null)
    .eq("meal_slot", "dinner")
    .in("plan_date", input.dates);
  if (entriesError) throw new Error(entriesError.message);
  const filledDates = new Set((existingEntries ?? []).map((e) => e.plan_date));

  const { data: ratingRows } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("household_id", household.id);
  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of ratingRows ?? []) {
    const entry = sums.get(r.recipe_id) ?? { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    sums.set(r.recipe_id, entry);
  }
  const avgRatingByRecipe = new Map<string, number>();
  for (const [id, { sum, count }] of sums) avgRatingByRecipe.set(id, sum / count);

  function applyFilters(pool: Recipe[]): Recipe[] {
    return pool.filter((r) => {
      const cuisineOk = input.cuisines.length === 0 || (r.cuisine && input.cuisines.includes(r.cuisine));
      const tagOk =
        input.wellnessTags.length === 0 ||
        (r.protein_tag && input.wellnessTags.includes(r.protein_tag)) ||
        r.tags?.some((t) => input.wellnessTags.includes(t));
      return cuisineOk && tagOk;
    });
  }

  const allRecipes = recipes ?? [];
  let candidates = applyFilters(allRecipes);
  const usedFallbackPool = candidates.length === 0 && (input.cuisines.length > 0 || input.wellnessTags.length > 0);
  if (usedFallbackPool) candidates = allRecipes;

  const used = new Set<string>();

  function pickRandom(): Recipe | null {
    const unused = shuffle(candidates.filter((r) => !used.has(r.id)));
    const pickFrom = unused.length > 0 ? unused : shuffle(candidates);
    return pickFrom[0] ?? null;
  }

  function pickTopRated(): Recipe | null {
    const unused = candidates.filter((r) => !used.has(r.id));
    const pickFrom = unused.length > 0 ? unused : candidates;
    if (pickFrom.length === 0) return null;
    return [...pickFrom].sort(
      (a, b) => (avgRatingByRecipe.get(b.id) ?? 0) - (avgRatingByRecipe.get(a.id) ?? 0),
    )[0];
  }

  const planned: { date: string; recipeName: string }[] = [];
  const skipped: { date: string; reason: string }[] = [];
  const inserts: {
    household_id: string;
    plan_date: string;
    meal_slot: "dinner";
    recipe_id: string;
    batch_multiplier: number;
    created_by?: string;
  }[] = [];

  for (const date of input.dates) {
    if (filledDates.has(date)) continue;
    if (input.skipDates.includes(date)) continue;

    if (candidates.length === 0) {
      skipped.push({ date, reason: "No saved recipes to pick from" });
      continue;
    }

    const recipe = input.specialDates.includes(date) ? pickTopRated() : pickRandom();
    if (!recipe) {
      skipped.push({ date, reason: "No recipes available" });
      continue;
    }
    used.add(recipe.id);
    inserts.push({
      household_id: household.id,
      plan_date: date,
      meal_slot: "dinner",
      recipe_id: recipe.id,
      batch_multiplier: 1,
      created_by: auth.user?.id,
    });
    planned.push({ date, recipeName: recipe.name });
  }

  if (inserts.length) {
    const { error: insertError } = await supabase.from("meal_plan_entries").insert(inserts);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/planner");
  revalidatePath("/");
  revalidatePath("/shopping-list");

  return { planned, skipped, usedFallbackPool };
}
