import { ingredientKey } from "@/lib/ingredient-match";

const DISCRETE_UNITS = new Set(["each", "clove", "slice", "can", "pack", "bunch", "pinch"]);
const SMALL_SPOON_UNITS = new Set(["tsp", "tbsp"]);

/**
 * Linear scaling produces fractions nobody actually measures out (2.33 eggs,
 * 0.83 cans). Rounds to an increment that matches how the unit is normally
 * measured, so scaled amounts stay usable rather than merely precise.
 */
export function smartRound(quantity: number, unit: string | null): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  const u = (unit ?? "").trim().toLowerCase();

  if (DISCRETE_UNITS.has(u)) {
    return Math.max(1, Math.round(quantity));
  }
  if (SMALL_SPOON_UNITS.has(u) || u === "cup") {
    return Math.round(quantity * 4) / 4;
  }
  if (u === "g" || u === "ml") {
    return Math.round(quantity);
  }
  if (u === "kg" || u === "l") {
    return Math.round(quantity * 20) / 20;
  }
  if (u === "oz" || u === "fl oz") {
    return Math.round(quantity * 2) / 2;
  }
  if (u === "lb" || u === "pint") {
    return Math.round(quantity * 4) / 4;
  }
  return Math.round(quantity * 100) / 100;
}

type ScalableIngredient = {
  ingredient_name: string;
  unit: string | null;
  quantity: number | null;
};

type AvailablePantryItem = {
  ingredient_name: string;
  unit: string | null;
  quantity: number;
};

/**
 * The most servings this recipe's pantry-tracked ingredients can stretch to,
 * i.e. the serving count where the first ingredient would run out. Returns
 * null when no ingredient in the recipe is tracked in the pantry at all —
 * there's nothing to base a number on, rather than claiming "0 servings".
 */
export function maxServingsFromPantry(
  ingredients: ScalableIngredient[],
  pantryItems: AvailablePantryItem[],
  baseServings: number,
): number | null {
  if (baseServings <= 0) return null;

  const pantryMap = new Map<string, number>();
  for (const p of pantryItems) {
    const key = ingredientKey(p.ingredient_name, p.unit);
    pantryMap.set(key, (pantryMap.get(key) ?? 0) + Number(p.quantity));
  }

  let limit: number | null = null;
  for (const ing of ingredients) {
    if (ing.quantity == null || ing.quantity <= 0) continue;
    const available = pantryMap.get(ingredientKey(ing.ingredient_name, ing.unit));
    if (available == null) continue;

    const perServing = ing.quantity / baseServings;
    const maxForThis = available / perServing;
    if (limit == null || maxForThis < limit) limit = maxForThis;
  }

  return limit == null ? null : Math.max(0, Math.floor(limit));
}
