import { ingredientKey } from "@/lib/ingredient-match";

export type RecipeMatch = { covered: number; total: number };

type MatchableIngredient = {
  recipe_id: string;
  ingredient_name: string;
  unit: string | null;
  quantity: number | null;
};

type MatchablePantryItem = {
  ingredient_name: string;
  unit: string | null;
  quantity: number;
};

/** For each recipe, how many of its ingredients are covered by current pantry stock. */
export function computeRecipeMatches(
  recipeIngredients: MatchableIngredient[],
  pantryItems: MatchablePantryItem[],
): Record<string, RecipeMatch> {
  const pantryMap = new Map<string, number>();
  for (const p of pantryItems) {
    const key = ingredientKey(p.ingredient_name, p.unit);
    pantryMap.set(key, (pantryMap.get(key) ?? 0) + Number(p.quantity));
  }

  const matches: Record<string, RecipeMatch> = {};
  for (const ri of recipeIngredients) {
    const match = matches[ri.recipe_id] ?? { covered: 0, total: 0 };
    match.total += 1;
    const key = ingredientKey(ri.ingredient_name, ri.unit);
    const available = pantryMap.get(key) ?? 0;
    if (ri.quantity == null || available >= ri.quantity) {
      match.covered += 1;
    }
    matches[ri.recipe_id] = match;
  }
  return matches;
}
