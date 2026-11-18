import { normalizeIngredientName } from "@/lib/ingredient-name";
import type { KnownPrice } from "@/lib/actions/ingredient-prices";

export type RecipeCostEstimate = {
  costPerServing: number;
  pricedCount: number;
  totalCount: number;
};

/**
 * Prices are per purchased item/pack (same approximation the shopping list's
 * "Estimated cost" uses), not scaled to the quantity a recipe actually needs —
 * there's no per-unit price data to scale from. Good enough for a rough
 * per-serving figure, not for a precise grocery bill.
 */
export function estimateRecipeCost(
  ingredients: { ingredient_name: string }[],
  knownPrices: Record<string, KnownPrice>,
  servings: number,
): RecipeCostEstimate | null {
  if (!ingredients.length || servings <= 0) return null;

  let total = 0;
  let pricedCount = 0;
  for (const ing of ingredients) {
    const known = knownPrices[normalizeIngredientName(ing.ingredient_name)];
    if (known) {
      total += known.price;
      pricedCount++;
    }
  }

  if (pricedCount === 0) return null;

  return {
    costPerServing: total / servings,
    pricedCount,
    totalCount: ingredients.length,
  };
}
