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

export type PlanProposal = { date: string; recipeId: string; recipeName: string };

export type PreviewWeekResult = {
  proposals: PlanProposal[];
  skipped: { date: string; reason: string }[];
  usedFallbackPool: boolean;
};

export type ConfirmWeekResult = {
  confirmed: { date: string; recipeName: string }[];
  conflicted: { date: string; reason: string }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyFilters(pool: Recipe[], cuisines: string[], wellnessTags: string[]): Recipe[] {
  return pool.filter((r) => {
    const cuisineOk = cuisines.length === 0 || (r.cuisine && cuisines.includes(r.cuisine));
    const tagOk =
      wellnessTags.length === 0 ||
      (r.protein_tag && wellnessTags.includes(r.protein_tag)) ||
      r.tags?.some((t) => wellnessTags.includes(t));
    return cuisineOk && tagOk;
  });
}

async function getCandidatePool(householdId: string, cuisines: string[], wellnessTags: string[]) {
  const supabase = await createClient();
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("household_id", householdId)
    .eq("course", "main");
  if (error) throw new Error(error.message);

  const allRecipes = recipes ?? [];
  let candidates = applyFilters(allRecipes, cuisines, wellnessTags);
  const usedFallbackPool = candidates.length === 0 && (cuisines.length > 0 || wellnessTags.length > 0);
  if (usedFallbackPool) candidates = allRecipes;
  return { candidates, usedFallbackPool };
}

async function getAvgRatings(householdId: string) {
  const supabase = await createClient();
  const { data: ratingRows } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("household_id", householdId);
  const sums = new Map<string, { sum: number; count: number }>();
  for (const r of ratingRows ?? []) {
    const entry = sums.get(r.recipe_id) ?? { sum: 0, count: 0 };
    entry.sum += r.rating;
    entry.count += 1;
    sums.set(r.recipe_id, entry);
  }
  const avg = new Map<string, number>();
  for (const [id, { sum, count }] of sums) avg.set(id, sum / count);
  return avg;
}

function pickRandom(candidates: Recipe[], used: Set<string>): Recipe | null {
  const unused = shuffle(candidates.filter((r) => !used.has(r.id)));
  const pickFrom = unused.length > 0 ? unused : shuffle(candidates);
  return pickFrom[0] ?? null;
}

function pickTopRated(
  candidates: Recipe[],
  used: Set<string>,
  avgRatingByRecipe: Map<string, number>,
): Recipe | null {
  const unused = candidates.filter((r) => !used.has(r.id));
  const pickFrom = unused.length > 0 ? unused : candidates;
  if (pickFrom.length === 0) return null;
  return [...pickFrom].sort(
    (a, b) => (avgRatingByRecipe.get(b.id) ?? 0) - (avgRatingByRecipe.get(a.id) ?? 0),
  )[0];
}

/**
 * Proposes a week's dinners from the household's own saved recipes,
 * without saving anything yet. Never proposes a date that already has a
 * dinner planned.
 */
export async function previewWeekPlan(input: GenerateWeekInput): Promise<PreviewWeekResult> {
  const { household } = await getCurrentHousehold();
  const supabase = await createClient();

  const { data: existingEntries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("plan_date")
    .eq("household_id", household.id)
    .is("side_of", null)
    .eq("meal_slot", "dinner")
    .in("plan_date", input.dates);
  if (entriesError) throw new Error(entriesError.message);
  const filledDates = new Set((existingEntries ?? []).map((e) => e.plan_date));

  const { candidates, usedFallbackPool } = await getCandidatePool(
    household.id,
    input.cuisines,
    input.wellnessTags,
  );
  const avgRatingByRecipe = await getAvgRatings(household.id);

  const used = new Set<string>();
  const proposals: PlanProposal[] = [];
  const skipped: { date: string; reason: string }[] = [];

  for (const date of input.dates) {
    if (filledDates.has(date)) continue;
    if (input.skipDates.includes(date)) continue;

    if (candidates.length === 0) {
      skipped.push({ date, reason: "No saved recipes to pick from" });
      continue;
    }

    const recipe = input.specialDates.includes(date)
      ? pickTopRated(candidates, used, avgRatingByRecipe)
      : pickRandom(candidates, used);
    if (!recipe) {
      skipped.push({ date, reason: "No recipes available" });
      continue;
    }
    used.add(recipe.id);
    proposals.push({ date, recipeId: recipe.id, recipeName: recipe.name });
  }

  return { proposals, skipped, usedFallbackPool };
}

/** Re-picks just one day's proposal, excluding recipes already proposed elsewhere in the week. */
export async function regenerateDayPick(input: {
  date: string;
  excludeRecipeIds: string[];
  special: boolean;
  cuisines: string[];
  wellnessTags: string[];
}): Promise<PlanProposal | null> {
  const { household } = await getCurrentHousehold();
  const { candidates } = await getCandidatePool(household.id, input.cuisines, input.wellnessTags);
  const used = new Set(input.excludeRecipeIds);

  const recipe = input.special
    ? pickTopRated(candidates, used, await getAvgRatings(household.id))
    : pickRandom(candidates, used);

  return recipe ? { date: input.date, recipeId: recipe.id, recipeName: recipe.name } : null;
}

/**
 * Saves the approved proposals as dinner entries. Re-checks each date is
 * still empty first, in case something changed since the preview.
 */
export async function confirmWeekPlan(proposals: PlanProposal[]): Promise<ConfirmWeekResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  if (proposals.length === 0) {
    return { confirmed: [], conflicted: [] };
  }

  const dates = proposals.map((p) => p.date);
  const { data: existingEntries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("plan_date")
    .eq("household_id", household.id)
    .is("side_of", null)
    .eq("meal_slot", "dinner")
    .in("plan_date", dates);
  if (entriesError) throw new Error(entriesError.message);
  const filledDates = new Set((existingEntries ?? []).map((e) => e.plan_date));

  const confirmed: { date: string; recipeName: string }[] = [];
  const conflicted: { date: string; reason: string }[] = [];
  const inserts: {
    household_id: string;
    plan_date: string;
    meal_slot: "dinner";
    recipe_id: string;
    batch_multiplier: number;
    created_by?: string;
  }[] = [];

  for (const p of proposals) {
    if (filledDates.has(p.date)) {
      conflicted.push({ date: p.date, reason: "That day already got a dinner planned" });
      continue;
    }
    inserts.push({
      household_id: household.id,
      plan_date: p.date,
      meal_slot: "dinner",
      recipe_id: p.recipeId,
      batch_multiplier: 1,
      created_by: auth.user?.id,
    });
    confirmed.push({ date: p.date, recipeName: p.recipeName });
  }

  if (inserts.length) {
    const { error: insertError } = await supabase.from("meal_plan_entries").insert(inserts);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/planner");
  revalidatePath("/dashboard");
  revalidatePath("/shopping-list");

  return { confirmed, conflicted };
}
