"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";
import { normaliseIngredient as normalise } from "@/lib/ingredient-match";
import type { MealSlot } from "@/lib/types";

export async function addMealPlanEntry(input: {
  plan_date: string;
  meal_slot: MealSlot;
  recipe_id: string;
  batch_multiplier: number;
  side_of?: string | null;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("meal_plan_entries").insert({
    household_id: household.id,
    plan_date: input.plan_date,
    meal_slot: input.meal_slot,
    recipe_id: input.recipe_id,
    batch_multiplier: input.batch_multiplier,
    side_of: input.side_of ?? null,
    created_by: auth.user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/planner");
  revalidatePath("/");
  revalidatePath("/shopping-list");
}

export async function updateMealPlanBatch(id: string, batch_multiplier: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_plan_entries")
    .update({ batch_multiplier })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/planner");
  revalidatePath("/shopping-list");
}

export async function removeMealPlanEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plan_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/planner");
  revalidatePath("/");
  revalidatePath("/shopping-list");
}

/**
 * Mark a planned meal as cooked and deduct its scaled ingredients from
 * pantry stock, only where ingredient name + unit match reliably.
 */
export async function confirmCooked(entryId: string) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const { data: entry, error: entryError } = await supabase
    .from("meal_plan_entries")
    .select("*, recipes(servings, name)")
    .eq("id", entryId)
    .single();
  if (entryError || !entry) throw new Error(entryError?.message ?? "Entry not found");

  const { data: recipeIngredients, error: riError } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", entry.recipe_id);
  if (riError) throw new Error(riError.message);

  const { data: pantryItems, error: pantryError } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("household_id", household.id);
  if (pantryError) throw new Error(pantryError.message);

  for (const ri of recipeIngredients ?? []) {
    if (ri.quantity == null || !ri.unit) continue;
    const neededQty = ri.quantity * Number(entry.batch_multiplier);
    const matches = (pantryItems ?? []).filter(
      (p) =>
        normalise(p.ingredient_name) === normalise(ri.ingredient_name) &&
        p.unit &&
        normalise(p.unit) === normalise(ri.unit),
    );
    let remaining = neededQty;
    for (const match of matches) {
      if (remaining <= 0) break;
      const deduct = Math.min(match.quantity, remaining);
      remaining -= deduct;
      const newQty = match.quantity - deduct;

      await supabase
        .from("pantry_items")
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq("id", match.id);

      await supabase.from("pantry_stock_history").insert({
        household_id: household.id,
        pantry_item_id: match.id,
        ingredient_name: match.ingredient_name,
        change_type: "consume",
        quantity_delta: -deduct,
        unit: match.unit,
        reason: `Cooked: ${entry.recipes?.name ?? "recipe"}`,
        created_by: auth.user?.id,
      });
    }
  }

  const { error: updateError } = await supabase
    .from("meal_plan_entries")
    .update({ cooked: true, cooked_at: new Date().toISOString() })
    .eq("id", entryId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/planner");
  revalidatePath("/pantry");
  revalidatePath("/");
}
