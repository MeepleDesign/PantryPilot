"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { revalidatePath } from "next/cache";

function normalise(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Recalculate the shopping list from all not-yet-cooked meal plan entries,
 * minus compatible pantry stock. Manually added / ticked rows are preserved.
 */
export async function regenerateShoppingList() {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { data: entries, error: entriesError } = await supabase
    .from("meal_plan_entries")
    .select("batch_multiplier, recipe_id")
    .eq("household_id", household.id)
    .eq("cooked", false);
  if (entriesError) throw new Error(entriesError.message);

  const recipeIds = [...new Set((entries ?? []).map((e) => e.recipe_id))];

  const needed = new Map<string, { name: string; unit: string | null; qty: number }>();

  if (recipeIds.length) {
    const { data: recipeIngredients, error: riError } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .in("recipe_id", recipeIds);
    if (riError) throw new Error(riError.message);

    for (const entry of entries ?? []) {
      const ingredients = (recipeIngredients ?? []).filter(
        (ri) => ri.recipe_id === entry.recipe_id,
      );
      for (const ri of ingredients) {
        if (ri.quantity == null) continue;
        const key = `${normalise(ri.ingredient_name)}|${normalise(ri.unit ?? "")}`;
        const qty = ri.quantity * Number(entry.batch_multiplier);
        const existing = needed.get(key);
        if (existing) {
          existing.qty += qty;
        } else {
          needed.set(key, { name: ri.ingredient_name, unit: ri.unit, qty });
        }
      }
    }
  }

  const { data: pantryItems, error: pantryError } = await supabase
    .from("pantry_items")
    .select("ingredient_name, unit, quantity")
    .eq("household_id", household.id);
  if (pantryError) throw new Error(pantryError.message);

  const pantryMap = new Map<string, number>();
  for (const p of pantryItems ?? []) {
    const key = `${normalise(p.ingredient_name)}|${normalise(p.unit ?? "")}`;
    pantryMap.set(key, (pantryMap.get(key) ?? 0) + Number(p.quantity));
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("household_id", household.id)
    .eq("is_manual", false);
  if (existingError) throw new Error(existingError.message);

  const existingKeys = new Set(
    (existingRows ?? []).map(
      (r) => `${normalise(r.ingredient_name)}|${normalise(r.unit ?? "")}`,
    ),
  );

  const upserts = [...needed.entries()].map(([key, v]) => {
    const pantryQty = pantryMap.get(key) ?? 0;
    const toBuy = Math.max(0, v.qty - pantryQty);
    return {
      household_id: household.id,
      ingredient_name: v.name,
      unit: v.unit,
      needed_qty: v.qty,
      pantry_qty: Math.min(pantryQty, v.qty),
      to_buy_qty: toBuy,
      is_manual: false,
      updated_at: new Date().toISOString(),
    };
  });

  if (upserts.length) {
    const { error: upsertError } = await supabase
      .from("shopping_list_items")
      .upsert(upserts, { onConflict: "household_id,ingredient_name,unit" });
    if (upsertError) throw new Error(upsertError.message);
  }

  // Remove auto-generated rows that are no longer needed by the current plan.
  const neededKeys = new Set(needed.keys());
  const staleKeys = [...existingKeys].filter((k) => !neededKeys.has(k));
  for (const key of staleKeys) {
    const row = (existingRows ?? []).find(
      (r) => `${normalise(r.ingredient_name)}|${normalise(r.unit ?? "")}` === key,
    );
    if (row) {
      await supabase.from("shopping_list_items").delete().eq("id", row.id);
    }
  }

  revalidatePath("/shopping-list");
}

export async function addManualShoppingItem(input: {
  ingredient_name: string;
  unit: string | null;
  quantity: number;
}) {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();

  const { error } = await supabase.from("shopping_list_items").upsert(
    {
      household_id: household.id,
      ingredient_name: input.ingredient_name,
      unit: input.unit,
      needed_qty: input.quantity,
      pantry_qty: 0,
      to_buy_qty: input.quantity,
      is_manual: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "household_id,ingredient_name,unit" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
}

/**
 * Toggle a shopping list item's ticked state. On a genuine false -> true
 * transition (actually marking something as bought), add its to-buy
 * quantity to a matching pantry item, or create a new one.
 */
export async function toggleShoppingItem(id: string, ticked: boolean) {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  const { data: auth } = await supabase.auth.getUser();

  const { data: item, error: fetchError } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !item) throw new Error(fetchError?.message ?? "Item not found");

  const { error } = await supabase
    .from("shopping_list_items")
    .update({ ticked, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (ticked && !item.ticked && item.to_buy_qty > 0) {
    const { data: pantryItems } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("household_id", household.id);

    const match = (pantryItems ?? []).find(
      (p) =>
        normalise(p.ingredient_name) === normalise(item.ingredient_name) &&
        normalise(p.unit ?? "") === normalise(item.unit ?? ""),
    );

    if (match) {
      const newQty = Number(match.quantity) + Number(item.to_buy_qty);
      await supabase
        .from("pantry_items")
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq("id", match.id);

      await supabase.from("pantry_stock_history").insert({
        household_id: household.id,
        pantry_item_id: match.id,
        ingredient_name: match.ingredient_name,
        change_type: "add",
        quantity_delta: item.to_buy_qty,
        unit: match.unit,
        reason: "Bought from shopping list",
        created_by: auth.user?.id,
      });
    } else {
      const { data: newItem, error: insertError } = await supabase
        .from("pantry_items")
        .insert({
          household_id: household.id,
          ingredient_name: item.ingredient_name,
          storage_location: "cupboard",
          quantity: item.to_buy_qty,
          unit: item.unit,
          expiry_date: null,
          source: "manual",
          notes: null,
          created_by: auth.user?.id,
        })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      await supabase.from("pantry_stock_history").insert({
        household_id: household.id,
        pantry_item_id: newItem.id,
        ingredient_name: item.ingredient_name,
        change_type: "add",
        quantity_delta: item.to_buy_qty,
        unit: item.unit,
        reason: "Bought from shopping list",
        created_by: auth.user?.id,
      });
    }

    revalidatePath("/pantry");
    revalidatePath("/");
  }

  revalidatePath("/shopping-list");
}

export async function removeShoppingItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
}

export async function resetShoppingList() {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("household_id", household.id);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
}

export async function clearTickedItems() {
  const supabase = await createClient();
  const { household } = await getCurrentHousehold();
  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("household_id", household.id)
    .eq("ticked", true);
  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
}
