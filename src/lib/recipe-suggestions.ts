import { ingredientKey } from "@/lib/ingredient-match";
import { expiryStatus } from "@/lib/expiry";
import { MULTICOOKER_TAGS } from "@/lib/cooking-machine";

export type SuggestionMethod = "" | "multicooker" | "manual";

type MatchableIngredient = {
  recipe_id: string;
  ingredient_name: string;
  unit: string | null;
};

type MatchablePantryItem = {
  ingredient_name: string;
  unit: string | null;
  expiry_date: string | null;
};

/** For each recipe, how many of its ingredients match a pantry item that's expired or expiring soon. */
export function computeExpiringCounts(
  recipeIngredients: MatchableIngredient[],
  pantryItems: MatchablePantryItem[],
): Record<string, number> {
  const expiringKeys = new Set(
    pantryItems
      .filter((p) => expiryStatus(p.expiry_date) !== null)
      .map((p) => ingredientKey(p.ingredient_name, p.unit)),
  );

  const counts: Record<string, number> = {};
  for (const ri of recipeIngredients) {
    if (!expiringKeys.has(ingredientKey(ri.ingredient_name, ri.unit))) continue;
    counts[ri.recipe_id] = (counts[ri.recipe_id] ?? 0) + 1;
  }
  return counts;
}

/** Whether a recipe's tags match the requested cooking method filter. */
export function matchesMethod(tags: string[], method: SuggestionMethod): boolean {
  if (!method) return true;
  const isMulticooker = tags.some((t) => MULTICOOKER_TAGS.includes(t));
  return method === "multicooker" ? isMulticooker : !isMulticooker;
}
